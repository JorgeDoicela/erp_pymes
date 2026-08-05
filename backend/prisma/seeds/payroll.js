import { decryptSalary } from '../../src/utils/encryption.js';

export async function seedPayroll(prisma, employees) {
    console.log('[PAYROLL] Generando Historial de Nómina Determinístico (6 meses)...');
    const today = new Date();

    // 6 meses históricos (i = 5 es hace 5 meses, i = 0 es el mes actual)
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 15);
        const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        let payroll;
        try {
            payroll = await prisma.payroll.findFirst({
                where: { paymentDate: date }
            });

            if (!payroll) {
                payroll = await prisma.payroll.create({
                    data: {
                        period: periodStart,
                        endDate: periodEnd,
                        paymentDate: date,
                        status: 'PAID',
                        totalAmount: 0
                    }
                });
            }

            let payrollTotal = 0;

            for (const emp of employees) {
                if (emp.hireDate > date) continue;
                if (emp.exitDate && emp.exitDate < date) continue;

                const existing = await prisma.payrollDetail.findFirst({
                    where: { payrollId: payroll.id, employeeId: emp.id }
                });
                if (existing) continue;

                const baseSalary = decryptSalary(emp.salary) || 1200;
                let overtimeHours = 0;
                let overtimeAmount = 0;
                let bonuses = [];

                // Patrón determinístico de horas extras
                if (emp.email === 'sebastian.herrera@emplifi.com') {
                    // Escalada progresiva hasta llegar a la anomalía en el mes actual (i === 0)
                    if (i === 3) { overtimeHours = 12; overtimeAmount = 250; }
                    else if (i === 2) { overtimeHours = 24; overtimeAmount = 500; }
                    else if (i === 1) { overtimeHours = 36; overtimeAmount = 850; }
                    else if (i === 0) { overtimeHours = 52; overtimeAmount = 1400; } // ANOMALÍA CRÍTICA
                } else if (emp.email === 'kevin.arismendi@emplifi.com') {
                    if (i <= 1) { overtimeHours = 8; overtimeAmount = 100; }
                } else if (emp.email === 'roberto.guzman@emplifi.com') {
                    if (i === 0) bonuses.push({ name: 'Bono de Meta Comercial', amount: 600 });
                }

                // Crecimiento progresivo de costo general (bono inflacionario/trimestral gradual)
                if (i === 0 && (emp.role === 'employee' || emp.role === 'accounting')) {
                    bonuses.push({ name: 'Ajuste Trimestral', amount: 150 });
                }

                const deductions = [{ name: 'Aporte IESS', amount: parseFloat((baseSalary * 0.0945).toFixed(2)) }];

                const bonusAmount = bonuses.reduce((a, b) => a + b.amount, 0);
                const deducAmount = deductions.reduce((a, b) => a + b.amount, 0);
                const net = baseSalary + overtimeAmount + bonusAmount - deducAmount;

                await prisma.payrollDetail.create({
                    data: {
                        payrollId: payroll.id,
                        employeeId: emp.id,
                        baseSalary: parseFloat(baseSalary.toFixed(2)),
                        workedDays: 30,
                        overtimeHours: overtimeHours,
                        overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
                        bonuses: JSON.stringify(bonuses),
                        deductions: JSON.stringify(deductions),
                        netSalary: parseFloat(net.toFixed(2))
                    }
                });

                payrollTotal += net;
            }

            await prisma.payroll.update({
                where: { id: payroll.id },
                data: { totalAmount: { increment: parseFloat(payrollTotal.toFixed(2)) } }
            });
        } catch (e) {
            console.error(`Payroll error mes ${i}: ${e.message}`);
        }
    }
    console.log('[PAYROLL] Nómina de 6 meses completada.');
}
