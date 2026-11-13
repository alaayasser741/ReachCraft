import nodemailer, { Transporter } from 'nodemailer';
import { EmailMessage, EmailProvider, EmailSendResult } from './emailProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class NodemailerProvider implements EmailProvider {
  public name: string;
  private transporter: Transporter;
  private fromName: string;
  private fromEmail: string;

  constructor(options?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    fromName?: string;
    fromEmail?: string;
    providerName?: string;
  }) {
    this.name = options?.providerName || env.EMAIL_PROVIDER || 'nodemailer';
    const host = options?.host || env.SMTP_HOST;
    const port = options?.port || env.SMTP_PORT;
    const secure = options?.secure !== undefined ? options.secure : env.SMTP_SECURE;
    const user = options?.user || env.SMTP_USER;
    const pass = options?.pass || env.SMTP_PASS;

    this.fromName = options?.fromName || env.SMTP_FROM_NAME;
    this.fromEmail = options?.fromEmail || env.SMTP_FROM_EMAIL;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (err: any) {
      logger.error({ err }, 'SMTP connection verification failed');
      return {
        success: false,
        error: err.message || 'Failed to connect to SMTP server',
      };
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    const from = `"${message.fromName || this.fromName}" <${message.fromEmail || this.fromEmail}>`;

    // Ensure plain text version exists
    let text = message.text;
    if (!text && message.html) {
      text = message.html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Append compliant unsubscribe footer
    let htmlWithFooter = message.html;
    if (message.unsubscribeUrl) {
      const footerHtml = `
        <br><hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 12px 0;">
        <p style="font-size:12px;color:#64748b;line-height:1.5;">
          You received this message because your business contact was found in exhibition/professional directories.<br>
          If you no longer wish to receive updates, you can <a href="${message.unsubscribeUrl}" style="color:#0284c7;text-decoration:underline;">unsubscribe here</a>.
        </p>
      `;
      htmlWithFooter += footerHtml;
      text += `\n\nUnsubscribe: ${message.unsubscribeUrl}`;
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        html: htmlWithFooter,
        text,
        headers: message.unsubscribeUrl
          ? {
              'List-Unsubscribe': `<${message.unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            }
          : undefined,
      });

      logger.info({ to: message.to, messageId: info.messageId }, 'Email sent successfully');

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      logger.error({ to: message.to, err }, 'Failed to send email');

      const errMsg = (err.message || '').toLowerCase();
      const code = err.code || '';

      // Check if quota, rate limit, auth, or spam block error from Google/SMTP
      const isQuotaOrAuthError =
        code === 'EAUTH' ||
        errMsg.includes('quota') ||
        errMsg.includes('limit exceeded') ||
        errMsg.includes('too many') ||
        errMsg.includes('550') ||
        errMsg.includes('535') ||
        errMsg.includes('452') ||
        errMsg.includes('421') ||
        errMsg.includes('554') ||
        errMsg.includes('rate limit') ||
        errMsg.includes('badcredentials') ||
        errMsg.includes('suspicious activity') ||
        errMsg.includes('unsolicited mail') ||
        errMsg.includes('temporarily deferred') ||
        errMsg.includes('try again later');

      return {
        success: false,
        error: err.message || 'Unknown email sending error',
        isQuotaOrAuthError,
      };
    }
  }
}
