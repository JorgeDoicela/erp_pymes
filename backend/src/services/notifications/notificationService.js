import prisma from '../../database/db.js';
import emailService from './emailService.js';
import socketService from './socketService.js';
import employeeRepository from '../../repositories/employees/employeeRepository.js'; // Assuming repository exists

class NotificationService {
    async createNotification(data) {
        const notification = await prisma.notification.create({
            data: {
                recipientId: data.recipientId,
                title: data.title,
                message: data.message,
                type: data.type,
                relatedEntity: data.relatedEntity,
                relatedEntityId: data.relatedEntityId
            }
        });

        // Enviar vía Socket.io para tiempo real
        socketService.sendToUser(data.recipientId, 'new_notification', notification);

        return notification;
    }

    async checkPreferences(employeeId, type, channel) {
        try {
            const prefs = await prisma.notificationPreference.findUnique({
                where: { employeeId }
            });

            if (!prefs || !prefs.preferences) return true; // Default: Enable params

            // preferences: { "CONTRACT_EXPIRATION": { "email": false, "inApp": true } }
            const typePrefs = prefs.preferences[type];
            if (!typePrefs) return true; // Default if type not set

            return typePrefs[channel] !== false; // Only strictly false disables it
        } catch (error) {
            console.error('Error checking preferences:', error);
            return true; // Fail safe: send it
        }
    }

    async sendContractExpirationAlert(contract, daysRemaining) {
        // 1. Find Admins (HR)
        // Ideally, we should have a repository method for this. 
        // For now, we query directly or use a known repo method if available.
        const admins = await prisma.employee.findMany({
            where: { role: 'admin', isActive: true }
        });

        const subject = `Alerta de Vencimiento de Contrato: ${contract.employee.firstName} ${contract.employee.lastName}`;
        const message = `El contrato del empleado ${contract.employee.firstName} ${contract.employee.lastName} vence en ${daysRemaining} días (Fecha: ${new Date(contract.endDate).toLocaleDateString()}).`;

        for (const admin of admins) {
            // 2. Create In-App Notification
            if (await this.checkPreferences(admin.id, 'CONTRACT_EXPIRATION', 'inApp')) {
                await this.createNotification({
                    recipientId: admin.id,
                    title: 'Contrato Próximo a Vencer',
                    message: message,
                    type: 'CONTRACT_EXPIRATION',
                    relatedEntity: 'Contract',
                    relatedEntityId: contract.id
                });
            }

            // 3. Send Email
            if (await this.checkPreferences(admin.id, 'CONTRACT_EXPIRATION', 'email')) {
                await emailService.sendEmail({
                    to: admin.email,
                    subject: subject,
                    html: `<p>${message}</p><p>Por favor revise la sección de contratos.</p>`
                });
            }
        }
    }

    async sendEvaluationReminder({ recipientId, recipientEmail, employeeName, daysRemaining, evaluationId }) {
        const title = `Recordatorio de Evaluación Pendiente`;
        const message = `Tienes una evaluación pendiente para ${employeeName} que vence en ${daysRemaining} días.`;

        // 1. In-App
        if (await this.checkPreferences(recipientId, 'EVALUATION_REMINDER', 'inApp')) {
            await this.createNotification({
                recipientId,
                title,
                message,
                type: 'EVALUATION_REMINDER',
                relatedEntity: 'EmployeeEvaluation',
                relatedEntityId: evaluationId
            });
        }

        // 2. Email
        if (await this.checkPreferences(recipientId, 'EVALUATION_REMINDER', 'email')) {
            await emailService.sendEmail({
                to: recipientEmail,
                subject: title,
                html: `<p>${message}</p><p>Por favor completa la evaluación antes de la fecha límite.</p>`
            });
        }
    }

    async sendEvaluationExpiredAlert({ employeeName, evaluationId }) {
        // Find Admins
        const admins = await prisma.employee.findMany({
            where: { role: 'admin', isActive: true }
        });

        const title = `Evaluación Vencida: ${employeeName}`;
        const message = `La evaluación de desempeño de ${employeeName} ha vencido y está incompleta.`;

        for (const admin of admins) {
            await this.createNotification({
                recipientId: admin.id,
                title,
                message,
                type: 'EVALUATION_EXPIRED',
                relatedEntity: 'EmployeeEvaluation',
                relatedEntityId: evaluationId
            });

            await emailService.sendEmail({
                to: admin.email,
                subject: title,
                html: `<p>${message}</p><p>Por favor revise el estado de las evaluaciones.</p>`
            });
        }
    }
    async sendEvaluationAssigned({ recipientId, recipientEmail, title, employeeName, endDate, evaluationId, role }) {
        const notifTitle = `Nueva Evaluación Asignada: ${title}`;
        let message = '';

        if (role === 'REVIEWER') {
            message = `Has sido asignado para evaluar a ${employeeName}. Fecha límite: ${new Date(endDate).toLocaleDateString()}.`;
        } else {
            message = `Se te ha asignado una nueva evaluación: ${title}. Fecha límite: ${new Date(endDate).toLocaleDateString()}.`;
        }

        // 1. In-App
        if (await this.checkPreferences(recipientId, 'EVALUATION_ASSIGNED', 'inApp')) {
            await this.createNotification({
                recipientId,
                title: notifTitle,
                message: message,
                type: 'EVALUATION_ASSIGNED',
                relatedEntity: 'EmployeeEvaluation',
                relatedEntityId: evaluationId
            });
        }

        // 2. Email
        if (await this.checkPreferences(recipientId, 'EVALUATION_ASSIGNED', 'email')) {
            await emailService.sendEmail({
                to: recipientEmail,
                subject: notifTitle,
                html: `<p>${message}</p><p>Ingresa al sistema para completarla.</p>`
            });
        }
    }
    async sendAbsenceRequested({ recipientId, employeeName, type, startDate, endDate, requestId }) {
        const title = `Nueva Solicitud de Ausencia: ${employeeName}`;
        const message = `${employeeName} ha solicitado ${type} del ${new Date(startDate).toLocaleDateString()} al ${new Date(endDate).toLocaleDateString()}.`;

        // In-App
        await this.createNotification({
            recipientId,
            title,
            message,
            type: 'ABSENCE_REQUEST',
            relatedEntity: 'AbsenceRequest',
            relatedEntityId: requestId
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
            relatedEntityId: requestId
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
            relatedEntityId: requestId
        });

        // Email High Priority
        await emailService.sendEmail({
            to: (await prisma.employee.findUnique({ where: { id: recipientId } })).email,
            subject: title,
            html: `<p>${message}</p>`
        });
    }


    async sendDocumentExpirationAlert({ recipientId, documentType, daysRemaining, documentId }) {
        const title = `Documento Próximo a Vencer: ${documentType}`;
        const message = `Tu documento "${documentType}" vence en ${daysRemaining} días. Por favor renuévalo.`;

        // In-App
        if (await this.checkPreferences(recipientId, 'DOCUMENT_EXPIRATION', 'inApp')) {
            await this.createNotification({
                recipientId,
                title,
                message,
                type: 'DOCUMENT_EXPIRATION',
                relatedEntity: 'Document',
                relatedEntityId: documentId
            });
        }

        // Email
        const employee = await prisma.employee.findUnique({ where: { id: recipientId } });
        if (employee) {
            if (await this.checkPreferences(recipientId, 'DOCUMENT_EXPIRATION', 'email')) {
                await emailService.sendEmail({
                    to: employee.email,
                    subject: title,
                    html: `<p>${message}</p>`
                });
            }
        }
    }

    async sendPayrollAlert({ recipientId, title, message, type }) {
        // In-App
        if (await this.checkPreferences(recipientId, type, 'inApp')) {
            await this.createNotification({
                recipientId,
                title,
                message,
                type, // PAYROLL_CLOSING, PAYROLL_REVIEW, PAYROLL_CONFIRM
                relatedEntity: 'Payroll',
                relatedEntityId: null // General alert, no specific ID required unless we create a Draft Payroll
            });
        }

        // Email
        const employee = await prisma.employee.findUnique({ where: { id: recipientId } });
        if (employee) {
            if (await this.checkPreferences(recipientId, type, 'email')) {
                await emailService.sendEmail({
                    to: employee.email,
                    subject: title,
                    html: `<p>${message}</p>`
                });
            }
        }
    }
}

export default new NotificationService();
