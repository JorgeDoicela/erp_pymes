/**
 * @file accounting.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export async function seedAccounting(prisma) {
  console.log('[ACCOUNTING] Cargando catálogo contable (PUG) para todas las empresas...');

  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
  });

  for (const tenant of tenants) {
    const tenantId = tenant.id;

    // 1. Centros de Costo Orientados a RRHH por Empresa
    const costCenters = [
      { code: 'CC-ADM', name: 'Administración', description: 'Gastos Administrativos Generales' },
      { code: 'CC-VEN', name: 'Ventas', description: 'Gastos de Personal Comercial y Comisiones' },
      { code: 'CC-OPE', name: 'Operaciones', description: 'Gastos Operativos y Logística' },
      { code: 'CC-TEC', name: 'Tecnología', description: 'Desarrollo, IT e Infraestructura' },
      {
        code: 'CC-RRHH',
        name: 'Recursos Humanos',
        description: 'Gestión de Talento y Capacitación',
      },
      { code: 'CC-FIN', name: 'Finanzas', description: 'Contabilidad, Tesorería y Auditoría' },
    ];

    for (const cc of costCenters) {
      const existing = await prisma.costCenter.findFirst({
        where: { tenantId, code: cc.code },
      });
      if (!existing) {
        await prisma.costCenter.create({
          data: { ...cc, tenantId },
        });
      }
    }

    // 2. Plan de Cuentas Básico Jerárquico PUG
    const accountsLevel1 = [
      { code: '1', name: 'ACTIVOS', type: 'ASSET', level: 1, isTransactional: false },
      { code: '2', name: 'PASIVOS', type: 'LIABILITY', level: 1, isTransactional: false },
      { code: '3', name: 'PATRIMONIO', type: 'EQUITY', level: 1, isTransactional: false },
      { code: '4', name: 'INGRESOS', type: 'REVENUE', level: 1, isTransactional: false },
      { code: '5', name: 'GASTOS', type: 'EXPENSE', level: 1, isTransactional: false },
    ];

    const pNivel1 = {};
    for (const acc of accountsLevel1) {
      let found = await prisma.accountingAccount.findFirst({ where: { tenantId, code: acc.code } });
      if (!found) {
        found = await prisma.accountingAccount.create({ data: { ...acc, tenantId } });
      }
      pNivel1[acc.code] = found;
    }

    // NIVEL 2
    const accountsLevel2 = [
      {
        code: '1.1',
        name: 'Activo Corriente',
        type: 'ASSET',
        level: 2,
        isTransactional: false,
        parentId: pNivel1['1']?.id,
      },
      {
        code: '2.1',
        name: 'Pasivo Corriente',
        type: 'LIABILITY',
        level: 2,
        isTransactional: false,
        parentId: pNivel1['2']?.id,
      },
      {
        code: '3.1',
        name: 'Capital y Reservas',
        type: 'EQUITY',
        level: 2,
        isTransactional: false,
        parentId: pNivel1['3']?.id,
      },
      {
        code: '4.1',
        name: 'Ingresos Operacionales',
        type: 'REVENUE',
        level: 2,
        isTransactional: false,
        parentId: pNivel1['4']?.id,
      },
      {
        code: '5.1',
        name: 'Gastos de Personal',
        type: 'EXPENSE',
        level: 2,
        isTransactional: false,
        parentId: pNivel1['5']?.id,
      },
      {
        code: '5.2',
        name: 'Gastos Administrativos y Operativos',
        type: 'EXPENSE',
        level: 2,
        isTransactional: false,
        parentId: pNivel1['5']?.id,
      },
    ];

    const pNivel2 = {};
    for (const acc of accountsLevel2) {
      let found = await prisma.accountingAccount.findFirst({ where: { tenantId, code: acc.code } });
      if (!found) {
        found = await prisma.accountingAccount.create({ data: { ...acc, tenantId } });
      }
      pNivel2[acc.code] = found;
    }

    // NIVEL 3 (Transaccionales)
    const accountsLevel3 = [
      {
        code: '1.1.1',
        name: 'Bancos Moneda Nacional',
        type: 'ASSET',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['1.1']?.id,
      },
      {
        code: '1.1.2',
        name: 'Anticipos a Empleados',
        type: 'ASSET',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['1.1']?.id,
      },
      {
        code: '1.1.3',
        name: 'Cuentas por Cobrar Clientes',
        type: 'ASSET',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['1.1']?.id,
      },
      {
        code: '2.1.1',
        name: 'Sueldos por Pagar',
        type: 'LIABILITY',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['2.1']?.id,
      },
      {
        code: '2.1.2',
        name: 'Aportes IESS por Pagar',
        type: 'LIABILITY',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['2.1']?.id,
      },
      {
        code: '2.1.3',
        name: 'Provisión Décimo Tercero',
        type: 'LIABILITY',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['2.1']?.id,
      },
      {
        code: '2.1.4',
        name: 'Provisión Vacaciones',
        type: 'LIABILITY',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['2.1']?.id,
      },
      {
        code: '2.1.5',
        name: 'Cuentas por Pagar Proveedores',
        type: 'LIABILITY',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['2.1']?.id,
      },
      {
        code: '3.1.1',
        name: 'Capital Suscrito y Pagado',
        type: 'EQUITY',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['3.1']?.id,
      },
      {
        code: '4.1.1',
        name: 'Ingresos por Servicios y Ventas B2B',
        type: 'REVENUE',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['4.1']?.id,
      },
      {
        code: '5.1.1',
        name: 'Gasto Sueldos y Salarios',
        type: 'EXPENSE',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['5.1']?.id,
      },
      {
        code: '5.1.2',
        name: 'Gasto Horas Extras',
        type: 'EXPENSE',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['5.1']?.id,
      },
      {
        code: '5.1.3',
        name: 'Gasto Aporte Patronal IESS',
        type: 'EXPENSE',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['5.1']?.id,
      },
      {
        code: '5.2.1',
        name: 'Gasto Servicios Básicos e Infraestructura Cloud',
        type: 'EXPENSE',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['5.2']?.id,
      },
      {
        code: '5.2.2',
        name: 'Gasto Arriendos de Inmuebles y Oficinas',
        type: 'EXPENSE',
        level: 3,
        isTransactional: true,
        parentId: pNivel2['5.2']?.id,
      },
    ];

    for (const acc of accountsLevel3) {
      const found = await prisma.accountingAccount.findFirst({
        where: { tenantId, code: acc.code },
      });
      if (!found) {
        await prisma.accountingAccount.create({ data: { ...acc, tenantId } });
      }
    }

    // 3. Periodos Contables (3 meses históricos cerrados + mes actual abierto)
    const now = new Date();
    for (let offset = 3; offset >= 0; offset--) {
      const pDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const year = pDate.getFullYear();
      const month = pDate.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const isCurrent = offset === 0;

      const existingPeriod = await prisma.accountingPeriod.findFirst({
        where: { tenantId, year, month },
      });
      if (!existingPeriod) {
        await prisma.accountingPeriod.create({
          data: {
            tenantId,
            year,
            month,
            startDate,
            endDate,
            status: isCurrent ? 'OPEN' : 'CLOSED',
          },
        });
      }
    }

    console.log(`Catálogo contable y periodo cargados para ${tenant.name}.`);
  }
}

export async function seedJournalEntries(prisma) {
  console.log(
    '[ACCOUNTING] Generando transacciones contables completas (Libro Diario, Mayor, PUG) para todas las empresas...'
  );

  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
  });

  const now = new Date();

  for (const tenant of tenants) {
    const tenantId = tenant.id;

    const accounts = await prisma.accountingAccount.findMany({
      where: { tenantId, isTransactional: true },
    });
    const accMap = {};
    accounts.forEach((a) => (accMap[a.code] = a.id));

    const ccs = await prisma.costCenter.findMany({ where: { tenantId } });
    const ccMap = {};
    ccs.forEach((c) => (ccMap[c.code] = c.id));

    const prefix = tenant.slug.toUpperCase().slice(0, 5);
    const entries = [];

    // Generar transacciones para los últimos 3 meses y el mes en curso
    for (let offset = 2; offset >= 0; offset--) {
      const pDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const year = pDate.getFullYear();
      const month = pDate.getMonth() + 1;
      const mStr = String(month).padStart(2, '0');

      // 1. Facturación por Servicios / Ventas B2B
      entries.push({
        entryNumber: `${prefix}-${year}${mStr}-01`,
        date: new Date(year, month - 1, 4),
        description: `Facturación y Cobro de Servicios Corporativos Mensuales - ${tenant.name}`,
        type: 'INCOME',
        status: 'POSTED',
        totalDebit: 18500,
        totalCredit: 18500,
        lines: [
          {
            accountId: accMap['1.1.1'],
            description: 'Ingreso a Cuenta Bancaria Recaudación',
            debit: 18500,
            credit: 0,
          },
          {
            accountId: accMap['4.1.1'],
            costCenterId: ccMap['CC-VEN'],
            description: 'Venta de Servicios Corporativos',
            debit: 0,
            credit: 18500,
          },
        ],
      });

      // 2. Factura de Proveedor de Servicios Cloud / Telecomunicaciones
      entries.push({
        entryNumber: `${prefix}-${year}${mStr}-02`,
        date: new Date(year, month - 1, 8),
        description: `Pago de Infraestructura Cloud, Internet y Telefonía IP - ${tenant.name}`,
        type: 'EXPENSE',
        status: 'POSTED',
        totalDebit: 1450,
        totalCredit: 1450,
        lines: [
          {
            accountId: accMap['5.2.1'],
            costCenterId: ccMap['CC-TEC'] || ccMap['CC-ADM'],
            description: 'Servidores Cloud y Conectividad',
            debit: 1450,
            credit: 0,
          },
          {
            accountId: accMap['1.1.1'],
            description: 'Transferencia Bancaria Proveedor Cloud',
            debit: 0,
            credit: 1450,
          },
        ],
      });

      // 3. Arriendo de Oficinas / Instalaciones Operativas
      entries.push({
        entryNumber: `${prefix}-${year}${mStr}-03`,
        date: new Date(year, month - 1, 10),
        description: `Arriendo de Sede Corporativa y Mantenimiento de Instalaciones - ${tenant.name}`,
        type: 'EXPENSE',
        status: 'POSTED',
        totalDebit: 2200,
        totalCredit: 2200,
        lines: [
          {
            accountId: accMap['5.2.2'],
            costCenterId: ccMap['CC-ADM'],
            description: 'Canon de Arrendamiento Mensual',
            debit: 2200,
            credit: 0,
          },
          {
            accountId: accMap['1.1.1'],
            description: 'Cheque / Transferencia Inmobiliaria',
            debit: 0,
            credit: 2200,
          },
        ],
      });

      // 4. Anticipos Quincenales a Colaboradores
      entries.push({
        entryNumber: `${prefix}-${year}${mStr}-04`,
        date: new Date(year, month - 1, 15),
        description: `Desembolso de Anticipos Quincenales de Nómina - ${tenant.name}`,
        type: 'EXPENSE',
        status: 'POSTED',
        totalDebit: 2800,
        totalCredit: 2800,
        lines: [
          {
            accountId: accMap['1.1.2'],
            costCenterId: ccMap['CC-RRHH'] || ccMap['CC-ADM'],
            description: 'Anticipos Solicitados por Personal',
            debit: 2800,
            credit: 0,
          },
          {
            accountId: accMap['1.1.1'],
            description: 'Acreditación Bancaria en Lote',
            debit: 0,
            credit: 2800,
          },
        ],
      });

      // 5. Nómina Consolidada Mensual y Aportes al IESS
      const isCurrent = offset === 0;
      entries.push({
        entryNumber: `${prefix}-${year}${mStr}-05`,
        date: new Date(year, month - 1, isCurrent ? Math.min(now.getDate(), 28) : 28),
        description: `Asiento Centralizado de Nómina y Aportes IESS del Periodo ${mStr}/${year} - ${tenant.name}`,
        type: 'PAYROLL',
        status: isCurrent ? 'DRAFT' : 'POSTED',
        totalDebit: 14650,
        totalCredit: 14650,
        lines: [
          {
            accountId: accMap['5.1.1'],
            costCenterId: ccMap['CC-ADM'],
            description: 'Sueldos Base Devengados Personal',
            debit: 13000,
            credit: 0,
          },
          {
            accountId: accMap['5.1.3'],
            costCenterId: ccMap['CC-RRHH'] || ccMap['CC-ADM'],
            description: 'Gasto Aporte Patronal IESS (11.15%)',
            debit: 1650,
            credit: 0,
          },
          {
            accountId: accMap['1.1.2'],
            description: 'Descuento de Anticipos Quincenales Otorgados',
            debit: 0,
            credit: 2800,
          },
          {
            accountId: accMap['2.1.2'],
            description: 'Aportes IESS (Personal 9.45% + Patronal 11.15%)',
            debit: 0,
            credit: 2880,
          },
          {
            accountId: accMap['1.1.1'],
            description: 'Pago Neto de Nómina Transferencia SPI',
            debit: 0,
            credit: 8970,
          },
        ],
      });
    }

    for (const entry of entries) {
      const existing = await prisma.journalEntry.findFirst({
        where: { tenantId, entryNumber: entry.entryNumber },
      });
      if (!existing) {
        // Filtrar líneas válidas
        const validLines = entry.lines.filter((l) => l.accountId);
        if (validLines.length >= 2) {
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
                create: validLines,
              },
            },
          });
        }
      }
    }
    console.log(`Asientos contables generados (${entries.length} asientos) para ${tenant.name}.`);
  }
}
