/**
 * @file notification.service.js
 * @description Norma ERP - Servicio de Notificaciones Multicanal (In-App, WebSocket, Email)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import notificationRepository from './notification.repository.js';
import emailService from './email.service.js';
import socketService from './socket.service.js';
import auditRepository from '../audit/audit.repository.js';

export class NotificationService {
  async createNotification(data) {
    const notification = await notificationRepository.create({
      recipientId: data.recipientId,
      title: data.title,
      message: data.message,
      type: data.type,
      relatedEntity: data.relatedEntity,
      relatedEntityId: data.relatedEntityId,
    });

    socketService.sendToUser(data.recipientId, 'new_notification', notification);
    return notification;
  }

  async checkPreferences(employeeId, type, channel) {
    try {
      const prefs = await notificationRepository.findPreferencesByEmployeeId(employeeId);
      if (!prefs || !prefs.preferences) return true;

      const typePrefs = prefs.preferences[type];
      if (!typePrefs) return true;

      return typePrefs[channel] !== false;
    } catch (error) {
      console.error('Error checking preferences:', error);
      return true;
    }
  }

  async getStatsForUser(userId) {
    return notificationRepository.getStatsForUser(userId);
  }

  async getNotificationsForUser(userId, query) {
    return notificationRepository.findPaginatedForUser(userId, query);
  }

  async getUnreadCountForUser(userId) {
    return notificationRepository.countUnreadForUser(userId);
  }

  async markAsRead(id, userId) {
    const notification = await notificationRepository.findById(id);
    if (!notification || notification.recipientId !== userId) {
      return null;
    }
    return notificationRepository.markAsReadById(id);
  }

  async markAllAsRead(userId) {
    return notificationRepository.markAllAsReadForUser(userId);
  }

  async deleteNotification(id, userId) {
    const notification = await notificationRepository.findById(id);
    if (!notification || notification.recipientId !== userId) {
      return false;
    }
    await notificationRepository.deleteById(id);
    return true;
  }

  async clearReadNotifications(userId) {
    return notificationRepository.deleteReadForUser(userId);
  }

  async getPreferences(employeeId) {
    const prefs = await notificationRepository.findPreferencesByEmployeeId(employeeId);
    return prefs || { employeeId, preferences: {} };
  }

  async updatePreferences(employeeId, preferences, tenantId = null) {
    const prefs = await notificationRepository.upsertPreferences(employeeId, preferences);

    await auditRepository
      .log({
        tenantId: tenantId || null,
        entity: 'NotificationPreference',
        entityId: prefs.id,
        action: 'UPDATE_NOTIFICATION_PREFERENCES',
        userId: employeeId,
        details: { updatedEventKeys: Object.keys(preferences || {}) },
      })
      .catch((err) => console.error('[Audit Error] updatePreferences:', err));

    return prefs;
  }

  async sendContractExpirationAlert(contract, daysRemaining) {
    const tenantId = contract.employee?.tenantId;
    const admins = await notificationRepository.findActiveAdmins(tenantId);

    const subject = `Alerta de Vencimiento de Contrato: ${contract.employee.firstName} ${contract.employee.lastName}`;
    const message = `El contrato del empleado ${contract.employee.firstName} ${contract.employee.lastName} vence en ${daysRemaining} días (Fecha: ${new Date(contract.endDate).toLocaleDateString()}).`;

    for (const admin of admins) {
      if (await this.checkPreferences(admin.id, 'CONTRACT_EXPIRATION', 'inApp')) {
        await this.createNotification({
          recipientId: admin.id,
          title: 'Contrato Próximo a Vencer',
          message,
          type: 'CONTRACT_EXPIRATION',
          relatedEntity: 'Contract',
          relatedEntityId: contract.id,
        });
      }

      if (await this.checkPreferences(admin.id, 'CONTRACT_EXPIRATION', 'email')) {
        await emailService.sendEmail({
          to: admin.email,
          subject,
          html: `<p>${message}</p><p>Por favor revise la sección de contratos.</p>`,
        });
      }
    }
  }

  async sendEvaluationReminder({
    recipientId,
    recipientEmail,
    employeeName,
    daysRemaining,
    evaluationId,
  }) {
    const title = 'Recordatorio de Evaluación Pendiente';
    const message = `Tienes una evaluación pendiente para ${employeeName} que vence en ${daysRemaining} días.`;

    if (await this.checkPreferences(recipientId, 'EVALUATION_REMINDER', 'inApp')) {
      await this.createNotification({
        recipientId,
        title,
        message,
        type: 'EVALUATION_REMINDER',
        relatedEntity: 'EmployeeEvaluation',
        relatedEntityId: evaluationId,
      });
    }

    if (await this.checkPreferences(recipientId, 'EVALUATION_REMINDER', 'email')) {
      await emailService.sendEmail({
        to: recipientEmail,
        subject: title,
        html: `<p>${message}</p><p>Por favor completa la evaluación antes de la fecha límite.</p>`,
      });
    }
  }

  async sendEvaluationExpiredAlert({ employeeName, evaluationId, tenantId }) {
    const admins = await notificationRepository.findActiveAdmins(tenantId);
    const title = `Evaluación Vencida: ${employeeName}`;
    const message = `La evaluación de desempeño de ${employeeName} ha vencido y está incompleta.`;

    for (const admin of admins) {
      await this.createNotification({
        recipientId: admin.id,
        title,
        message,
        type: 'EVALUATION_EXPIRED',
        relatedEntity: 'EmployeeEvaluation',
        relatedEntityId: evaluationId,
      });

      await emailService.sendEmail({
        to: admin.email,
        subject: title,
        html: `<p>${message}</p><p>Por favor revise el estado de las evaluaciones.</p>`,
      });
    }
  }

  async sendEvaluationAssigned({
    recipientId,
    recipientEmail,
    title,
    employeeName,
    endDate,
    evaluationId,
    role,
  }) {
    const notifTitle = `Nueva Evaluación Asignada: ${title}`;
    const message =
      role === 'REVIEWER'
        ? `Has sido asignado para evaluar a ${employeeName}. Fecha límite: ${new Date(endDate).toLocaleDateString()}.`
        : `Se te ha asignado una nueva evaluación: ${title}. Fecha límite: ${new Date(endDate).toLocaleDateString()}.`;

    if (await this.checkPreferences(recipientId, 'EVALUATION_ASSIGNED', 'inApp')) {
      await this.createNotification({
        recipientId,
        title: notifTitle,
        message,
        type: 'EVALUATION_ASSIGNED',
        relatedEntity: 'EmployeeEvaluation',
        relatedEntityId: evaluationId,
      });
    }

    if (await this.checkPreferences(recipientId, 'EVALUATION_ASSIGNED', 'email')) {
      await emailService.sendEmail({
        to: recipientEmail,
        subject: notifTitle,
        html: `<p>${message}</p><p>Ingresa al sistema para completarla.</p>`,
      });
    }
  }

  async sendAbsenceRequested({ recipientId, employeeName, type, startDate, endDate, requestId }) {
    const title = `Nueva Solicitud de Ausencia: ${employeeName}`;
    const message = `${employeeName} ha solicitado ${type} del ${new Date(startDate).toLocaleDateString()} al ${new Date(endDate).toLocaleDateString()}.`;

    await this.createNotification({
      recipientId,
      title,
      message,
      type: 'ABSENCE_REQUEST',
      relatedEntity: 'AbsenceRequest',
      relatedEntityId: requestId,
    });
  }

  async sendAbsenceReminder({ recipientId, employeeName, hoursPending, requestId }) {
    const title = `Recordatorio: Solicitud Pendiente (${hoursPending}h)`;
    const message = `La solicitud de ${employeeName} lleva ${hoursPending} horas esperando aprobación.`;

    await this.createNotification({
      recipientId,
      title,
      message,
      type: 'ABSENCE_REMINDER',
      relatedEntity: 'AbsenceRequest',
      relatedEntityId: requestId,
    });
  }

  async sendAbsenceEscalation({ recipientId, employeeName, hoursPending, requestId }) {
    const title = `Escalación: Solicitud sin atender (${hoursPending}h)`;
    const message = `ATENCIÓN: La solicitud de ${employeeName} no ha sido respondida en ${hoursPending} horas.`;

    await this.createNotification({
      recipientId,
      title,
      message,
      type: 'ABSENCE_ESCALATION',
      relatedEntity: 'AbsenceRequest',
      relatedEntityId: requestId,
    });

    const recipient = await notificationRepository.findEmployeeById(recipientId);
    await emailService.sendEmail({
      to: recipient.email,
      subject: title,
      html: `<p>${message}</p>`,
    });
  }

  async sendAbsenceResolved({ recipientId, type, status, adminComment, requestId }) {
    const isApproved = status === 'APPROVED';
    const title = `Solicitud de Ausencia ${isApproved ? 'Aprobada' : 'Rechazada'}`;
    const commentText = adminComment ? ` Comentario: "${adminComment}".` : '';
    const message = `Tu solicitud de ${type} ha sido ${isApproved ? 'APROBADA' : 'RECHAZADA'}.${commentText}`;

    await this.createNotification({
      recipientId,
      title,
      message,
      type: isApproved ? 'ABSENCE_APPROVED' : 'ABSENCE_REJECTED',
      relatedEntity: 'AbsenceRequest',
      relatedEntityId: requestId,
    });
  }

  async _deliverConfiguredAlert({ recipientId, title, message, type, relatedEntity, relatedEntityId }) {
    if (await this.checkPreferences(recipientId, type, 'inApp')) {
      await this.createNotification({
        recipientId,
        title,
        message,
        type,
        relatedEntity,
        relatedEntityId,
      });
    }

    const employee = await notificationRepository.findEmployeeById(recipientId);
    if (employee && (await this.checkPreferences(recipientId, type, 'email'))) {
      await emailService.sendEmail({
        to: employee.email,
        subject: title,
        html: `<p>${message}</p>`,
      });
    }
  }

  async sendDocumentExpirationAlert({ recipientId, documentType, daysRemaining, documentId }) {
    await this._deliverConfiguredAlert({
      recipientId,
      title: `Documento Próximo a Vencer: ${documentType}`,
      message: `Tu documento "${documentType}" vence en ${daysRemaining} días. Por favor renuévalo.`,
      type: 'DOCUMENT_EXPIRATION',
      relatedEntity: 'Document',
      relatedEntityId: documentId,
    });
  }

  async sendPayrollAlert({ recipientId, title, message, type }) {
    await this._deliverConfiguredAlert({
      recipientId,
      title,
      message,
      type,
      relatedEntity: 'Payroll',
      relatedEntityId: null,
    });
  }
}

export default new NotificationService();

