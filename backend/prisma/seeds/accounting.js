export async function seedAccounting(prisma) {
    console.log('[ACCOUNTING] Iniciando carga de datos contables (PUG)...');

    // Obtener Tenant Demo
    const demoTenant = await prisma.tenant.findUnique({ where: { slug: 'empresa-demo' } });
    const tenantId = demoTenant ? demoTenant.id : null;

    // 1. Crear Centros de Costo Orientados a RRHH
    const costCenters = [
        { code: 'CC-ADM', name: 'Administración', description: 'Gastos Administrativos' },
        { code: 'CC-VEN', name: 'Ventas', description: 'Gastos de personal comercial' },
        { code: 'CC-OPE', name: 'Operaciones', description: 'Gastos operativos y logística' },
        { code: 'CC-TEC', name: 'Tecnología', description: 'Desarrollo e infraestructura IT' },
        { code: 'CC-RRHH', name: 'Recursos Humanos', description: 'Gestión de talento humano' },
        { code: 'CC-FIN', name: 'Finanzas', description: 'Contabilidad y finanzas' },
        { code: 'CC-MKT', name: 'Marketing', description: 'Publicidad y mercadeo' },
        { code: 'CC-LEG', name: 'Legal', description: 'Asesoría jurídica' },
    ];

    for (const cc of costCenters) {
        const existing = await prisma.costCenter.findFirst({
            where: { tenantId, code: cc.code }
        });
        if (!existing) {
            await prisma.costCenter.create({
                data: { ...cc, tenantId }
            });
        }
    }

    // 2. Crear Plan de Cuentas Básico (Jerárquico)
    const accounts = [
        { code: '1', name: 'ACTIVOS', type: 'ASSET', level: 1, isTransactional: false },
        { code: '2', name: 'PASIVOS', type: 'LIABILITY', level: 1, isTransactional: false },
        { code: '3', name: 'PATRIMONIO', type: 'EQUITY', level: 1, isTransactional: false },
        { code: '4', name: 'INGRESOS', type: 'REVENUE', level: 1, isTransactional: false },
        { code: '5', name: 'GASTOS', type: 'EXPENSE', level: 1, isTransactional: false },
    ];

    const pNivel1 = {};
    for (const acc of accounts) {
        let found = await prisma.accountingAccount.findFirst({ where: { tenantId, code: acc.code } });
        if (!found) {
            found = await prisma.accountingAccount.create({ data: { ...acc, tenantId } });
        }
        pNivel1[acc.code] = found;
    }

    // NIVEL 2
    const level2 = [
        { code: '1.1', name: 'Activo Corriente', type: 'ASSET', level: 2, isTransactional: false, parentId: pNivel1['1']?.id },
        { code: '2.1', name: 'Pasivo Corriente', type: 'LIABILITY', level: 2, isTransactional: false, parentId: pNivel1['2']?.id },
        { code: '5.1', name: 'Gastos de Personal', type: 'EXPENSE', level: 2, isTransactional: false, parentId: pNivel1['5']?.id },
    ];

    const pNivel2 = {};
    for (const acc of level2) {
        let found = await prisma.accountingAccount.findFirst({ where: { tenantId, code: acc.code } });
        if (!found) {
            found = await prisma.accountingAccount.create({ data: { ...acc, tenantId } });
        }
        pNivel2[acc.code] = found;
    }

    // NIVEL 3 (Transaccionales)
    const level3 = [
        { code: '1.1.1', name: 'Bancos Moneda Nacional', type: 'ASSET', level: 3, isTransactional: true, parentId: pNivel2['1.1']?.id },
        { code: '1.1.2', name: 'Anticipos a Empleados', type: 'ASSET', level: 3, isTransactional: true, parentId: pNivel2['1.1']?.id },
        { code: '2.1.1', name: 'Sueldos por Pagar', type: 'LIABILITY', level: 3, isTransactional: true, parentId: pNivel2['2.1']?.id },
        { code: '2.1.2', name: 'Aportes IESS por Pagar', type: 'LIABILITY', level: 3, isTransactional: true, parentId: pNivel2['2.1']?.id },
        { code: '2.1.3', name: 'Provisión Décimo Tercero', type: 'LIABILITY', level: 3, isTransactional: true, parentId: pNivel2['2.1']?.id },
        { code: '2.1.4', name: 'Provisión Vacaciones', type: 'LIABILITY', level: 3, isTransactional: true, parentId: pNivel2['2.1']?.id },
        { code: '2.1.5', name: 'Préstamos IESS', type: 'LIABILITY', level: 3, isTransactional: true, parentId: pNivel2['2.1']?.id },
        { code: '5.1.1', name: 'Gasto Sueldos y Salarios', type: 'EXPENSE', level: 3, isTransactional: true, parentId: pNivel2['5.1']?.id },
        { code: '5.1.2', name: 'Gasto Horas Extras', type: 'EXPENSE', level: 3, isTransactional: true, parentId: pNivel2['5.1']?.id },
        { code: '5.1.3', name: 'Gasto Aporte Patronal', type: 'EXPENSE', level: 3, isTransactional: true, parentId: pNivel2['5.1']?.id },
        { code: '5.1.4', name: 'Gasto Fondos de Reserva', type: 'EXPENSE', level: 3, isTransactional: true, parentId: pNivel2['5.1']?.id },
    ];

    for (const acc of level3) {
        const found = await prisma.accountingAccount.findFirst({ where: { tenantId, code: acc.code } });
        if (!found) {
            await prisma.accountingAccount.create({ data: { ...acc, tenantId } });
        }
    }

    // 3. Crear Periodo Actual
    const now = new Date();
    const existingPeriod = await prisma.accountingPeriod.findFirst({
        where: { tenantId, year: now.getFullYear(), month: now.getMonth() + 1 }
    });
    if (!existingPeriod) {
        await prisma.accountingPeriod.create({
            data: {
                tenantId,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                startDate: new Date(now.getFullYear(), now.getMonth(), 1),
                endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
                status: 'OPEN'
            }
        });
    }

    console.log('✅ Catálogo y Periodos contables cargados con tenant context.');
}

export async function seedJournalEntries(prisma) {
    console.log('[ACCOUNTING] Generando transacciones contables demo...');
    const demoTenant = await prisma.tenant.findUnique({ where: { slug: 'empresa-demo' } });
    const tenantId = demoTenant ? demoTenant.id : null;

    const accounts = await prisma.accountingAccount.findMany({ where: { tenantId, isTransactional: true } });
    const accMap = {};
    accounts.forEach(a => accMap[a.code] = a.id);

    const ccs = await prisma.costCenter.findMany({ where: { tenantId } });
    const ccMap = {};
    ccs.forEach(c => ccMap[c.code] = c.id);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const entries = [
        {
            entryNumber: `DEMO-${year}${String(month).padStart(2, '0')}-01`,
            date: new Date(year, month - 1, 10),
            description: 'Apertura de Caja Chica y Gastos Menores',
            type: 'DAILY',
            status: 'POSTED',
            totalDebit: 500,
            totalCredit: 500,
            lines: [
                { accountId: accMap['1.1.1'], description: 'Retiro Bancario', debit: 0, credit: 500 },
                { accountId: accMap['1.1.2'], description: 'Fondo de Caja Chica', debit: 500, credit: 0 },
            ]
        },
        {
            entryNumber: `DEMO-${year}${String(month).padStart(2, '0')}-02`,
            date: new Date(year, month - 1, 15),
            description: 'Pago de Anticipos Quincenales',
            type: 'EXPENSE',
            status: 'POSTED',
            totalDebit: 1200,
            totalCredit: 1200,
            lines: [
                { accountId: accMap['1.1.2'], costCenterId: ccMap['CC-ADM'], description: 'Anticipo Admin', debit: 1200, credit: 0 },
                { accountId: accMap['1.1.1'], description: 'Transferencia Banco', debit: 0, credit: 1200 },
            ]
        }
    ];

    for (const entry of entries) {
        const existing = await prisma.journalEntry.findFirst({
            where: { tenantId, entryNumber: entry.entryNumber }
        });
        if (!existing) {
            await prisma.journalEntry.create({
                data: {
                    tenantId,
                    entryNumber: entry.entryNumber,
                    date: entry.date,
                    description: entry.description,
                    type: entry.type,
                    status: entry.status,
                    totalDebit: entry.totalDebit,
                    totalCredit: entry.totalCredit,
                    lines: {
                        create: entry.lines.filter(l => l.accountId)
                    }
                }
            });
        }
    }
    console.log('✅ Transacciones contables demo creadas con éxito.');
}
