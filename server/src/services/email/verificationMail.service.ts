import nodemailer from 'nodemailer';
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

    // 4. Build bilingual HTML email
    const isAr = language === 'ar';
    const subject = isAr ? 'رمز التحقق الخاص بحسابك في ReachCraft' : 'Your ReachCraft Verification Code';

    const htmlBody = isAr ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; margin: 0; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .title { font-size: 24px; font-weight: bold; margin: 0; }
          .content { padding: 32px 24px; text-align: right; }
          .otp-card { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #065f46; font-family: monospace; }
          .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; }
          .security-badge { display: inline-flex; align-items: center; gap: 6px; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">ReachCraft</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">منصة استخراج جهات الاتصال والأتمتة</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="security-badge">🛡️ رمز تحقق مؤمن لمرة واحدة</span>
            </div>
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">تأكيد بريدك الإلكتروني</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              أهلاً بك! لقد استلمنا طلباً لإنشاء حساب في ReachCraft باستخدام هذا البريد. استخدم الرمز التالي لإكمال عملية التسجيل:
            </p>
            <div class="otp-card">
              <div class="otp-code">${code}</div>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #047857;">صالح لمدة 10 دقائق فقط</p>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
              إذا لم تكن قد طلبت إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان تام.
            </p>
          </div>
          <div class="footer">
            ReachCraft Verification System • حماية وتشفير متكامل
          </div>
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; margin: 0; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .title { font-size: 24px; font-weight: bold; margin: 0; }
          .content { padding: 32px 24px; text-align: left; }
          .otp-card { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #065f46; font-family: monospace; }
          .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; }
          .security-badge { display: inline-flex; align-items: center; gap: 6px; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">ReachCraft</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">B2B Outreach & Automation Platform</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="security-badge">🛡️ Secure One-Time Passcode</span>
            </div>
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Verify your email address</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              Welcome! We received a request to create a ReachCraft account with this email. Use the code below to complete your registration:
            </p>
            <div class="otp-card">
              <div class="otp-code">${code}</div>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #047857;">Expires in 10 minutes</p>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
              If you did not request this account, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            ReachCraft Verification System • Zero-knowledge Privacy Guaranteed
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = getSystemTransporter();
    await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlBody,
    });

    return { success: true, code };
  } catch (err: any) {
    logger.error({ err, email }, 'Failed to send OTP email');
    return { success: false, error: err.message || 'Failed to send verification email' };
  }
}

/**
 * Verify OTP code for a given email address.
 */
export function verifyOtpCode(email: string, code: string): { valid: boolean; message?: string } {
  const db = getDatabase();

  const record = db.prepare(`
    SELECT id, code, expires_at
    FROM email_verifications
    WHERE email = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(email.toLowerCase()) as { id: number; code: string; expires_at: string } | undefined;

  if (!record) {
    return { valid: false, message: 'No verification request found for this email' };
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(record.expires_at.replace(' ', 'T') + 'Z');

  if (now > expiresAt) {
    return { valid: false, message: 'Verification code has expired. Please request a new code.' };
  }

  if (record.code !== code.trim()) {
    return { valid: false, message: 'Incorrect verification code. Please check and try again.' };
  }

  // Delete used code
  db.prepare('DELETE FROM email_verifications WHERE email = ?').run(email.toLowerCase());

  return { valid: true };
}
