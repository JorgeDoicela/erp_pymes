/**
 * @file payrollCalculationService.js
 * @description Motor de Cálculo de Nómina, Horas Extra, Recargo Nocturno, Beneficios de Ley y Deducciones (Código de Trabajo Ecuador).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';
import { decrypt, safeDecrypt } from '../../utils/encryption.js';
import { financial } from '../../utils/financialUtils.js';

class PayrollCalculationService {
    /**
     * Genera la nómina para todos los empleados activos en un período específico.
     * Realiza un proceso batch para optimizar consultas a la base de datos.
     * 
     * @param {number} month - Mes de la nómina (1-12)
     * @param {number} year - Año de la nómina (ej. 2026)
     * @param {string} adminId - ID del administrador que ejecuta la acción
     * @returns {Promise<Object>} Resumen del proceso de nómina
     */
    async generatePayroll(month, year, adminId = null, tenantId = null) {
        const periodDate = new Date(year, month - 1, 1);
        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // 1. Verificación de duplicados: Evitar generar nómina dos veces para el mismo mes/año en la misma empresa
        const existingPayroll = await prisma.payroll.findFirst({
            where: {
                period: periodDate,
                ...(tenantId ? { tenantId } : {})
            }
        });

        if (existingPayroll) {
            throw new Error(`Ya existe una nómina para el período ${month}/${year}`);
        }

        // 3. Obtención de Parámetros Globales
        const config = await prisma.payrollConfig.findFirst({
            where: {
                isActive: true,
                ...(tenantId ? { tenantId } : {})
            },
            include: { items: true }
        });

        if (!config) {
            throw new Error("No hay configuración de nómina activa. Configure los parámetros primero.");
        }

        // 4. Selección de Empleados con Contrato VIGENTE en este periodo específico
        // Un contrato es válido si empezó antes del fin de mes Y (no ha terminado o terminó después del inicio de mes)
        const employees = await prisma.employee.findMany({
            where: {
                ...(tenantId ? { tenantId } : {}),
                contracts: {
                    some: {
                        startDate: { lte: endDate },
                        OR: [
                            { endDate: null },
                            { endDate: { gte: startDate } }
                        ],
                        status: 'Active'
                    }
                }
            },
            include: {
                contracts: {
                    where: {
                        startDate: { lte: endDate },
                        OR: [
                            { endDate: null },
                            { endDate: { gte: startDate } }
                        ],
                        status: 'Active'
                    },
                    orderBy: { startDate: 'desc' },
                    take: 1
                }
            }
        });

        if (employees.length === 0) {
            throw new Error(`No se encontraron empleados con contratos activos para el periodo ${month}/${year}.`);
        }

        const employeeIds = employees.map(e => e.id);

        // a. Carga Batch de Asistencias: Minimiza el impacto en BD comparado con consultas individuales
        const allAttendance = await prisma.attendance.findMany({
            where: {
                employeeId: { in: employeeIds },
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const attendanceMap = new Map();
        allAttendance.forEach(rec => {
            if (!attendanceMap.has(rec.employeeId)) attendanceMap.set(rec.employeeId, []);
            attendanceMap.get(rec.employeeId).push(rec);
        });

        // b. Carga Batch de Horarios: Identifica turnos y recargos nocturnos
        const allSchedules = await prisma.employeeSchedule.findMany({
            where: {
                employeeId: { in: employeeIds },
                isActive: true,
                OR: [
                    { endDate: null },
                    { endDate: { gte: startDate } }
                ],
                startDate: { lte: endDate }
            },
            include: { shift: true }
        });

        const scheduleMap = new Map();
        allSchedules.forEach(sched => {
            if (!scheduleMap.has(sched.employeeId)) scheduleMap.set(sched.employeeId, []);
            scheduleMap.get(sched.employeeId).push(sched);
        });

        // c. Carga Batch de Beneficios Adicionales: Comisiones, Bonos, etc.
        const allBenefits = await prisma.employeeBenefit.findMany({
            where: {
                employeeId: { in: employeeIds },
                status: 'ACTIVE'
            }
        });

        const benefitMap = new Map();
        allBenefits.forEach(ben => {
            if (!benefitMap.has(ben.employeeId)) benefitMap.set(ben.employeeId, []);
            benefitMap.get(ben.employeeId).push(ben);
        });

        // d. Carga Batch de Anticipos de Sueldo / Préstamos Aprobados
        const allAdvances = await prisma.salaryAdvance.findMany({
            where: {
                employeeId: { in: employeeIds },
                status: 'APPROVED'
            }
        });

        const advanceMap = new Map();
        allAdvances.forEach(adv => {
            if (!advanceMap.has(adv.employeeId)) advanceMap.set(adv.employeeId, []);
            advanceMap.get(adv.employeeId).push(adv);
        });

        const payrollDetails = [];
        let totalPayrollAmount = financial.from(0);

        // 4. Calculate for each employee
        for (const emp of employees) {
            const contract = emp.contracts[0];
            if (!contract) continue;

            const baseSalary = financial.from(contract.salary);

            // A. Attendance Data & Contract Active Period Pro-rating
            const contractStart = new Date(contract.startDate);
            const contractEnd = contract.endDate ? new Date(contract.endDate) : null;

            const effectiveStart = contractStart > startDate ? contractStart : startDate;
            const effectiveEnd = (contractEnd && contractEnd < endDate) ? contractEnd : endDate;

            const effectiveDaysInPeriod = Math.max(0, Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1);
            const isFullMonth = effectiveStart.getTime() === startDate.getTime() && (!contractEnd || contractEnd >= endDate);
            const maxEligibleDays = isFullMonth ? config.workingDays : Math.min(config.workingDays, effectiveDaysInPeriod);

            const records = attendanceMap.get(emp.id) || [];
            const absences = records.filter(r => r.status === 'Falta').length;

            let workedDays = maxEligibleDays - absences;
            if (workedDays < 0) workedDays = 0;

            let totalOvertimeHours = financial.from(0);
            let totalUndertimeHours = financial.from(0);

            const schedules = scheduleMap.get(emp.id) || [];

            records.forEach(rec => {
                const hours = financial.from(rec.workedHours || 0);

                let expectedHours = financial.from(8);
                const recDate = new Date(rec.date);

                const dailySchedule = schedules.find(sched => {
                    const sStart = new Date(sched.startDate);
                    const sEnd = sched.endDate ? new Date(sched.endDate) : new Date(2100, 0, 1);
                    return recDate >= sStart && recDate <= sEnd;
                });

                if (dailySchedule && dailySchedule.shift) {
                    const [sh, sm] = dailySchedule.shift.startTime.split(':').map(Number);
                    const [eh, em] = dailySchedule.shift.endTime.split(':').map(Number);

                    let shiftDuration = financial.from(eh).plus(financial.divide(em, 60)).minus(financial.from(sh).plus(financial.divide(sm, 60)));
                    if (shiftDuration.lt(0)) shiftDuration = shiftDuration.plus(24);

                    const breakHours = financial.divide(dailySchedule.shift.breakMinutes || 60, 60);
                    expectedHours = shiftDuration.minus(breakHours);
                    if (expectedHours.lt(0)) expectedHours = financial.from(0);
                }

                // Overtime Calculation
                if (rec.overtimeHours !== undefined && rec.overtimeHours !== null) {
                    totalOvertimeHours = totalOvertimeHours.plus(rec.overtimeHours);
                } else if (hours.gt(expectedHours)) {
                    totalOvertimeHours = totalOvertimeHours.plus(hours.minus(expectedHours));
                }

                // Undertime Calculation
                if (hours.lt(expectedHours) && hours.gt(0)) {
                    totalUndertimeHours = totalUndertimeHours.plus(expectedHours.minus(hours));
                }
            });

            // B. Calculations
            const salaryPerDay = financial.divide(baseSalary, config.workingDays);
            const earnedSalary = financial.multiply(salaryPerDay, workedDays);

            // Base Hourly Rate: Salary / (WorkingDays * 8)
            const hourlyRate = financial.divide(baseSalary, financial.multiply(config.workingDays, 8));

            const hasNightSurcharge = contract.hasNightSurcharge ?? true;
            const hasDoubleOvertime = contract.hasDoubleOvertime ?? true;

            let nightSurchargeAmount = financial.from(0);
            let overtimeTotalCost = financial.from(0);

            const employeeBonuses = [];
            const employeeDeductions = [];

            records.forEach(rec => {
                const recDate = new Date(rec.date);
                const dayOfWeek = recDate.getUTCDay(); // 0 = Sunday, 6 = Saturday (UTC to avoid server TZ shift)
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // 1. Recargo Nocturno (25% - Art. 49 Código del Trabajo de Ecuador: 19h00 a 06h00)
                if (hasNightSurcharge && rec.checkIn && rec.checkOut) {
                    const checkIn = new Date(rec.checkIn);
                    const checkOut = new Date(rec.checkOut);

                    const getOverlapHours = (start, end, winStart, winEnd) => {
                        const maxStart = Math.max(start.getTime(), winStart.getTime());
                        const minEnd = Math.min(end.getTime(), winEnd.getTime());
                        const diffMs = minEnd - maxStart;
                        return diffMs > 0 ? financial.divide(diffMs, 1000 * 60 * 60) : financial.from(0);
                    };

                    const baseD = new Date(rec.date);
                    // Ventana nocturna 1: 19:00 del día del turno a 24:00 (00:00 día + 1)
                    const n1Start = new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate(), 19, 0, 0, 0);
                    const n1End = new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate() + 1, 0, 0, 0, 0);

                    // Ventana nocturna 2: 00:00 a 06:00 del día siguiente (si el turno cruza medianoche)
                    const n2Start = new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate() + 1, 0, 0, 0, 0);
                    const n2End = new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate() + 1, 6, 0, 0, 0);

                    // Ventana nocturna 0: 00:00 a 06:00 del mismo día (si el turno inició en la madrugada del día)
                    const n0Start = new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate(), 0, 0, 0, 0);
                    const n0End = new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate(), 6, 0, 0, 0);

                    let nightHours = getOverlapHours(checkIn, checkOut, n1Start, n1End)
                        .plus(getOverlapHours(checkIn, checkOut, n2Start, n2End))
                        .plus(getOverlapHours(checkIn, checkOut, n0Start, n0End));

                    if (nightHours.gt(0)) {
                        nightSurchargeAmount = nightSurchargeAmount.plus(nightHours.mul(hourlyRate).mul(0.25));
                    }
                }

                // 2. Overtime Splits
                const hours = financial.from(rec.workedHours || 0);
                let dailyExpectedHours = financial.from(8);
                const dailySchedule = schedules.find(sched => {
                    const sStart = new Date(sched.startDate);
                    const sEnd = sched.endDate ? new Date(sched.endDate) : new Date(2100, 0, 1);
                    return recDate >= sStart && recDate <= sEnd;
                });

                if (dailySchedule && dailySchedule.shift) {
                    const [sh, sm] = dailySchedule.shift.startTime.split(':').map(Number);
                    const [eh, em] = dailySchedule.shift.endTime.split(':').map(Number);
                    let shiftDuration = financial.from(eh).plus(financial.divide(em, 60)).minus(financial.from(sh).plus(financial.divide(sm, 60)));
                    if (shiftDuration.lt(0)) shiftDuration = shiftDuration.plus(24);
                    const breakHours = financial.divide(dailySchedule.shift.breakMinutes || 60, 60);
                    dailyExpectedHours = shiftDuration.minus(breakHours);
                    if (dailyExpectedHours.lt(0)) dailyExpectedHours = financial.from(0);
                }

                if (rec.overtimeHours !== undefined && rec.overtimeHours !== null) {
                    const dailyOvertime = financial.from(rec.overtimeHours);
                    if (dailyOvertime.gt(0)) {
                        const multiplier = (isWeekend && hasDoubleOvertime) ? 2.0 : 1.5;
                        overtimeTotalCost = overtimeTotalCost.plus(dailyOvertime.mul(hourlyRate).mul(multiplier));
                    }
                } else if (hours.gt(dailyExpectedHours)) {
                    const dailyOvertime = hours.minus(dailyExpectedHours);
                    if (dailyOvertime.gt(0)) {
                        const multiplier = (isWeekend && hasDoubleOvertime) ? 2.0 : 1.5;
                        overtimeTotalCost = overtimeTotalCost.plus(dailyOvertime.mul(hourlyRate).mul(multiplier));
                    }
                }
            });

            const undertimeAmount = totalUndertimeHours.mul(hourlyRate);

            if (nightSurchargeAmount.gt(0)) {
                employeeBonuses.push({ name: 'Recargo Nocturno (25%)', amount: financial.round(nightSurchargeAmount) });
            }

            // 2. Individual Benefits (Bonos, Comisiones, etc.)
            const benefits = benefitMap.get(emp.id) || [];
            let individualBonusesTotal = financial.from(0);
            benefits.forEach(benefit => {
                const benAmount = financial.from(benefit.amount);
                individualBonusesTotal = individualBonusesTotal.plus(benAmount);
                employeeBonuses.push({
                    name: benefit.name,
                    amount: financial.round(benAmount),
                    benefitId: benefit.id,
                    frequency: benefit.frequency
                });
            });

            // Materia Gravada IESS (Sueldo ganado + Horas Extras + Recargo Nocturno + Comisiones/Bonos)
            const taxableEarnings = earnedSalary.plus(overtimeTotalCost).plus(nightSurchargeAmount).plus(individualBonusesTotal);

            // 1. Global Config Items (Deducciones IESS, Impuesto a la renta, etc.)
            config.items.forEach(item => {
                let amount = financial.from(0);
                if (item.fixedValue) {
                    amount = financial.from(item.fixedValue);
                } else if (item.percentage) {
                    // Si es deducción de ley como aporte al IESS, se calcula sobre la materia gravada completa
                    const base = item.type === 'DEDUCTION' ? taxableEarnings : earnedSalary;
                    amount = financial.percentage(base, item.percentage);
                }

                if (item.type === 'EARNING') {
                    employeeBonuses.push({ name: item.name, amount: financial.round(amount) });
                } else {
                    employeeDeductions.push({ name: item.name, amount: financial.round(amount) });
                }
            });

            // 3. Anticipos de Sueldo / Préstamos Aprobados
            const employeeAdvances = advanceMap.get(emp.id) || [];
            employeeAdvances.forEach(adv => {
                const quotaNumber = adv.paidInstallments + 1;
                if (quotaNumber <= adv.installments) {
                    employeeDeductions.push({
                        name: `Anticipo/Préstamo (Cuota ${quotaNumber}/${adv.installments})`,
                        amount: financial.round(adv.monthlyDeduction),
                        advanceId: adv.id
                    });
                }
            });

            if (undertimeAmount.gt(0)) {
                employeeDeductions.push({ name: 'Descuento por Horas No Trabajadas', amount: financial.round(undertimeAmount) });
            }

            const totalBonuses = employeeBonuses.reduce((acc, curr) => acc.plus(curr.amount), financial.from(0));
            const totalDeductions = employeeDeductions.reduce((acc, curr) => acc.plus(curr.amount), financial.from(0));

            const roundedBaseSalary = financial.round(earnedSalary);
            const roundedOvertimeAmount = financial.round(overtimeTotalCost);

            let netSalary = financial.from(roundedBaseSalary)
                .plus(roundedOvertimeAmount)
                .plus(totalBonuses)
                .minus(totalDeductions);

            if (netSalary.lt(0)) netSalary = financial.from(0);

            const finalNetSalary = financial.round(netSalary);

            payrollDetails.push({
                employeeId: emp.id,
                baseSalary: roundedBaseSalary,
                workedDays: workedDays,
                overtimeHours: financial.round(totalOvertimeHours),
                overtimeAmount: roundedOvertimeAmount,
                bonuses: JSON.stringify(employeeBonuses),
                deductions: JSON.stringify(employeeDeductions),
                netSalary: finalNetSalary
            });
            totalPayrollAmount = totalPayrollAmount.plus(finalNetSalary);
        }

        // 5. Save to DB
        const payroll = await prisma.payroll.create({
            data: {
                tenantId,
                period: periodDate,
                endDate: new Date(year, month, 0),
                totalAmount: financial.round(totalPayrollAmount),
                status: 'DRAFT',
                details: {
                    create: payrollDetails
                }
            },
            include: {
                details: {
                    include: { employee: true }
                }
            }
        });

        // Audit Log
        if (adminId) {
            auditRepository.createLog({
                entity: 'Payroll',
                entityId: payroll.id,
                action: 'GENERATE',
                performedBy: adminId,
                details: `Generated payroll for ${month}/${year}. Total: ${payroll.totalAmount}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return payroll;
    }

    async validatePayrollTotals(payrollId) {
        const payroll = await prisma.payroll.findUnique({
            where: { id: payrollId },
            include: { details: true }
        });

        if (!payroll) throw new Error('Nómina no encontrada para validación');

        const calculatedTotal = payroll.details.reduce((acc, detail) => acc.plus(detail.netSalary), financial.from(0));
        const storedTotal = financial.from(payroll.totalAmount);

        if (!calculatedTotal.equals(storedTotal)) {
            throw new Error(`Inconsistencia detectada: El total de detalles (${calculatedTotal}) no coincide con el total de cabecera (${storedTotal}).`);
        }

        return true;
    }

    async getPayrolls(page = 1, limit = 10, tenantId = null) {
        const skip = (page - 1) * limit;
        const where = tenantId ? { tenantId } : {};
        const [payrolls, total] = await Promise.all([
            prisma.payroll.findMany({
                where,
                skip,
                take: limit,
                orderBy: { period: 'desc' }
            }),
            prisma.payroll.count({ where })
        ]);

        return {
            data: payrolls,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getPayrollsByEmployee(employeeId) {
        return await prisma.payrollDetail.findMany({
            where: { employeeId },
            include: {
                payroll: true,
                employee: true
            },
            orderBy: {
                payroll: { period: 'desc' }
            }
        });
    }

    async getPayrollById(id, tenantId = null) {
        const payroll = await prisma.payroll.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {})
            },
            include: {
                details: {
                    include: {
                        employee: {
                            include: {
                                contracts: {
                                    orderBy: { startDate: 'desc' },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!payroll) throw new Error('Nómina no encontrada');
        return payroll;
    }

    async confirmPayroll(id, adminId, tenantId = null) {
        return await prisma.$transaction(async (tx) => {
            const payroll = await tx.payroll.findFirst({
                where: {
                    id,
                    ...(tenantId ? { tenantId } : {})
                },
                include: { details: true }
            });

            if (!payroll) throw new Error('Nómina no encontrada');
            if (payroll.status === 'APPROVED') throw new Error('Nómina ya está aprobada');

            // RNF-20: Validation before confirmation
            const calculatedTotal = payroll.details.reduce((acc, detail) => acc.plus(detail.netSalary), financial.from(0));
            const storedTotal = financial.from(payroll.totalAmount);

            if (!calculatedTotal.equals(storedTotal)) {
                throw new Error(`Inconsistencia detectada: El total de detalles (${calculatedTotal}) no coincide con el total de cabecera (${storedTotal}).`);
            }

            // Process One-Time Benefits & Salary Advances in Batch
            const benefitIdsToProcess = [];
            const advanceDeductions = [];

            for (const detail of payroll.details) {
                const bonuses = typeof detail.bonuses === 'string' ? JSON.parse(detail.bonuses || '[]') : (detail.bonuses || []);
                for (const bonus of bonuses) {
                    if (bonus.benefitId && bonus.frequency === 'ONE_TIME') {
                        benefitIdsToProcess.push(bonus.benefitId);
                    }
                }

                const deductions = typeof detail.deductions === 'string' ? JSON.parse(detail.deductions || '[]') : (detail.deductions || []);
                for (const ded of deductions) {
                    if (ded.advanceId) {
                        advanceDeductions.push({ advanceId: ded.advanceId, amount: ded.amount || 0 });
                    }
                }
            }

            if (benefitIdsToProcess.length > 0) {
                await tx.employeeBenefit.updateMany({
                    where: { id: { in: benefitIdsToProcess } },
                    data: { status: 'PROCESSED' }
                });
            }

            if (advanceDeductions.length > 0) {
                const advanceIds = advanceDeductions.map(a => a.advanceId);
                const advances = await tx.salaryAdvance.findMany({
                    where: { id: { in: advanceIds } }
                });
                const advanceMap = new Map(advances.map(a => [a.id, a]));

                for (const ded of advanceDeductions) {
                    const adv = advanceMap.get(ded.advanceId);
                    if (adv) {
                        const newPaidInstallments = adv.paidInstallments + 1;
                        const newPaidAmount = financial.round(financial.from(adv.paidAmount).plus(ded.amount));
                        const isFullyPaid = newPaidInstallments >= adv.installments || newPaidAmount >= adv.amount;

                        await tx.salaryAdvance.update({
                            where: { id: ded.advanceId },
                            data: {
                                paidInstallments: newPaidInstallments,
                                paidAmount: newPaidAmount,
                                status: isFullyPaid ? 'PAID' : 'APPROVED'
                            }
                        });
                    }
                }
            }

            const updated = await tx.payroll.update({
                where: { id },
                data: { status: 'APPROVED' }
            });

            // Audit Log
            if (adminId) {
                await auditRepository.createLog({
                    entity: 'Payroll',
                    entityId: id,
                    action: 'CONFIRM',
                    performedBy: adminId,
                    details: `Confirmed payroll ${id}`
                }, tx).catch(err => console.error('Audit Log Error:', err));
            }

            return updated;
        });
    }

    async generateBankFile(id, tenantId = null) {
        const payroll = await prisma.payroll.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {})
            },
            include: {
                details: {
                    include: { employee: true }
                }
            }
        });

        if (!payroll) throw new Error('Nómina no encontrada');

        let csv = 'Identificacion,Beneficiario,Banco,TipoCuenta,NumeroCuenta,Monto,Detalle\n';

        payroll.details.forEach(det => {
            const emp = det.employee;
            if (emp.bankName && emp.accountNumber) {
                const firstName = emp.firstName || '';
                const lastName = emp.lastName || '';
                const name = `${firstName} ${lastName}`.replace(/,/g, '');

                let bank = '';
                let account = '';

                try {
                    bank = safeDecrypt(emp.bankName).replace(/,/g, '');
                    account = safeDecrypt(emp.accountNumber);
                } catch (e) {
                    bank = 'ERROR_DECRYPT';
                    account = 'ERROR_DECRYPT';
                }

                // RNF-20: Ensure 2 decimals in bank file
                const amount = Number(det.netSalary || 0).toFixed(2);

                csv += `${emp.identityCard},${name},${bank},${emp.accountType || 'AHORROS'},${account},${amount},Nómina ${new Date(payroll.period).toLocaleDateString()}\n`;
            }
        });

        return csv;
    }

    async markAsPaid(id, adminId, tenantId = null) {
        const payroll = await prisma.payroll.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {})
            }
        });

        if (!payroll) throw new Error('Nómina no encontrada');

        const updated = await prisma.payroll.update({
            where: { id },
            data: {
                status: 'PAID',
                paymentDate: new Date()
            }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'Payroll',
                entityId: id,
                action: 'PAYMENT',
                performedBy: adminId,
                details: `Marked payroll ${id} as PAID`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return updated;
    }

    async updatePayrollDetail(detailId, data, adminId, tenantId = null) {
        return await prisma.$transaction(async (tx) => {
            const detail = await tx.payrollDetail.findFirst({
                where: {
                    id: detailId,
                    ...(tenantId ? { payroll: { tenantId } } : {})
                },
                include: { payroll: true }
            });

            if (!detail) throw new Error('Detalle de nómina no encontrado');
            if (detail.payroll.status !== 'DRAFT') {
                throw new Error(`No se puede editar una nómina en estado ${detail.payroll.status}. Solo se permiten cambios en modo BORRADOR.`);
            }

            // Recalcular el Neto basado en los nuevos valores o los existentes
            const bonuses = data.bonuses ? (typeof data.bonuses === 'string' ? JSON.parse(data.bonuses) : data.bonuses) : (typeof detail.bonuses === 'string' ? JSON.parse(detail.bonuses) : detail.bonuses);
            const deductions = data.deductions ? (typeof data.deductions === 'string' ? JSON.parse(data.deductions) : data.deductions) : (typeof detail.deductions === 'string' ? JSON.parse(detail.deductions) : detail.deductions);

            const totalBonuses = bonuses.reduce((acc, curr) => acc.plus(curr.amount), financial.from(0));
            const totalDeductions = deductions.reduce((acc, curr) => acc.plus(curr.amount), financial.from(0));

            const baseSalary = financial.from(data.baseSalary ?? detail.baseSalary);
            const overtimeAmount = financial.from(data.overtimeAmount ?? detail.overtimeAmount);

            const netSalary = baseSalary.plus(overtimeAmount).plus(totalBonuses).minus(totalDeductions);

            const updatedDetail = await tx.payrollDetail.update({
                where: { id: detailId },
                data: {
                    baseSalary: financial.round(baseSalary),
                    overtimeAmount: financial.round(overtimeAmount),
                    bonuses: JSON.stringify(bonuses),
                    deductions: JSON.stringify(deductions),
                    netSalary: financial.round(netSalary),
                    workedDays: data.workedDays ?? detail.workedDays
                }
            });

            // Recalcular el total general de la nómina (Payroll)
            const allDetails = await tx.payrollDetail.findMany({
                where: { payrollId: detail.payrollId }
            });

            const newTotalAmount = allDetails.reduce((acc, d) => acc.plus(d.netSalary), financial.from(0));

            await tx.payroll.update({
                where: { id: detail.payrollId },
                data: { totalAmount: financial.round(newTotalAmount) }
            });

            if (adminId) {
                await auditRepository.createLog({
                    entity: 'PayrollDetail',
                    entityId: detailId,
                    action: 'UPDATE_MANUAL',
                    performedBy: adminId,
                    details: `Manual adjustment for employee in payroll ${detail.payrollId}. New Net: ${updatedDetail.netSalary}`
                }, tx).catch(err => console.error('Audit Log Error:', err));
            }

            return updatedDetail;
        });
    }

    async deletePayroll(id, adminId, tenantId = null) {
        return await prisma.$transaction(async (tx) => {
            const payroll = await tx.payroll.findFirst({
                where: {
                    id,
                    ...(tenantId ? { tenantId } : {})
                }
            });

            if (!payroll) throw new Error('Nómina no encontrada');
            if (payroll.status !== 'DRAFT') {
                throw new Error(`No se puede eliminar una nómina en estado ${payroll.status}. Solo se permiten eliminaciones en modo BORRADOR.`);
            }

            await tx.payrollDetail.deleteMany({
                where: { payrollId: id }
            });

            const deleted = await tx.payroll.delete({
                where: { id }
            });

            if (adminId) {
                await auditRepository.createLog({
                    entity: 'Payroll',
                    entityId: id,
                    action: 'DELETE',
                    performedBy: adminId,
                    details: `Deleted payroll draft for period ${payroll.period}`
                }, tx).catch(err => console.error('Audit Log Error:', err));
            }

            return deleted;
        });
    }
}

export default new PayrollCalculationService();
