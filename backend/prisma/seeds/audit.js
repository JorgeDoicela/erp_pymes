export async function seedAudit(prisma, employees) {
    console.log('🕵️ Generando Audit Logs...');
    // Create some fake logs
    if (employees.length === 0) return;

    const admin = employees.find(e => e.role === 'admin') || employees[0];

    try {
        await prisma.auditLog.createMany({
            data: [
                {
                    entity: 'Employee',
                    entityId: employees[0].id,
                    action: 'CREATE',
                    performedBy: 'System Seeder',
                    details: JSON.stringify({ note: 'Initial creation' })
                },
                {
                    entity: 'Payroll',
                    entityId: 'generic-id',
                    action: 'UPDATE',
                    performedBy: admin.email,
                    details: JSON.stringify({ status: 'PAID' })
                }
            ]
        });
    } catch (e) { }
}
