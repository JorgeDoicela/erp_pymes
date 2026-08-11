export async function seedAudit(prisma, employees = []) {
    console.log('[AUDIT] Generando Registros de Auditoría Global del Sistema...');
    if (employees.length === 0) return;

    const admin = employees.find(e => e.role === 'admin') || employees[0];
    const superadmin = employees.find(e => e.role === 'superadmin');

    const sampleLogs = [
        {
            entity: 'System',
            entityId: 'SAAS-GLOBAL',
            action: 'INITIALIZE_PLATFORM',
            performedBy: 'system@emplifi.com',
            details: JSON.stringify({ message: 'Sistema de Gestión de RRHH Emplifi inicializado correctamente' })
        },
        {
            entity: 'Tenant',
            entityId: 'empresa-demo',
            action: 'CREATE_TENANT',
            performedBy: superadmin ? superadmin.email : 'admin@emplifi.com',
            details: JSON.stringify({ name: 'Empresa Demo Ecuador S.A.', plan: 'ENTERPRISE', maxEmployees: 100 })
        },
        {
            entity: 'Employee',
            entityId: admin.id,
            action: 'CREATE_ADMIN',
            performedBy: 'admin@emplifi.com',
            details: JSON.stringify({ email: admin.email, role: 'admin' })
        },
        {
            entity: 'Payroll',
            entityId: 'PAY-2025-05',
            action: 'CALCULATE_PAYROLL',
            performedBy: admin.email,
            details: JSON.stringify({ period: 'Mayo 2025', totalProcessed: 10, currency: 'USD' })
        },
        {
            entity: 'Security',
            entityId: 'AUTH-SESSION',
            action: 'SUPERADMIN_IMPERSONATE_TENANT',
            performedBy: 'admin@emplifi.com',
            details: JSON.stringify({ tenantSlug: 'empresa-demo', reason: 'Soporte técnico auditado' })
        }
    ];

    try {
        await prisma.auditLog.createMany({
            data: sampleLogs.map(log => ({
                ...log,
                tenantId: admin.tenantId || null
            }))
        });
        console.log(`✅ ${sampleLogs.length} logs de auditoría inmutables creados.`);
    } catch (e) {
        console.error('⚠️ Error generando logs de auditoría:', e.message);
    }
}
