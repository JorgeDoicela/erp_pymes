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
    async generatePayroll(month, year, adminId) {
        // 1. Verificación de duplicados: Evitar generar nómina dos veces para el mismo mes/año
        const periodDate = new Date(year, month - 1, 1);
        const existingPayroll = await prisma.payroll.findFirst({
            where: {
                period: periodDate
            }
        });

        if (existingPayroll) {
            throw new Error(`Ya existe una nómina para el período ${month}/${year}`);
        }

        // 2. Obtención de Parámetros Globales: IESS, Impuesto a la Renta, etc.
        const config = await prisma.payrollConfig.findFirst({
            where: { isActive: true },
            include: { items: true }
        });

        if (!config) {
            throw new Error("No hay configuración de nómina activa. Configure los parámetros primero.");
        }

        // 3. Selección de Empleados con Contrato Activo
        const employees = await prisma.employee.findMany({
            where: {
                contracts: {
                    some: {
                        status: 'Active'
                    }
                }
            },
            include: {
                contracts: {
                    where: { status: 'Active' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const employeeIds = employees.map(e => e.id);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

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

        const payrollDetails = [];
        let totalPayrollAmount = financial.from(0);

        // 4. Calculate for each employee
        for (const emp of employees) {
            const contract = emp.contracts[0];
            if (!contract) continue;

            const baseSalary = financial.from(contract.salary);

            // A. Attendance Data
            const records = attendanceMap.get(emp.id) || [];
            const absences = records.filter(r => r.status === 'Falta').length;

            let workedDays = config.workingDays - absences;
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
                const dayOfWeek = rec.date.getDay(); // 0 = Sunday, 6 = Saturday
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // 1. Night Surcharge (25%)
                if (hasNightSurcharge && rec.checkIn && rec.checkOut) {
                    const checkIn = new Date(rec.checkIn);
                    const checkOut = new Date(rec.checkOut);

                    const getOverlap = (start, end, rStart, rEnd) => {
                        const maxStart = new Date(Math.max(start, rStart));
                        const minEnd = new Date(Math.min(end, rEnd));
                        const diffMs = minEnd - maxStart;
                        return diffMs > 0 ? financial.divide(diffMs, 1000 * 60 * 60) : financial.from(0);
                    };

                    const n1Start = new Date(rec.date); n1Start.setHours(19, 0, 0, 0);
                    const n1End = new Date(rec.date); n1End.setDate(n1End.getDate() + 1); n1End.setHours(0, 0, 0, 0);

                    const n2Start = new Date(rec.date); n2Start.setHours(0, 0, 0, 0);
                    const n2End = new Date(rec.date); n2End.setHours(6, 0, 0, 0);

                    let nightHours = getOverlap(checkIn, checkOut, n1Start, n1End).plus(getOverlap(checkIn, checkOut, n2Start, n2End));

                    if (nightHours.gt(0)) {
                        nightSurchargeAmount = nightSurchargeAmount.plus(nightHours.mul(hourlyRate).mul(0.25));
                    }
                }

                // 2. Overtime Splits
                const hours = financial.from(rec.workedHours || 0);
                let dailyExpectedHours = financial.from(8);
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

            // 1. Global Config Items
            config.items.forEach(item => {
                let amount = financial.from(0);
                if (item.fixedValue) {
                    amount = financial.from(item.fixedValue);
                } else if (item.percentage) {
                    amount = financial.percentage(earnedSalary, item.percentage);
                }

                if (item.type === 'EARNING') {
                    employeeBonuses.push({ name: item.name, amount: financial.round(amount) });
                } else {
                    employeeDeductions.push({ name: item.name, amount: financial.round(amount) });
                }
            });

            // 2. Individual Benefits
            const benefits = benefitMap.get(emp.id) || [];
            benefits.forEach(benefit => {
                employeeBonuses.push({
                    name: benefit.name,
                    amount: financial.round(benefit.amount),
                    benefitId: benefit.id,
                    frequency: benefit.frequency
                });
            });

            const totalBonuses = employeeBonuses.reduce((acc, curr) => acc.plus(curr.amount), financial.from(0));
            const totalDeductions = employeeDeductions.reduce((acc, curr) => acc.plus(curr.amount), financial.from(0));

            let netSalary = earnedSalary.plus(overtimeTotalCost).minus(undertimeAmount).plus(totalBonuses).minus(totalDeductions);
            if (netSalary.lt(0)) netSalary = financial.from(0);

            if (undertimeAmount.gt(0)) {
                employeeDeductions.push({ name: 'Descuento por Horas No Trabajadas', amount: financial.round(undertimeAmount) });
            }

            payrollDetails.push({
                employeeId: emp.id,
                baseSalary: financial.round(baseSalary),
                workedDays: workedDays,
                overtimeHours: financial.round(totalOvertimeHours),
                overtimeAmount: financial.round(overtimeTotalCost),
                bonuses: JSON.stringify(employeeBonuses),
                deductions: JSON.stringify(employeeDeductions),
                netSalary: financial.round(netSalary)
            });
            totalPayrollAmount = totalPayrollAmount.plus(financial.round(netSalary));
        }

        // 5. Save to DB
        const payroll = await prisma.payroll.create({
            data: {
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

    async getPayrolls() {
        return await prisma.payroll.findMany({
            orderBy: { period: 'desc' }
        });
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

    async getPayrollById(id) {
        return await prisma.payroll.findUnique({
            where: { id },
            include: {
                details: {
                    include: { employee: true }
                }
            }
        });
    }

    async confirmPayroll(id, adminId) {
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: { details: true }
        });

        if (!payroll) throw new Error('Nómina no encontrada');
        if (payroll.status === 'APPROVED') throw new Error('Nómina ya está aprobada');

        // RNF-20: Validation before confirmation
        await this.validatePayrollTotals(id);

        // Process One-Time Benefits
        for (const detail of payroll.details) {
            const bonuses = JSON.parse(detail.bonuses || '[]');
            for (const bonus of bonuses) {
                if (bonus.benefitId && bonus.frequency === 'ONE_TIME') {
                    await prisma.employeeBenefit.update({
                        where: { id: bonus.benefitId },
                        data: { status: 'PROCESSED' }
                    });
                }
            }
        }

        const updated = await prisma.payroll.update({
            where: { id },
            data: { status: 'APPROVED' }
        });

        // Audit Log
        if (adminId) {
            auditRepository.createLog({
                entity: 'Payroll',
                entityId: id,
                action: 'CONFIRM',
                performedBy: adminId,
                details: `Confirmed payroll ${id}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return updated;
    }

    async generateBankFile(id) {
        const payroll = await prisma.payroll.findUnique({
            where: { id },
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
                const amount = det.netSalary.toFixed(2);

                csv += `${emp.identityCard},${name},${bank},${emp.accountType || 'AHORROS'},${account},${amount},Nómina ${new Date(payroll.period).toLocaleDateString()}\n`;
            }
        });

        return csv;
    }

    async markAsPaid(id, adminId) {
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
}

export default new PayrollCalculationService();
