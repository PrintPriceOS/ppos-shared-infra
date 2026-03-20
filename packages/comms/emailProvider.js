const nodemailer = require('nodemailer');
const SecretManager = require('../ops/SecretManager');

class NotifierEmailProvider {
    constructor() {
        this.transporter = null;
        this.from = SecretManager.get('SMTP_FROM') || 'noreply@printprice.pro';
    }

    async init() {
        if (this.transporter) return;

        console.log('[SHARED-INFRA][EMAIL-PROVIDER] Initializing SMTP transporter...');
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: SecretManager.get('SMTP_USER'),
                pass: SecretManager.get('SMTP_PASS')
            },
            connectionTimeout: 10000,
        });

        try {
            await this.transporter.verify();
            console.log('[SHARED-INFRA][EMAIL-PROVIDER] SMTP connection verified.');
        } catch (err) {
            console.error('[SHARED-INFRA][EMAIL-PROVIDER] SMTP verification failed:', err.message);
            this.transporter = null;
            throw err;
        }
    }

    async sendEmail({ to, subject, text, html, metadata = {} }) {
        if (!this.transporter) {
            await this.init();
        }

        const info = await this.transporter.sendMail({
            from: this.from,
            to,
            subject,
            text,
            html
        });

        console.log(`[SHARED-INFRA][EMAIL-PROVIDER] Email sent to ${to}: ${info.messageId}`);
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    }
}

module.exports = new NotifierEmailProvider();
