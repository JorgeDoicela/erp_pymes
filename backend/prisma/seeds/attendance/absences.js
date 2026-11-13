/**
 * @file absences.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export async function seedAbsences(prisma, employees) {
  console.log('[ABSENCES] Generando Solicitudes de Ausencia Narrativas...');

  const ABSENCE_PROFILES = [
    {
      email: 'kevin.arismendi@emplifi.com',
      requests: [
        {
          type: 'Enfermedad',
          daysAgo: 45,
          duration: 2,
          status: 'APPROVED',
          reason: 'Reposo médico por gastroenteritis',
          comment: 'Certificado presentado',
        },
        {
          type: 'Personal',
          daysAgo: 20,
          duration: 1,
          status: 'APPROVED',
          reason: 'Trámites bancarios urgentes',
          comment: 'Aprobado',
        },
        {
          type: 'Enfermedad',
          daysAgo: 5,
          duration: 1,
          status: 'PENDING',
          reason: 'Malestar general y migraña',
          comment: null,
        },
      ],
    },
    {
      email: 'lucia.paz@techsolutions.ec',
      requests: [
        {
          type: 'Personal',
          daysAgo: 60,
          duration: 2,
          status: 'APPROVED',
          reason: 'Asuntos familiares',
          comment: 'Aprobado',
        },
        {
          type: 'Vacaciones',
          daysAgo: 30,
          duration: 3,
          status: 'REJECTED',
          reason: 'Vacaciones cortas',
          comment: 'Superposición con entregable de departamento',
        },
        {
          type: 'Enfermedad',
          daysAgo: 10,
          duration: 1,
          status: 'PENDING',
          reason: 'Cita médica especialista',
          comment: null,
        },
      ],
    },
    {
      email: 'andres.morales@emplifi.com',
      requests: [
        {
          type: 'Vacaciones',
          daysAgo: 90,
          duration: 5,
          status: 'APPROVED',
          reason: 'Vacaciones anuales reglamentarias',
          comment: 'Aprobadas sin novedad',
        },
      ],
    },
    {
      email: 'gabriela.torres@emplifi.com',
      requests: [
        {
          type: 'Enfermedad',
          daysAgo: 40,
          duration: 2,
          status: 'APPROVED',
          reason: 'Cita de control médico',
          comment: 'Aprobado',
        },
        {
          type: 'Personal',
          daysAgo: 15,
          duration: 1,
          status: 'APPROVED',
          reason: 'Calamidad doméstica menor',
          comment: 'Aprobado',
        },
      ],
    },
    {
      email: 'camila.rodriguez@emplifi.com',
      requests: [
        {
          type: 'Personal',
          daysAgo: 25,
          duration: 1,
          status: 'APPROVED',
          reason: 'Trámite notarial',
          comment: 'Aprobado',
        },
        {
          type: 'Personal',
          daysAgo: 8,
          duration: 1,
          status: 'PENDING',
          reason: 'Renovación de licencia de conducir',
          comment: null,
        },
      ],
    },
    {
      email: 'valeria.espinoza@emplifi.com',
      requests: [
        {
          type: 'Vacaciones',
          daysAgo: 110,
          duration: 5,
          status: 'APPROVED',
          reason: 'Vacaciones programadas',
          comment: 'Aprobadas',
        },
      ],
    },
    {
      email: 'roberto.guzman@techsolutions.ec',
      requests: [
        {
          type: 'Vacaciones',
          daysAgo: 70,
          duration: 4,
          status: 'APPROVED',
          reason: 'Descanso de mitad de año',
          comment: 'Disfruta tus vacaciones',
        },
      ],
    },
  ];

  const absencesBatch = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Agrupar colaboradores por Tenant para garantizar cobertura completa en todas las empresas
  const tenantEmployeesMap = {};
  for (const emp of employees) {
    if (!emp.isActive) continue;
    const tId = emp.tenantId || 'global';
    if (!tenantEmployeesMap[tId]) tenantEmployeesMap[tId] = [];
    tenantEmployeesMap[tId].push(emp);
  }

  for (const tId of Object.keys(tenantEmployeesMap)) {
    const tEmps = tenantEmployeesMap[tId];
    const nonAdminEmps = tEmps.filter((e) => e.role !== 'admin' && e.role !== 'superadmin');
    const pool = nonAdminEmps.length >= 4 ? nonAdminEmps : tEmps;

    // Empleado 0: Vacaciones en el mes corriente (para visibilidad inmediata en TeamCalendar)
    if (pool[0]) {
      const vStart = new Date(currentYear, currentMonth, 3);
      const vEnd = new Date(currentYear, currentMonth, 6);
      absencesBatch.push({
        employeeId: pool[0].id,
        type: 'Vacaciones',
        startDate: vStart,
        endDate: vEnd,
        reason: 'Periodo de vacaciones reglamentarias del mes corriente.',
        status: 'APPROVED',
        adminComment: 'Aprobado según cronograma anual del departamento.',
      });
    }

    // Empleado 1: Permiso Médico en el mes corriente (para TeamCalendar)
    if (pool[1]) {
      const mStart = new Date(currentYear, currentMonth, 9);
      const mEnd = new Date(currentYear, currentMonth, 10);
      absencesBatch.push({
        employeeId: pool[1].id,
        type: 'Permiso Médico',
        startDate: mStart,
        endDate: mEnd,
        reason: 'Reposo ambulatorio prescrito por facultativo médico.',
        status: 'APPROVED',
        adminComment: 'Certificado médico validado por Bienestar y Salud Ocupacional.',
      });
    }

    // Empleado 2: Solicitud Pendiente (para que AdminAbsences tenga registros interactivos por aprobar)
    if (pool[2]) {
      const pStart = new Date(currentYear, currentMonth, Math.max(1, now.getDate() - 1));
      const pEnd = new Date(currentYear, currentMonth, Math.max(1, now.getDate() + 1));
      absencesBatch.push({
        employeeId: pool[2].id,
        type: 'Enfermedad',
        startDate: pStart,
        endDate: pEnd,
        reason: 'Cita con médico especialista y reposo recomendado de 48 horas.',
        status: 'PENDING',
        adminComment: null,
      });
    }

    // Empleado 3: Solicitud Rechazada (para poblar la pestaña 'Rechazados')
    if (pool[3]) {
      const rStart = new Date(currentYear, currentMonth, Math.max(1, now.getDate() - 7));
      const rEnd = new Date(currentYear, currentMonth, Math.max(1, now.getDate() - 5));
      absencesBatch.push({
        employeeId: pool[3].id,
        type: 'Personal',
        startDate: rStart,
        endDate: rEnd,
        reason: 'Permiso particular para viaje imprevisto fuera de la ciudad.',
        status: 'REJECTED',
        adminComment:
          'Superposición de fechas con cierre contable y entrega crítica del área. No cumple antelación mínima.',
      });
    }

    // Resto de colaboradores: Vacaciones históricas de meses anteriores
    for (let rIdx = 4; rIdx < pool.length; rIdx++) {
      const emp = pool[rIdx];
      const offset = (emp.id.charCodeAt(0) * 3) % 25;
      const hStart = new Date();
      hStart.setDate(hStart.getDate() - (45 + offset));
      const hEnd = new Date(hStart);
      hEnd.setDate(hStart.getDate() + 4);

      absencesBatch.push({
        employeeId: emp.id,
        type: 'Vacaciones',
        startDate: hStart,
        endDate: hEnd,
        reason: 'Descanso anual de vacaciones reglamentarias.',
        status: 'APPROVED',
        adminComment: 'Disfrute reglamentario completado sin novedades.',
      });
    }
  }

  // 2. Incorporar perfiles narrativos específicos adicionales
  for (const emp of employees) {
    if (!emp.isActive) continue;
    const profile = ABSENCE_PROFILES.find((p) => p.email === emp.email);
    if (!profile) continue;

    for (const req of profile.requests) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - req.daysAgo);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + req.duration - 1);

      absencesBatch.push({
        employeeId: emp.id,
        type: req.type,
        startDate: startDate,
        endDate: endDate,
        reason: req.reason,
        status: req.status,
        adminComment: req.comment,
      });
    }
  }

  if (absencesBatch.length > 0) {
    await prisma.absenceRequest.createMany({ data: absencesBatch, skipDuplicates: true });
  }
  console.log('[ABSENCES] Solicitudes de ausencia narrativas generadas en lote.');
}
