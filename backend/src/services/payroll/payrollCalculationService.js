import prisma from '../../database/db.js';

class PayrollCalculationService {
    async generatePayroll(month, year) {
        // 1. Check if payroll already exists for this period
        // Period is 1st day of the month
        const periodDate = new Date(year, month - 1, 1);
        const existingPayroll = await prisma.payroll.findFirst({
            where: {
                period: periodDate
            }
        });

        if (existingPayroll) {
            throw new Error(`Ya existe una nómina para el período ${month}/${year}`);
        }

        // 2. Get Configuration
        const config = await prisma.payrollConfig.findFirst({
            where: { isActive: true },
            include: { items: true }
        });

        if (!config) {
            throw new Error("No hay configuración de nómina activa. Configure los parámetros primero.");
        }

        // 3. Get Active Employees with Contracts
        const employees = await prisma.employee.findMany({
            where: {
                // Ensure they have at least one active contract
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

        const payrollDetails = [];
        let totalPayrollAmount = 0;

        // 4. Calculate for each employee
        for (const emp of employees) {
            const contract = emp.contracts[0];
            if (!contract) continue; // Skip if no active contract

            const baseSalary = contract.salary;

            // A. Attendance Data (Mocked or Real)
            // Ideally we query Attendance model for count of 'Late', 'Absent', 'WorkedHours'
            // For now, we assume 30 days unless absent
            // Logic: Get 'Absent' count in the date range
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month

            const absences = await prisma.attendance.count({
                where: {
                    employeeId: emp.id,
                    status: 'Falta',
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            // Fetch attendance records for overtime calc

            // Fetch attendance records for overtime calc
            const records = await prisma.attendance.findMany({
                where: {
                    employeeId: emp.id,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            let workedDays = config.workingDays - absences; // Default 30 - absences
            if (workedDays < 0) workedDays = 0;

            let totalOvertimeHours = 0;
            let totalUndertimeHours = 0; // Hours not worked (e.g. worked 6 out of 8)

            // Fetch schedules for this employee in this period
            // Note: This is an approximation. Ideally we fetch all schedules overlapping the month.
            const schedules = await prisma.employeeSchedule.findMany({
                where: {
                    employeeId: emp.id,
                    isActive: true,
                    OR: [
                        { endDate: null },
                        { endDate: { gte: startDate } }
                    ],
                    startDate: { lte: endDate }
                },
                include: { shift: true }
            });

            records.forEach(rec => {
                const hours = rec.workedHours || 0;

                // Determine expected hours for this specific day
                let expectedHours = 8; // Default
                const recDate = new Date(rec.date);

                // Find applicable schedule
                const dailySchedule = schedules.find(sched => {
                    const sStart = new Date(sched.startDate);
                    const sEnd = sched.endDate ? new Date(sched.endDate) : new Date(2100, 0, 1);
                    return recDate >= sStart && recDate <= sEnd;
                });

                if (dailySchedule && dailySchedule.shift) {
                    const [sh, sm] = dailySchedule.shift.startTime.split(':').map(Number);
                    const [eh, em] = dailySchedule.shift.endTime.split(':').map(Number);

                    // Simple duration calc (assuming same day shift)
                    let shiftDuration = (eh + em / 60) - (sh + sm / 60);
                    if (shiftDuration < 0) shiftDuration += 24; // Handle overnight if needed

                    // Subtract break time (default 60 mins if not set or 0)
                    const breakHours = (dailySchedule.shift.breakMinutes || 60) / 60;
                    expectedHours = shiftDuration - breakHours;
                    if (expectedHours < 0) expectedHours = 0; // Should not happen but safety check
                }

                // Overtime Calculation
                if (rec.overtimeHours !== undefined && rec.overtimeHours !== null) {
                    totalOvertimeHours += rec.overtimeHours;
                } else if (hours > expectedHours) {
                    totalOvertimeHours += (hours - expectedHours);
                }

                // Undertime Calculation (Strict Pay)
                // If present but worked less than expected hours
                // Tolerance: We might want a small buffer, but user asked for strict.
                if (hours < expectedHours && hours > 0) {
                    totalUndertimeHours += (expectedHours - hours);
                }
            });

            // B. Calculations
            // Proportional Salary
            // Proportional Salary
            const salaryPerDay = baseSalary / config.workingDays; // 30
            const earnedSalary = salaryPerDay * workedDays;

            // Base Hourly Rate
            // Hourly rate logic: Fixed 240 hours (30 * 8).
            const hourlyRate = baseSalary / (config.workingDays * 8);

            // Fetch Contract Config
            const hasNightSurcharge = contract.hasNightSurcharge ?? true;
            const hasDoubleOvertime = contract.hasDoubleOvertime ?? true;

            // Calculate Surcharges
            let nightSurchargeAmount = 0;
            let extraordinaryAmount = 0; // For 100% overtime
            let normalOvertimeAmount = 0; // For 50% overtime
            let overtimeTotalCost = 0; // CRITICAL: Declare before use

            // Items (Bonuses/Deductions) - Declare early to avoid reference errors
            const employeeBonuses = [];
            const employeeDeductions = [];

            // We need to iterate records again or store data better.
            // Let's iterate.
            records.forEach(rec => {
                const dayOfWeek = rec.date.getDay(); // 0 = Sunday, 6 = Saturday
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // 1. Night Surcharge (25%) - Applies to ALL hours worked in night window (19:00 - 06:00)
                if (hasNightSurcharge && rec.checkIn && rec.checkOut) {
                    const checkIn = new Date(rec.checkIn);
                    const checkOut = new Date(rec.checkOut);

                    // Simple logic: Check overlap with 19:00-06:00
                    // Handle range crossing midnight.
                    // Night Window 1: 19:00 same day to 23:59:59
                    // Night Window 2: 00:00 same day to 06:00 same day (if started previous day? No, records are daily)
                    // Assumption: Records split by day or we handle the span. 
                    // Current system registers "ENTRY" and "EXIT". If spread across days, we need logic.
                    // Assuming contained or handled. Let's simplify:
                    // Only count hours actually in 19:00-06:00 period.

                    const nightStart = new Date(checkIn);
                    nightStart.setHours(19, 0, 0, 0);

                    const nightEndObj = new Date(checkIn);
                    nightEndObj.setDate(nightEndObj.getDate() + 1);
                    nightEndObj.setHours(6, 0, 0, 0);

                    // Case A: Work completely in day (08:00 - 17:00) -> No night.
                    // Case B: Work 14:00 - 22:00 -> Night from 19:00-22:00 (3h)

                    // Calculate Overlap [checkIn, checkOut] vs [19:00, 06:00+1]
                    // Complication: The "06:00" might be of the *next* day if they entered late?
                    // Or "06:00" of *this* day if they entered at 04:00?
                    // Let's treat standard shift logic.

                    // Helper: Calculate overlap in minutes against a specific range
                    const getOverlap = (start, end, rStart, rEnd) => {
                        const maxStart = new Date(Math.max(start, rStart));
                        const minEnd = new Date(Math.min(end, rEnd));
                        return Math.max(0, (minEnd - maxStart) / (1000 * 60 * 60)); // In Hours
                    };

                    // Window 1: Same day 19:00 - 23:59:59 (approx 24:00)
                    const n1Start = new Date(rec.date); n1Start.setHours(19, 0, 0, 0);
                    const n1End = new Date(rec.date); n1End.setDate(n1End.getDate() + 1); n1End.setHours(0, 0, 0, 0);

                    // Window 2: Same day 00:00 - 06:00 (for early shifts like 04:00-12:00)
                    const n2Start = new Date(rec.date); n2Start.setHours(0, 0, 0, 0);
                    const n2End = new Date(rec.date); n2End.setHours(6, 0, 0, 0);

                    let nightHours = 0;
                    nightHours += getOverlap(checkIn, checkOut, n1Start, n1End);
                    nightHours += getOverlap(checkIn, checkOut, n2Start, n2End);

                    if (nightHours > 0) {
                        // Surcharge is 25% of hourly rate per night hour
                        nightSurchargeAmount += (nightHours * hourlyRate * 0.25);
                    }
                }

                // 2. Overtime Splits
                // We have total overtime for the day, typically:
                // If isWeekend && hasDoubleOvertime -> All overtime is 100% (2.0x)
                // Else -> All overtime is 50% (1.5x)

                // Recalculate specific overtime contribution for this day
                // We previously summed totalOvertimeHours blindly. Now we apply rates per day.

                // Note: We need the specific overtime calculated for this record.
                // Re-doing the calc from block above briefly to get 'dailyOvertime'
                const hours = rec.workedHours || 0;
                let expectedHours = 8; // Default, re-calculate or pass from outer scope if needed

                // Determine expected hours for this specific day (re-calculating for this scope)
                const recDate = new Date(rec.date);
                const dailySchedule = schedules.find(sched => {
                    const sStart = new Date(sched.startDate);
                    const sEnd = sched.endDate ? new Date(sched.endDate) : new Date(2100, 0, 1);
                    return recDate >= sStart && recDate <= sEnd;
                });

                if (dailySchedule && dailySchedule.shift) {
                    const [sh, sm] = dailySchedule.shift.startTime.split(':').map(Number);
                    const [eh, em] = dailySchedule.shift.endTime.split(':').map(Number);
                    let shiftDuration = (eh + em / 60) - (sh + sm / 60);
                    if (shiftDuration < 0) shiftDuration += 24;
                    const breakHours = (dailySchedule.shift.breakMinutes || 60) / 60;
                    expectedHours = shiftDuration - breakHours;
                    if (expectedHours < 0) expectedHours = 0;
                }

                // 2. Overtime Splits
                if (rec.overtimeHours !== undefined && rec.overtimeHours !== null) {
                    const dailyOvertime = rec.overtimeHours;
                    if (dailyOvertime > 0) {
                        if (isWeekend && hasDoubleOvertime) {
                            overtimeTotalCost += (dailyOvertime * hourlyRate * 2.0);
                        } else {
                            overtimeTotalCost += (dailyOvertime * hourlyRate * 1.5);
                        }
                    }
                } else if (hours > expectedHours) {
                    // Fallback
                    const dailyOvertime = hours - expectedHours;
                    if (dailyOvertime > 0) {
                        if (isWeekend && hasDoubleOvertime) {
                            overtimeTotalCost += (dailyOvertime * hourlyRate * 2.0);
                        } else {
                            overtimeTotalCost += (dailyOvertime * hourlyRate * 1.5);
                        }
                    }
                }
            });

            // Set final Overtime Amount
            const overtimeTotalAmount = overtimeTotalCost;

            // Undertime Deduction (1.0x)
            const undertimeAmount = totalUndertimeHours * hourlyRate;

            // Add Night Surcharge as Bonus (already declared employeeBonuses above)
            if (nightSurchargeAmount > 0) {
                employeeBonuses.push({ name: 'Recargo Nocturno (25%)', amount: parseFloat(nightSurchargeAmount.toFixed(2)) });
            }

            // 1. Global Config Items
            config.items.forEach(item => {
                let amount = 0;
                if (item.fixedValue) {
                    amount = item.fixedValue;
                } else if (item.percentage) {
                    amount = (earnedSalary * item.percentage) / 100;
                }

                if (item.type === 'EARNING') {
                    employeeBonuses.push({ name: item.name, amount });
                } else {
                    employeeDeductions.push({ name: item.name, amount });
                }
            });

            // 2. Individual Benefits (RF-NOM-004)
            const benefits = await prisma.employeeBenefit.findMany({
                where: {
                    employeeId: emp.id,
                    status: 'ACTIVE'
                }
            });

            benefits.forEach(benefit => {
                employeeBonuses.push({
                    name: benefit.name,
                    amount: benefit.amount,
                    benefitId: benefit.id, // Track ID for processing later
                    frequency: benefit.frequency
                });
            });

            const totalBonuses = employeeBonuses.reduce((acc, curr) => acc + curr.amount, 0);
            const totalDeductions = employeeDeductions.reduce((acc, curr) => acc + curr.amount, 0);

            let netSalary = earnedSalary + overtimeTotalAmount - undertimeAmount + totalBonuses - totalDeductions;
            if (netSalary < 0) netSalary = 0;

            // Add auto-deduction for undertime if exists
            if (undertimeAmount > 0) {
                employeeDeductions.push({ name: 'Descuento por Horas No Trabajadas', amount: parseFloat(undertimeAmount.toFixed(2)) });
            }

            payrollDetails.push({
                employeeId: emp.id,
                baseSalary: baseSalary,
                workedDays: workedDays,
                overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
                overtimeAmount: parseFloat(overtimeTotalAmount.toFixed(2)),
                bonuses: JSON.stringify(employeeBonuses),
                deductions: JSON.stringify(employeeDeductions),
                netSalary: parseFloat(netSalary.toFixed(2))
            });

            totalPayrollAmount += netSalary;
        }

        // 5. Save to DB
        const payroll = await prisma.payroll.create({
            data: {
                period: periodDate,
                endDate: new Date(year, month, 0),
                totalAmount: parseFloat(totalPayrollAmount.toFixed(2)),
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

        return payroll;
    }

    async getPayrolls() {
        return await prisma.payroll.findMany({
            orderBy: { period: 'desc' }
        });
    }

    async getPayrollsByEmployee(employeeId) {
        // Find payrolls where this employee has a detail
        // Returning the Payroll object but ideally we want the Detail + Payroll header info
        // We can query PayrollDetail directly
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

    async confirmPayroll(id) {
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: { details: true }
        });

        if (!payroll) throw new Error('Nómina no encontrada');
        if (payroll.status === 'APPROVED') throw new Error('Nómina ya está aprobada');

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

        return await prisma.payroll.update({
            where: { id },
            data: { status: 'APPROVED' }
        });
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

        // CSV Header
        let csv = 'Identificacion,Beneficiario,Banco,TipoCuenta,NumeroCuenta,Monto,Detalle\n';

        payroll.details.forEach(det => {
            const emp = det.employee;
            if (emp.bankName && emp.accountNumber) {
                // Sanitize
                const name = `${emp.firstName} ${emp.lastName}`.replace(/,/g, '');
                const bank = emp.bankName.replace(/,/g, '');
                const amount = det.netSalary.toFixed(2);

                csv += `${emp.identityCard},${name},${bank},${emp.accountType || 'AHORROS'},${emp.accountNumber},${amount},Nómina ${new Date(payroll.period).toLocaleDateString()}\n`;
            }
        });

        return csv;
    }

    async markAsPaid(id) {
        return await prisma.payroll.update({
            where: { id },
            data: {
                status: 'PAID',
                paymentDate: new Date()
            }
        });
    }
}

export default new PayrollCalculationService();
