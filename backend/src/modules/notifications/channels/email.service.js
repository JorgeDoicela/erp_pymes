/**
 * @file email.service.js
 * @description Norma ERP - Servicio Profesional de Envío de Correos Electrónicos (SMTP Transaccional / Nodemailer)
 * Soporta servidores SMTP estándar (Amazon SES, SendGrid, Resend, Brevo, Postmark, Exchange), pooling de conexiones,
 * verificación proactiva de salud (healthcheck), fallback a texto plano antispam y modo simulación.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    this.mode = 'simulation'; // 'smtp' | 'gmail' | 'simulation'
    this.defaultFrom = process.env.EMAIL_FROM || 'Norma ERP <noreply@normaerp.com>';
    this.defaultReplyTo = process.env.EMAIL_REPLY_TO || undefined;
    this.transporter = this._initializeTransporter();
  }

  /**
   * Inicializa el transporte de correo según las variables de entorno.
   * Prioridad:
   * 1. SMTP Transaccional / Corporativo dedicado (SMTP_HOST definido)
   * 2. Modo compatibilidad Gmail (EMAIL_USER y EMAIL_PASS definidos sin SMTP_HOST)
   * 3. Modo simulación (sin credenciales, seguro para desarrollo local)
   * @private
   */
  _initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    // 1. Modo SMTP Transaccional / Corporativo
    if (smtpHost) {
      this.mode = 'smtp';
      const port = Number(process.env.SMTP_PORT || 587);
      const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

      const transportOptions = {
        pool: process.env.SMTP_POOL !== 'false',
        maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 5),
        maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 100),
        host: smtpHost,
        port,
        secure: isSecure,
        auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
        tls: {
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
        },
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 5000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 15000),
      };

      if (emailUser && !process.env.EMAIL_FROM) {
        this.defaultFrom = `Norma ERP <${emailUser}>`;
      }

      return nodemailer.createTransport(transportOptions);
    }

    // 2. Modo compatibilidad Gmail
    if (emailUser && emailPass) {
      this.mode = 'gmail';
      if (!process.env.EMAIL_FROM) {
        this.defaultFrom = `Norma ERP <${emailUser}>`;
      }
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    }

    // 3. Modo Simulación (sin credenciales)
    this.mode = 'simulation';
    return null;
  }

  /**
   * Convierte contenido HTML en texto plano limpio para evitar penalizaciones antispam.
   * @param {string} html
   * @returns {string}
   * @private
   */
  _stripHtmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Envía un correo electrónico transaccional con soporte para reintentos exponenciales,
   * adjuntos tipados, texto plano antispam y auditoría.
   */
  async sendEmail({
    to,
    subject,
    html,
    text,
    attachments = [],
    from,
    replyTo,
    cc,
    bcc,
    headers,
    priority,
  }) {
    if (!to || !subject) {
      throw new Error('[EmailService] Los parámetros "to" y "subject" son obligatorios.');
    }

    const plainText = text || this._stripHtmlToText(html);
    const resolvedFrom = from || this.defaultFrom;
    const resolvedReplyTo = replyTo || this.defaultReplyTo;

    // Modo simulación cuando no hay servidor SMTP configurado
    if (this.mode === 'simulation' || !this.transporter) {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║       [EMAIL SERVICE - SIMULACION LOCAL DE ENVIO]            ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log(`║ De:        ${resolvedFrom}`);
      console.log(`║ Para:      ${Array.isArray(to) ? to.join(', ') : to}`);
      console.log(`║ Asunto:    ${subject}`);
      if (attachments && attachments.length > 0) {
        console.log(`║ Adjuntos:  ${attachments.map((a) => a.filename || 'archivo').join(', ')}`);
      }
      console.log('║ Resumen de contenido:');
      console.log(`║ ${plainText.slice(0, 180).replace(/\n/g, ' ')}...`);
      console.log('╚══════════════════════════════════════════════════════════════╝');
      return { success: true, simulated: true, mode: 'simulation' };
    }

    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    const mailOptions = {
      from: resolvedFrom,
      to,
      subject,
      html,
      text: plainText,
      attachments,
      ...(resolvedReplyTo && { replyTo: resolvedReplyTo }),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(headers && { headers }),
      ...(priority && { priority }),
    };

    while (attempts < maxAttempts) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log(
          `[EmailService] Correo enviado exitosamente a ${to} (Intento ${attempts + 1}, ID: ${info?.messageId || 'OK'})`
        );
        return {
          success: true,
          messageId: info?.messageId,
          attempts: attempts + 1,
          mode: this.mode,
        };
      } catch (error) {
        attempts++;
        lastError = error;
        console.error(
          `[EmailService] Falló el intento ${attempts} de enviar correo a ${to}:`,
          error.message
        );

        if (attempts < maxAttempts) {
          const delay = Math.pow(2, attempts) * 1000;
          console.log(`[EmailService] Reintentando en ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(
      `[EmailService] Se agotaron los ${maxAttempts} intentos de envío a ${to}. Error raíz:`,
      lastError?.message
    );
    throw lastError;
  }

  /**
   * Diagnóstico y comprobación de salud de la conexión SMTP (Health check).
   * @returns {Promise<{
   *   configured: boolean,
   *   mode: string,
   *   verified: boolean,
   *   message: string,
   *   host?: string,
   *   from: string
   * }>}
   */
  async verifyConnection() {
    if (this.mode === 'simulation' || !this.transporter) {
      return {
        configured: false,
        mode: 'simulation',
        verified: true,
        message:
          'Modo simulación activo (los correos se registran en consola). No hay servidor SMTP configurado.',
        from: this.defaultFrom,
      };
    }

    try {
      await this.transporter.verify();
      return {
        configured: true,
        mode: this.mode,
        verified: true,
        message: `Conexión SMTP exitosa y autenticada (${this.mode === 'smtp' ? process.env.SMTP_HOST : 'Gmail Service'}).`,
        host: process.env.SMTP_HOST || 'Gmail',
        from: this.defaultFrom,
      };
    } catch (error) {
      return {
        configured: true,
        mode: this.mode,
        verified: false,
        message: `Error al autenticar con el servidor de correo: ${error.message}`,
        host: process.env.SMTP_HOST || 'Gmail',
        from: this.defaultFrom,
      };
    }
  }
}

export default new EmailService();
