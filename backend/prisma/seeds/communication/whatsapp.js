/**
 * @file whatsapp.js
 * @description Seeder de contextos de conversación y sesiones agénticas de WhatsApp (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export async function seedWhatsapp(prisma, allEmployees = []) {
  console.log('[WHATSAPP] Generando Sesiones Agénticas y Contextos de Chat para IA...');

  try {
    await prisma.whatsappActionSession.deleteMany({});
    await prisma.whatsappConversationContext.deleteMany({});

    const tenants = await prisma.tenant.findMany({ where: { isActive: true } });
    if (tenants.length === 0 || allEmployees.length === 0) return;

    for (const tenant of tenants.slice(0, 3)) {
      const tenantEmployees = allEmployees.filter((e) => e.tenantId === tenant.id);
      const sampleEmp = tenantEmployees.find((e) => e.phone) || tenantEmployees[0];
      if (!sampleEmp) continue;

      const rawPhone = sampleEmp.phone ? sampleEmp.phone.replace(/\D/g, '') : '0991234567';
      const phoneKey = rawPhone.startsWith('593') ? rawPhone : `593${rawPhone.replace(/^0/, '')}`;

      // Actualizar consentimiento LOPDP para el colaborador de muestra
      await prisma.employee.update({
        where: { id: sampleEmp.id },
        data: { whatsappConsent: true, whatsappConsentDate: new Date() },
      });

      // 1. Contexto de conversación de WhatsApp
      await prisma.whatsappConversationContext.create({
        data: {
          phoneKey,
          activeTenantId: tenant.id,
          pendingTenantSelectionJson: null,
        },
      });

      // 2. Sesión agéntica completada (Vacaciones vía WhatsApp)
      await prisma.whatsappActionSession.create({
        data: {
          tenantId: tenant.id,
          employeeId: sampleEmp.id,
          phoneKey,
          skillName: 'requestVacation',
          status: 'COMPLETED',
          payloadJson: {
            startDate: '2026-12-22',
            endDate: '2026-12-29',
            reason: 'Vacaciones de fin de año coordinadas con jefatura',
            requestedVia: 'WHATSAPP_AI_AGENT',
          },
          otpSentToEmail: sampleEmp.email,
          attempts: 1,
          maxAttempts: 3,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          resultingEntityId: 'VAC-APPROVED-WA',
        },
      });

      // 3. Sesión agéntica completada (Anticipo salarial vía WhatsApp)
      await prisma.whatsappActionSession.create({
        data: {
          tenantId: tenant.id,
          employeeId: sampleEmp.id,
          phoneKey,
          skillName: 'requestSalaryAdvance',
          status: 'COMPLETED',
          payloadJson: {
            amount: 200,
            installments: 2,
            reason: 'Anticipo quincenal para gastos educativos',
          },
          otpSentToEmail: sampleEmp.email,
          attempts: 1,
          maxAttempts: 3,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          resultingEntityId: 'ADV-APPROVED-WA',
        },
      });

      // 4. Sesión agéntica activa pendiente de confirmación 2FA OTP
      await prisma.whatsappActionSession.create({
        data: {
          tenantId: tenant.id,
          employeeId: sampleEmp.id,
          phoneKey,
          skillName: 'requestPermission',
          status: 'PENDING_CONFIRMATION',
          payloadJson: {
            permissionType: 'Cita Médica IESS Especialista',
            hours: 3.5,
            date: '2026-11-20',
          },
          otpSentToEmail: sampleEmp.email,
          attempts: 0,
          maxAttempts: 3,
          expiresAt: new Date(Date.now() + 20 * 60 * 1000), // Vence en 20 min
        },
      });
    }

    console.log('[WHATSAPP] Contextos y sesiones agénticas de IA sembrados exitosamente.');
  } catch (err) {
    console.warn('[WHATSAPP] Advertencia sembrando WhatsApp sessions:', err.message);
  }
}
