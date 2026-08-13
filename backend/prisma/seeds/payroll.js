import { decryptSalary } from '../../src/utils/encryption.js';

export async function seedPayroll(prisma, employees) {
    console.log('[PAYROLL] Generando Historial de Nómina Determinístico de 6 meses para ambas empresas...');
    const today = new Date();

    const tenants = await prisma.tenant.findMany({
        where: { slug: { in: ['empresa-demo', 'tech-solutions'] } }
    });

    for (const tenant of tenants) {
        const tenantEmployees = employees.filter(e => e.tenantId === tenant.id);
        if (tenantEmployees.length === 0) continue;

        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 15);
            const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const payroll = await prisma.payroll.create({
                data: {
                    tenantId: tenant.id,
                    period: periodStart,
                    endDate: periodEnd,
                    paymentDate: date,
                    status: 'PAID',
                    totalAmount: 0
                }
            });

            let payrollTotal = 0;
            const detailsBatch = [];

            for (const emp of tenantEmployees) {
                if (emp.hireDate > date) continue;
                if (emp.exitDate && emp.exitDate < date) continue;

                const baseSalary = decryptSalary(emp.salary) || 1500;
                let overtimeHours = 0;
                let overtimeAmount = 0;
                let bonuses = [];

                if (emp.email === 'sebastian.herrera@emplifi.com' || emp.email === 'francisco.jaramillo@techsolutions.ec') {
                    if (i === 3) { overtimeHours = 10; overtimeAmount = 200; }
                    else if (i === 2) { overtimeHours = 20; overtimeAmount = 400; }
                    else if (i === 1) { overtimeHours = 30; overtimeAmount = 700; }
                    else if (i === 0) { overtimeHours = 48; overtimeAmount = 1250; }
                } else if (emp.email === 'kevin.arismendi@emplifi.com' || emp.email === 'miguel.cueva@techsolutions.ec') {
                    if (i <= 1) { overtimeHours = 8; overtimeAmount = 100; }
                } else if (emp.email === 'roberto.guzman@techsolutions.ec' || emp.email === 'camila.rodriguez@emplifi.com') {
                    if (i === 0) bonuses.push({ name: 'Bono Meta Comercial', amount: 500 });
                }

                if (i === 0 && (emp.role === 'employee' || emp.role === 'accounting')) {
                    bonuses.push({ name: 'Ajuste Trimestral', amount: 150 });
                }

                const deductions = [{ name: 'Aporte IESS 9.45%', amount: parseFloat((baseSalary * 0.0945).toFixed(2)) }];
                const bonusAmount = bonuses.reduce((a, b) => a + b.amount, 0);
                const deducAmount = deductions.reduce((a, b) => a + b.amount, 0);
                const net = baseSalary + overtimeAmount + bonusAmount - deducAmount;

                detailsBatch.push({
                    payrollId: payroll.id,
                    employeeId: emp.id,
                    baseSalary: parseFloat(baseSalary.toFixed(2)),
                    workedDays: 30,
                    overtimeHours: overtimeHours,
                    overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
                    bonuses: JSON.stringify(bonuses),
                    deductions: JSON.stringify(deductions),
                    netSalary: parseFloat(net.toFixed(2))
                });

                payrollTotal += net;
            }

            if (detailsBatch.length > 0) {
                await prisma.payrollDetail.createMany({
                    data: detailsBatch
                });
            }

            await prisma.payroll.update({
                where: { id: payroll.id },
                data: { totalAmount: parseFloat(payrollTotal.toFixed(2)) }
            });
        }
        console.log(`Nómina de 6 meses generada en lote para ${tenant.name}.`);
    }
}
