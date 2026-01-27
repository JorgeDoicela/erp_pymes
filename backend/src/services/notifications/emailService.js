import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // Can be configured via env vars
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendEmail({ to, subject, html }) {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('--- EMAIL SIMULATION ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('Content:', html);
            console.log('------------------------');
            return;
        }

        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;

        while (attempts < maxAttempts) {
            try {
                await this.transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to,
                    subject,
                    html
                });
                console.log(`Email sent to ${to} (Attempt ${attempts + 1})`);
                return; // Éxito
            } catch (error) {
                attempts++;
                lastError = error;
                console.error(`Attempt ${attempts} failed to send email to ${to}:`, error.message);

                if (attempts < maxAttempts) {
                    const delay = Math.pow(2, attempts) * 1000; // 2s, 4s...
                    console.log(`Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`Failed to send email to ${to} after ${maxAttempts} attempts.`);
        throw lastError;
    }
}

export default new EmailService();
