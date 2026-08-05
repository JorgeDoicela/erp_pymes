import { decryptSalary } from '../../src/utils/encryption.js';

export async function seedPayroll(prisma, employees) {
    console.log('[PAYROLL] Generando Historial de Nómina...');
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 15);

        let payroll;
        try {
            payroll = await prisma.payroll.findFirst({
                where: { paymentDate: date }
            });

            if (!payroll) {
                payroll = await prisma.payroll.create({
                    data: {
                        period: new Date(date.getFullYear(), date.getMonth(), 1),
                        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
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

                // Check existance
                const existing = await prisma.payrollDetail.findFirst({
                    where: { payrollId: payroll.id, employeeId: emp.id }
                });
                if (existing) continue;

                const baseSalary = decryptSalary(emp.salary) || 1200;
                let overtime = Math.random() > 0.8 ? 100 : 0;
                let overtimeHours = overtime > 0 ? 10 : 0;

                // Anomaly: Sebastián extra hours
                if (emp.email === 'sebastian.herrera@emplifi.com' && i === 0) {
                    overtime = 800; // Extremely high
                    overtimeHours = 45;
                }

                let bonuses = Math.random() > 0.7 ? [{ name: 'Desempeño', amount: 200 }] : [];

                // Aggressive cost increase for latest month (i === 0)
                if (i === 0) {
                    bonuses.push({ name: 'Bono Especial Trimestral', amount: 800 });
                }

                const deductions = [{ name: 'IESS', amount: baseSalary * 0.0945 }];

                const bonusAmount = bonuses.reduce((a, b) => a + b.amount, 0);
                const deducAmount = deductions.reduce((a, b) => a + b.amount, 0);
                const net = baseSalary + overtime + bonusAmount - deducAmount;

                await prisma.payrollDetail.create({
                    data: {
                        payrollId: payroll.id,
                        employeeId: emp.id,
                        baseSalary: parseFloat(baseSalary.toFixed(2)),
                        workedDays: 30,
                        overtimeHours: overtimeHours,
                        overtimeAmount: parseFloat(overtime.toFixed(2)),
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
            console.log(`Payroll error month ${i}: ${e.message}`);
        }
    }
}
