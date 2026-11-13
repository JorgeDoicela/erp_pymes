/**
 * @file core_records.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { getRandomElement } from '../common/utils.js';
import { decryptSalary } from '../../../src/core/security/encryption.js';

export async function seedCoreRecords(prisma, employees) {
  console.log(
    '[CORE] Generando Registros Core en Lote (Turnos Multi-Tenant, Contratos, Skills, Horarios)...'
  );

  // 1. Obtener empresas activas para generar turnos multi-tenant personalizados
  const tenants = await prisma.tenant.findMany({ where: { isActive: true } });
  const tenantShifts = {};

  // Turno base global de respaldo
  let defaultShift = await prisma.shift.findFirst({ where: { name: 'Matutino Ordinario' } });
  if (!defaultShift) {
    defaultShift = await prisma.shift.create({
      data: {
        name: 'Matutino Ordinario',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
    });
  }

  // Definición de turnos industriales y sectoriales por empresa
  const SHIFT_TEMPLATES_BY_SECTOR = {
    'empresa-demo': [
      {
        name: 'Jornada Ordinaria Administrativa',
        startTime: '08:30',
        endTime: '17:30',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
      {
        name: 'Turno Flexible Tech & DevOps',
        startTime: '09:30',
        endTime: '18:30',
        breakMinutes: 60,
        toleranceMinutes: 30,
      },
      {
        name: 'Guardia Soporte Cloud 24/7',
        startTime: '14:00',
        endTime: '22:00',
        breakMinutes: 45,
        toleranceMinutes: 10,
      },
    ],
    techsolutions: [
      {
        name: 'Horario Central Ingeniería & Cloud',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        toleranceMinutes: 20,
      },
      {
        name: 'Turno Infraestructura & SRE',
        startTime: '10:00',
        endTime: '19:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
    ],
    'innovate-corp': [
      {
        name: 'Jornada I+D y Modelado IA',
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        toleranceMinutes: 25,
      },
      {
        name: 'Turno Operaciones Data Pipeline',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
    ],
    'logistica-andina': [
      {
        name: 'Turno Madrugada Despacho & Rutas',
        startTime: '05:00',
        endTime: '13:00',
        breakMinutes: 45,
        toleranceMinutes: 10,
      },
      {
        name: 'Turno Central Operaciones & Flota',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
      {
        name: 'Turno Tarde Logística & Recepción',
        startTime: '13:00',
        endTime: '21:00',
        breakMinutes: 45,
        toleranceMinutes: 10,
      },
    ],
    'clinica-santa-ines': [
      {
        name: 'Turno Hospitalario Diurno',
        startTime: '07:00',
        endTime: '15:00',
        breakMinutes: 45,
        toleranceMinutes: 10,
      },
      {
        name: 'Turno Hospitalario Vespertino',
        startTime: '14:00',
        endTime: '22:00',
        breakMinutes: 45,
        toleranceMinutes: 10,
      },
      {
        name: 'Guardia Médica 24/7 Rotativa',
        startTime: '20:00',
        endTime: '08:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
      {
        name: 'Consulta Externa Administrativa',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
    ],
    'retail-pacifico': [
      {
        name: 'Turno Apertura Comercial & Puntos de Venta',
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
      {
        name: 'Turno Cierre Comercial & Tiendas',
        startTime: '12:00',
        endTime: '21:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
      {
        name: 'Horario Administrativo Compras & Finanzas',
        startTime: '08:30',
        endTime: '17:30',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
    ],
    'manufacturas-pichincha': [
      {
        name: 'Turno Planta Mañana (Producción)',
        startTime: '06:00',
        endTime: '14:00',
        breakMinutes: 45,
        toleranceMinutes: 10,
      },
      {
        name: 'Turno Planta Tarde (Ensamble & EPPs)',
        startTime: '14:00',
        endTime: '22:00',
        breakMinutes: 45,
        toleranceMinutes: 10,
      },
      {
        name: 'Control de Calidad & Mantenimiento',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
    ],
  };

  for (const tenant of tenants) {
    const templates = SHIFT_TEMPLATES_BY_SECTOR[tenant.slug] || [
      {
        name: 'Jornada Ordinaria Diurna',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        toleranceMinutes: 15,
      },
      {
        name: 'Turno Vespertino / Rotativo',
        startTime: '13:00',
        endTime: '21:00',
        breakMinutes: 45,
        toleranceMinutes: 10,
      },
    ];

    const createdShifts = [];
    for (const tpl of templates) {
      let existing = await prisma.shift.findFirst({
        where: { tenantId: tenant.id, name: tpl.name },
      });
      if (!existing) {
        existing = await prisma.shift.create({
          data: {
            tenantId: tenant.id,
            name: tpl.name,
            startTime: tpl.startTime,
            endTime: tpl.endTime,
            breakMinutes: tpl.breakMinutes,
            toleranceMinutes: tpl.toleranceMinutes,
          },
        });
      }
      createdShifts.push(existing);
    }
    tenantShifts[tenant.id] = createdShifts;
  }

  const contractsBatch = [];
  const schedulesBatch = [];
  const skillsBatch = [];
  const historyBatch = [];
  const assetsBatch = [];

  const tenantTemporaryContractCounts = {};
  const tenantEmployeeIndex = {};

  const techAssetsPool = [
    {
      name: 'Laptop Lenovo ThinkPad T14 Gen 4 Core i7 32GB',
      category: 'EQUIPMENT',
      prefix: 'LEN-T14',
    },
    { name: 'Monitor Dell UltraSharp 27" 4K USB-C Hub', category: 'EQUIPMENT', prefix: 'DEL-U27' },
    { name: 'Kit Teclado y Mouse Ergonómico Logitech MX', category: 'TOOL', prefix: 'LOG-MX' },
    {
      name: 'Tarjeta de Acceso RFID Piso Tecnológico',
      category: 'ACCESS_CARD',
      prefix: 'RFID-TEC',
    },
  ];

  const opsAssetsPool = [
    {
      name: 'Casco de Seguridad Dieléctrico 3M Clase E',
      category: 'UNIFORM_PPE',
      prefix: '3M-CSC',
    },
    { name: 'Chaleco de Alta Visibilidad Norma INEN', category: 'UNIFORM_PPE', prefix: 'PPE-CHL' },
    {
      name: 'Botas de Seguridad Industrial con Puntera',
      category: 'UNIFORM_PPE',
      prefix: 'PPE-BOT',
    },
    { name: 'Lector Handheld Zebra TC21 Barcode/QR', category: 'TOOL', prefix: 'ZEB-TC' },
    {
      name: 'Tarjeta RFID Puerta Acceso Bodega y Planta',
      category: 'ACCESS_CARD',
      prefix: 'RFID-OPS',
    },
  ];

  const corpAssetsPool = [
    { name: 'Laptop HP EliteBook 840 G9 Core i5 16GB', category: 'EQUIPMENT', prefix: 'HP-840' },
    { name: 'Smartphone Corporativo Samsung Galaxy A54', category: 'EQUIPMENT', prefix: 'SAM-A54' },
    { name: 'Mochila Ejecutiva Porta-Laptop Impermeable', category: 'TOOL', prefix: 'DOT-MCH' },
    {
      name: 'Credencial Magnética Acceso Edificio Corporativo',
      category: 'ACCESS_CARD',
      prefix: 'RFID-CORP',
    },
  ];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const decSal = decryptSalary(emp.salary) || 1500;
    const tId = emp.tenantId || 'global';
    tenantEmployeeIndex[tId] = (tenantEmployeeIndex[tId] || 0) + 1;
    const relIdx = tenantEmployeeIndex[tId];

    let contractEndDate = null;
    if (!emp.isActive) {
      contractEndDate = emp.exitDate || new Date();
    } else if (
      emp.contractType === 'Temporal' ||
      emp.contractType === 'Plazo Fijo' ||
      emp.contractType === 'Eventual'
    ) {
      tenantTemporaryContractCounts[tId] = (tenantTemporaryContractCounts[tId] || 0) + 1;
      const tempIdx = tenantTemporaryContractCounts[tId];
      if (tempIdx === 1) {
        contractEndDate = new Date(Date.now() + 11 * 24 * 60 * 60 * 1000); // 11 días (CRITICAL <= 15d)
      } else if (tempIdx === 2) {
        contractEndDate = new Date(Date.now() + 24 * 24 * 60 * 60 * 1000); // 24 días (MODERATE 16-30d)
      } else {
        const daysRemaining = 45 + ((emp.id.charCodeAt(0) * 7) % 15);
        contractEndDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000); // NORMAL > 30d
      }
    }

    contractsBatch.push({
      employeeId: emp.id,
      type: emp.contractType || 'Indefinido',
      startDate: emp.hireDate || new Date('2020-01-01'),
      endDate: contractEndDate,
      salary: decSal,
      status: emp.isActive ? 'Active' : 'Terminated',
    });

    // Activos asignados según departamento
    let pool = corpAssetsPool;
    if (emp.department === 'Tecnología') pool = techAssetsPool;
    else if (
      emp.department === 'Operaciones' ||
      emp.department === 'Logística' ||
      emp.department === 'Producción'
    )
      pool = opsAssetsPool;

    // Asignar entre 2 y 3 activos por colaborador
    const assetCount = 2 + (i % 2);
    for (let a = 0; a < assetCount; a++) {
      const template = pool[a % pool.length];
      const serialNumber = `SN-${template.prefix}-${1000 + i * 10 + a}`;

      // Variar estados para poblar todas las pestañas de la vista (Custodia, Devuelto, Dañado)
      let status = 'DELIVERED';
      let condition = 'GOOD';
      let returnDate = null;
      let returnNotes = null;

      if (!emp.isActive) {
        status = 'RETURNED';
        condition = 'GOOD';
        returnDate = emp.exitDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        returnNotes = 'Devolución completa de activos por proceso de finiquito y liquidación.';
      } else if (relIdx === 2 && a === 1) {
        status = 'RETURNED';
        condition = 'GOOD';
        returnDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        returnNotes = 'Devolución por recambio tecnológico programado de dotación.';
      } else if (relIdx === 3 && a === 0) {
        status = 'LOST_DAMAGED';
        condition = 'FAIR';
        returnNotes = 'Reporte de daño accidental en pantalla o estructura. En inspección técnica.';
      }

      assetsBatch.push({
        employeeId: emp.id,
        name: template.name,
        serialNumber,
        category: template.category,
        deliveryDate: emp.hireDate || new Date('2023-01-15'),
        condition,
        status,
        returnDate,
        returnNotes,
        receiptSignatureUrl: null,
      });
    }

    if (!emp.isActive) continue;

    const availableShifts = (emp.tenantId && tenantShifts[emp.tenantId]) || [defaultShift];
    let selectedShift = availableShifts[0];

    if (availableShifts.length > 1) {
      const dept = emp.department || '';
      const pos = emp.position || '';
      if (
        dept.includes('Tecnolog') ||
        pos.includes('Desarrollador') ||
        pos.includes('DevOps') ||
        pos.includes('Cloud')
      ) {
        selectedShift = availableShifts[1] || availableShifts[0];
      } else if (
        dept.includes('Operacion') ||
        dept.includes('Logística') ||
        dept.includes('Producción') ||
        dept.includes('Salud')
      ) {
        selectedShift = availableShifts[i % availableShifts.length];
      } else if (dept.includes('Venta') || dept.includes('Comercial') || dept.includes('Tienda')) {
        selectedShift = availableShifts[availableShifts.length > 2 ? 1 : 0];
      }
    }

    schedulesBatch.push({
      employeeId: emp.id,
      shiftId: selectedShift.id,
      startDate: emp.hireDate || new Date('2020-01-01'),
      daysOfWeek: JSON.stringify(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']),
    });

    skillsBatch.push(
      { employeeId: emp.id, name: 'Trabajo en Equipo', level: 'Advanced' },
      { employeeId: emp.id, name: 'Comunicación Efectiva', level: 'Intermediate' },
      {
        employeeId: emp.id,
        name: 'Resolución de Problemas',
        level: getRandomElement(['Intermediate', 'Advanced']),
      }
    );

    historyBatch.push({
      employeeId: emp.id,
      company: 'Experiencia Previa Corporativa',
      position: emp.position || 'Especialista',
      startDate: new Date('2018-01-01'),
      endDate: new Date('2020-01-01'),
      description: 'Desempeño en proyectos previos del sector.',
    });
  }

  if (contractsBatch.length > 0) {
    await prisma.contract.createMany({ data: contractsBatch, skipDuplicates: true });
  }
  if (assetsBatch.length > 0) {
    await prisma.employeeAsset.createMany({ data: assetsBatch, skipDuplicates: true });
  }
  if (schedulesBatch.length > 0) {
    await prisma.employeeSchedule.createMany({ data: schedulesBatch, skipDuplicates: true });
  }
  if (skillsBatch.length > 0) {
    await prisma.skill.createMany({ data: skillsBatch, skipDuplicates: true });
  }
  if (historyBatch.length > 0) {
    await prisma.workHistory.createMany({ data: historyBatch, skipDuplicates: true });
  }

  console.log(`Registros core optimizados creados (${assetsBatch.length} activos/EPPs sembrados).`);
}
