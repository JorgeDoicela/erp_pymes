/**
 * @file audit.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export async function seedAudit(prisma, employees = []) {
  console.log(
    '[AUDIT] Generando Registros de Auditoría Multi-Tenant (Auth, Nómina, Personal, Sistema)...'
  );
  if (employees.length === 0) return;

  // Limpiar logs previos para recarga idempotente
  await prisma.auditLog.deleteMany({});

  const tenants = await prisma.tenant.findMany({ where: { isActive: true } });
  const allLogsBatch = [];
  const now = Date.now();

  for (const tenant of tenants) {
    const tenantEmps = employees.filter((e) => e.tenantId === tenant.id);
    const admin = tenantEmps.find((e) => e.role === 'admin') || tenantEmps[0];
    const emp1 = tenantEmps.find((e) => e.role !== 'admin') || admin;
    const emp2 = tenantEmps.filter((e) => e.id !== admin.id && e.id !== emp1.id)[0] || emp1;

    const tenantLogs = [
      {
        entity: 'System',
        entityId: tenant.id,
        action: 'INITIALIZE_PLATFORM',
        performedBy: 'system@normaerp.com',
        details: JSON.stringify({
          tenantName: tenant.name,
          slug: tenant.slug,
          environment: 'PRODUCTION',
          modulesActive: ['HR', 'PAYROLL', 'ATTENDANCE', 'ACCOUNTING', 'AI_RAG', 'RECRUITMENT'],
        }),
        timestamp: new Date(now - 30 * 24 * 3600 * 1000),
      },
      {
        entity: 'Auth',
        entityId: admin.id,
        action: 'LOGIN',
        performedBy: admin.email,
        details: JSON.stringify({
          authMethod: 'WEBAUTHN_FIDO2',
          authenticatorName: 'Windows Hello / Touch ID Enclave',
          ipAddress: '186.101.45.12',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
        }),
        timestamp: new Date(now - 28 * 24 * 3600 * 1000 + 8 * 3600 * 1000),
      },
      {
        entity: 'Employee',
        entityId: emp1.id,
        action: 'CREATE',
        performedBy: admin.email,
        details: JSON.stringify({
          firstName: emp1.firstName,
          lastName: emp1.lastName,
          department: emp1.department,
          position: emp1.position,
          contractType: 'Indefinido',
        }),
        timestamp: new Date(now - 25 * 24 * 3600 * 1000),
      },
      {
        entity: 'Contract',
        entityId: `CTR-${tenant.slug.slice(0, 4).toUpperCase()}-01`,
        action: 'CREATE',
        performedBy: admin.email,
        details: JSON.stringify({
          employeeName: `${emp1.firstName} ${emp1.lastName}`,
          contractType: 'Contrato Indefinido Código del Trabajo',
          monthlySalaryEncrypted: true,
        }),
        timestamp: new Date(now - 24 * 24 * 3600 * 1000),
      },
      {
        entity: 'JobVacancy',
        entityId: `VAC-${tenant.slug.slice(0, 4).toUpperCase()}-101`,
        action: 'CREATE_VACANCY',
        performedBy: admin.email,
        details: JSON.stringify({
          title: `Especialista en ${emp1.department || 'Operaciones'}`,
          department: emp1.department || 'Operaciones',
          status: 'OPEN',
          targetCandidates: 3,
        }),
        timestamp: new Date(now - 20 * 24 * 3600 * 1000),
      },
      {
        entity: 'JobApplication',
        entityId: `APP-${tenant.slug.slice(0, 4).toUpperCase()}-801`,
        action: 'HIRE_CANDIDATE',
        performedBy: admin.email,
        details: JSON.stringify({
          candidateName: `${emp2.firstName} ${emp2.lastName}`,
          scoreTechnical: 92,
          recommendation: 'HIRE',
          hiringDate: new Date(now - 18 * 24 * 3600 * 1000).toISOString(),
        }),
        timestamp: new Date(now - 18 * 24 * 3600 * 1000),
      },
      {
        entity: 'Announcement',
        entityId: `ANN-${tenant.slug.slice(0, 4).toUpperCase()}-01`,
        action: 'CREATE_ANNOUNCEMENT',
        performedBy: admin.email,
        details: JSON.stringify({
          title: 'Actualización del Protocolo de Seguridad de la Información',
          priority: 'URGENT',
          requiresAcknowledgment: true,
        }),
        timestamp: new Date(now - 14 * 24 * 3600 * 1000),
      },
      {
        entity: 'Announcement',
        entityId: `ANN-${tenant.slug.slice(0, 4).toUpperCase()}-01`,
        action: 'ACKNOWLEDGE_ANNOUNCEMENT',
        performedBy: emp1.email,
        details: JSON.stringify({
          employee: `${emp1.firstName} ${emp1.lastName}`,
          ip: '190.152.88.24',
          signedAt: new Date(now - 13 * 24 * 3600 * 1000).toISOString(),
        }),
        timestamp: new Date(now - 13 * 24 * 3600 * 1000),
      },
      {
        entity: 'SalaryAdvance',
        entityId: `ADV-${tenant.slug.slice(0, 4).toUpperCase()}-02`,
        action: 'GRANT_SALARY_ADVANCE',
        performedBy: admin.email,
        details: JSON.stringify({
          beneficiary: `${emp1.firstName} ${emp1.lastName}`,
          amount: 250,
          cuotas: 2,
          status: 'APPROVED',
          reason: 'Calamidad doméstica / gastos médicos familiares',
        }),
        timestamp: new Date(now - 10 * 24 * 3600 * 1000),
      },
      {
        entity: 'Absence',
        entityId: `ABS-${tenant.slug.slice(0, 4).toUpperCase()}-05`,
        action: 'UPDATE',
        performedBy: admin.email,
        details: JSON.stringify({
          employee: `${emp2.firstName} ${emp2.lastName}`,
          type: 'MEDICAL_LEAVE',
          days: 2,
          status: 'APPROVED',
        }),
        timestamp: new Date(now - 7 * 24 * 3600 * 1000),
      },
      {
        entity: 'EmployeeEvaluation',
        entityId: `EVAL-${tenant.slug.slice(0, 4).toUpperCase()}-99`,
        action: 'ASSIGN_EVALUATION',
        performedBy: admin.email,
        details: JSON.stringify({
          campaign: 'Evaluación Trimestral 360° Desempeño y Metas SMART',
          evaluatedEmployees: tenantEmps.length,
        }),
        timestamp: new Date(now - 5 * 24 * 3600 * 1000),
      },
      {
        entity: 'EmployeeEvaluation',
        entityId: `EVAL-${tenant.slug.slice(0, 4).toUpperCase()}-99`,
        action: 'SUBMIT_ASSESSMENT',
        performedBy: emp1.email,
        details: JSON.stringify({
          reviewer: emp1.email,
          evaluated: admin.email,
          overallScore: 94,
          status: 'COMPLETED',
        }),
        timestamp: new Date(now - 4 * 24 * 3600 * 1000),
      },
      {
        entity: 'Payroll',
        entityId: `PAY-${tenant.slug.slice(0, 4).toUpperCase()}-CURR`,
        action: 'CALCULATE_PAYROLL',
        performedBy: admin.email,
        details: JSON.stringify({
          period: 'Mes en Curso',
          totalProcessed: tenantEmps.length,
          iessPatronalCalculated: true,
          overtimeIntegrated: true,
          status: 'PAID',
        }),
        timestamp: new Date(now - 2 * 24 * 3600 * 1000),
      },
      {
        entity: 'NotificationPreference',
        entityId: admin.id,
        action: 'UPDATE_NOTIFICATION_PREFERENCES',
        performedBy: admin.email,
        details: JSON.stringify({
          channels: { email: true, push: true, inApp: true },
          categories: { payroll: true, legalAlerts: true, absences: true },
        }),
        timestamp: new Date(now - 24 * 3600 * 1000),
      },
      {
        entity: 'Auth',
        entityId: 'LOGIN-SEC-ALERT',
        action: 'FAILED_LOGIN',
        performedBy: 'externo.auditoria@alerta.com',
        details: JSON.stringify({
          ipAddress: '190.152.12.90',
          reason:
            'Credenciales inválidas bloqueadas por política de protección contra fuerza bruta',
          blockedUntil: new Date(now - 12 * 3600 * 1000).toISOString(),
        }),
        timestamp: new Date(now - 13 * 3600 * 1000),
      },
      {
        entity: 'Auth',
        entityId: admin.id,
        action: 'LOGIN',
        performedBy: admin.email,
        details: JSON.stringify({
          authMethod: 'PASSWORD_HASH_BCRYPT',
          ipAddress: '186.101.45.12',
          userAgent: 'Chrome 128 / macOS Sonoma',
          sessionActive: true,
        }),
        timestamp: new Date(now - 2 * 3600 * 1000),
      },
    ];

    for (const log of tenantLogs) {
      allLogsBatch.push({
        ...log,
        tenantId: tenant.id,
      });
    }
  }

  try {
    await prisma.auditLog.createMany({
      data: allLogsBatch,
    });
    console.log(
      `[AUDIT] ${allLogsBatch.length} registros de auditoría profesional creados para ${tenants.length} empresas.`
    );
  } catch (e) {
    console.error('Error generando logs de auditoría:', e.message);
  }
}
