import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { getDatabase } from '../../db/connection.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

let transporterInstance: nodemailer.Transporter | null = null;

function getSystemTransporter(): nodemailer.Transporter {
  if (transporterInstance) return transporterInstance;

  transporterInstance = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporterInstance;
}

function resolveLogoPath(): string | null {
  const possiblePaths = [
    path.resolve(process.cwd(), 'client/dist/logo.png'),
    path.resolve(process.cwd(), 'client/public/logo.png'),
    path.resolve(process.cwd(), 'dist/logo.png'),
    path.resolve(__dirname, '../../../../client/dist/logo.png'),
    path.resolve(__dirname, '../../../../client/public/logo.png'),
    path.resolve(__dirname, '../../../client/public/logo.png'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

/**
 * Generate a 6-digit OTP and send it via the official ReachCraft verification email.
 */
export async function sendOtpEmail(email: string, language: 'ar' | 'en' = 'ar'): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const db = getDatabase();

    // 1. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Invalidate previous pending codes for this email
    db.prepare('DELETE FROM email_verifications WHERE email = ?').run(email.toLowerCase());

    // 3. Save new code with 10 minutes expiry
    db.prepare(`
      INSERT INTO email_verifications (email, code, expires_at)
      VALUES (?, ?, datetime('now', '+10 minutes'))
    `).run(email.toLowerCase(), code);

    logger.info({ email, code }, 'Generated registration OTP code');

    // 4. Build bilingual HTML email + Plain text version
    const isAr = language === 'ar';
    const baseUrl = (env.CLIENT_URL || 'https://reachcraft.fly.dev').replace(/\/$/, '');
    const subject = isAr ? 'رمز التحقق الخاص بحسابك في ReachCraft' : 'Your ReachCraft Verification Code';

    const logoPath = resolveLogoPath();
    const logoCid = 'reachcraft-logo@platform';
    const logoSrc = logoPath ? `cid:${logoCid}` : `${baseUrl}/logo.png`;

    const textBody = isAr
      ? `رمز التحقق الخاص بحسابك في ReachCraft

استخدم الرمز التالي لتأكيد بريدك الإلكتروني وإكمال إنشاء الحساب:
${code}

صلاحية هذا الرمز هي 10 دقائق فقط.
إذا لم تكن قد طلبت هذا الرمز، يمكنك تجاهل هذه الرسالة.

فريق ReachCraft
${baseUrl}`
      : `Your ReachCraft Verification Code

Use the following verification code to confirm your email and complete registration:
${code}

This code is valid for 10 minutes only.
If you did not request this, you can safely ignore this email.

ReachCraft Team
${baseUrl}`;

    const htmlBody = isAr ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px 12px; margin: 0; line-height: 1.6;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #064e3b; padding: 32px 24px 24px 24px; text-align: center;">
                    <img src="${logoSrc}" alt="ReachCraft" width="56" height="56" style="width: 56px; height: 56px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 12px 0 0 0;">ReachCraft</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 28px; text-align: right;">
                    <h2 style="font-size: 16px; color: #0f172a; margin-top: 0; font-weight: 700;">تأكيد بريدك الإلكتروني</h2>
                    <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
                      استخدم الرمز التالي لإكمال تسجيل حسابك في منصة ReachCraft:
                    </p>
                    <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
                      <div style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #065f46; font-family: monospace;">${code}</div>
                      <p style="margin: 6px 0 0 0; font-size: 12px; color: #047857;">صالح لمدة 10 دقائق فقط</p>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0 0;">
                      إذا لم تكن قد طلبت إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان تام.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
                    نظام الحماية والتحقق • ReachCraft Verification
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px 12px; margin: 0; line-height: 1.6;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #064e3b; padding: 32px 24px 24px 24px; text-align: center;">
                    <img src="${logoSrc}" alt="ReachCraft" width="56" height="56" style="width: 56px; height: 56px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 12px 0 0 0;">ReachCraft</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 28px; text-align: left;">
                    <h2 style="font-size: 16px; color: #0f172a; margin-top: 0; font-weight: 700;">Confirm Your Email</h2>
                    <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
                      Use the following one-time code to complete your ReachCraft account registration:
                    </p>
                    <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
                      <div style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #065f46; font-family: monospace;">${code}</div>
                      <p style="margin: 6px 0 0 0; font-size: 12px; color: #047857;">Valid for 10 minutes only</p>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0 0;">
                      If you did not request this registration, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
                    Security Verification • ReachCraft
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const transporter = getSystemTransporter();

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${env.SMTP_FROM_NAME || 'ReachCraft'}" <${env.SMTP_USER}>`,
      to: email,
      replyTo: env.SMTP_USER,
      subject,
      text: textBody,
      html: htmlBody,
      headers: {
        'X-Mailer': 'ReachCraft Verification System',
        'Auto-Submitted': 'auto-generated',
      },
    };

    if (logoPath) {
      mailOptions.attachments = [
        {
          filename: 'reachcraft-logo.png',
          path: logoPath,
          cid: logoCid,
          contentDisposition: 'inline',
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    return { success: true, code };
  } catch (err: any) {
    logger.error({ error: err.message, email }, 'Failed to send OTP verification email');
    return { success: false, error: err.message || 'Failed to send OTP code' };
  }
}

/**
 * Verify a submitted 6-digit OTP code.
 */
export function verifyOtpCode(email: string, code: string): { valid: boolean; message?: string } {
  const db = getDatabase();

  const record = db.prepare(`
    SELECT * FROM email_verifications 
    WHERE email = ? AND code = ?
  `).get(email.toLowerCase(), code.trim()) as any;

  if (!record) {
    return { valid: false, message: 'كود التحقق غير صحيح أو لم يتم طلبه.' };
  }

  const now = new Date();
  const expiresAt = new Date(record.expires_at);

  if (now > expiresAt) {
    db.prepare('DELETE FROM email_verifications WHERE id = ?').run(record.id);
    return { valid: false, message: 'انتهت صلاحية رمز التحقق (10 دقائق). يرجى طلب رمز جديد.' };
  }

  // Consume code immediately upon success
  db.prepare('DELETE FROM email_verifications WHERE email = ?').run(email.toLowerCase());

  return { valid: true };
}
