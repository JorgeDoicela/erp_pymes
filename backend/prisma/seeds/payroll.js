import { decryptSalary } from '../../src/utils/encryption.js';

export async function seedPayroll(prisma, employees) {
    console.log('[PAYROLL] Generando Historial de Nómina de 12 meses y Anticipos Salariales...');
    const today = new Date();

    const tenants = await prisma.tenant.findMany({
        where: { isActive: true }
    });

    const advancesBatch = [];

    for (const tenant of tenants) {
        const tenantEmployees = employees.filter(e => e.tenantId === tenant.id);
        if (tenantEmployees.length === 0) continue;

        const adminUser = tenantEmployees.find(e => e.role === 'admin') || tenantEmployees[0];

        // 1. Generar 12 meses de nómina completa
        for (let i = 11; i >= 0; i--) {
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

                // Lógica variada de horas extras y bonificaciones
                if (emp.department === 'Tecnología' && i <= 3) {
                    overtimeHours = 8 + (i * 4);
                    overtimeAmount = parseFloat(((baseSalary / 160) * 1.5 * overtimeHours).toFixed(2));
                } else if (emp.department === 'Ventas' && i % 2 === 0) {
                    bonuses.push({ name: 'Comisiones por Cumplimiento de Ventas', amount: 350 });
                } else if (emp.department === 'Operaciones' && i === 1) {
                    overtimeHours = 12;
                    overtimeAmount = parseFloat(((baseSalary / 160) * 1.5 * overtimeHours).toFixed(2));
                }

                // Fondos de reserva (8.33%) y décimos acumulados
                const reserveFunds = parseFloat((baseSalary * 0.0833).toFixed(2));
                bonuses.push({ name: 'Fondos de Reserva (8.33%)', amount: reserveFunds });

                // Deducciones de ley
                const iessDeduction = parseFloat((baseSalary * 0.0945).toFixed(2));
                const deductions = [{ name: 'Aporte Individual IESS (9.45%)', amount: iessDeduction }];

                // Anticipo descontado si aplica
                if (i === 1 && (emp.department === 'Tecnología' || emp.department === 'Marketing')) {
                    deductions.push({ name: 'Descuento Cuota Anticipo de Sueldo', amount: 150 });
                }

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

        // 2. Sembrar Anticipos de Sueldo para colaboradores de este tenant
        const activeEmps = tenantEmployees.filter(e => e.isActive);
        if (activeEmps.length >= 4) {
            advancesBatch.push(
                {
                    employeeId: activeEmps[0].id,
                    amount: 300.0,
                    installments: 2,
                    monthlyDeduction: 150.0,
                    reason: 'Gastos médicos familiares imprevistos y compra de medicamentos.',
                    status: 'APPROVED',
                    approvedBy: adminUser.id,
                    approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    paidAmount: 150.0,
                    paidInstallments: 1,
                    requestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
                },
                {
                    employeeId: activeEmps[1].id,
                    amount: 450.0,
                    installments: 3,
                    monthlyDeduction: 150.0,
                    reason: 'Matrícula y útiles escolares de inicio de periodo académico.',
                    status: 'PENDING',
                    approvedBy: null,
                    approvedAt: null,
                    paidAmount: 0.0,
                    paidInstallments: 0,
                    requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                },
                {
                    employeeId: activeEmps[2].id,
                    amount: 200.0,
                    installments: 1,
                    monthlyDeduction: 200.0,
                    reason: 'Reparación mecánica urgente de vehículo personal.',
                    status: 'PAID',
                    approvedBy: adminUser.id,
                    approvedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
                    paidAmount: 200.0,
                    paidInstallments: 1,
                    requestDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
                },
                {
                    employeeId: activeEmps[3].id,
                    amount: 800.0,
                    installments: 4,
                    monthlyDeduction: 200.0,
                    reason: 'Solicitud que excede el límite máximo reglamentario de anticipo.',
                    status: 'REJECTED',
                    approvedBy: adminUser.id,
                    approvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                    rejectionReason: 'El monto solicitado excede el 40% del salario neto mensual permitido por política interna.',
                    paidAmount: 0.0,
                    paidInstallments: 0,
                    requestDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
                }
            );
        }

        console.log(`Nómina de 12 meses generada en lote para ${tenant.name}.`);
    }

    if (advancesBatch.length > 0) {
        await prisma.salaryAdvance.createMany({
            data: advancesBatch,
            skipDuplicates: true
        });
        console.log(`[PAYROLL] ${advancesBatch.length} solicitudes de anticipos de sueldo registradas.`);
    }
}

