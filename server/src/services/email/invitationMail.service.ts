import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
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

export interface InvitationEmailOptions {
  email: string;
  name?: string;
  token: string;
  plan?: string;
  customMessage?: string;
  language?: 'ar' | 'en';
}

/**
 * Send an invitation email to try ReachCraft with high inbox deliverability & branding.
 */
export async function sendInvitationEmail(options: InvitationEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const isAr = options.language !== 'en';
    const baseUrl = (env.CLIENT_URL || 'https://reachcraft.fly.dev').replace(/\/$/, '');
    const inviteUrl = `${baseUrl}/register?invitation=${options.token}&email=${encodeURIComponent(options.email)}`;

    const logoPath = resolveLogoPath();
    const logoCid = 'reachcraft-logo@platform';
    const logoSrc = logoPath ? `cid:${logoCid}` : `${baseUrl}/logo.png`;

    // Spam-safe, clean subject without hype or spam words
    const subject = isAr
      ? 'دعوة للانضمام إلى منصة ReachCraft'
      : "You're invited to join ReachCraft";

    const planLabel = options.plan === 'pro'
      ? (isAr ? 'باقة المحترفين (Pro Plan)' : 'Pro Plan Included')
      : (isAr ? 'تجربة بيتا مجانية (Beta Access)' : 'Beta Free Access');

    // 1. Plain Text Alternative (CRITICAL for anti-spam)
    const textBody = isAr
      ? `مرحباً ${options.name ? options.name : ''}،

تلقيت دعوة خاصة لتجربة منصة ReachCraft لأتمتة التواصل والوصول إلى جهات الاتصال المستهدفة.

الباقة الممنوحة: ${planLabel}

${options.customMessage ? `ملاحظة الإدارة:\n"${options.customMessage}"\n\n` : ''}أبرز ميزات المنصة:
- استخراج جهات الاتصال والكتالوجات بالذكاء الاصطناعي (OCR + AI).
- رادار فحص جودة الرسائل ومكافحة السبام لضمان الوصول لصندوق البريد.
- نظام إرسال ذكي بفواصل بشرية لحماية الحسابات.
- صندوق بريد موحد لمتابعة الردود وترجمتها فورياً.

لتفعيل حسابك وبدء التجربة مباشرة، تفضل بزيارة الرابط التالي:
${inviteUrl}

(هذه الدعوة صالحة لمدة 14 يوماً)

فريق عمل ReachCraft
${baseUrl}`
      : `Hello ${options.name ? options.name : ''},

You have been invited to try ReachCraft - the B2B outreach and lead intelligence platform.

Assigned Plan: ${planLabel}

${options.customMessage ? `Admin Note:\n"${options.customMessage}"\n\n` : ''}Key Features:
- Directory & PDF Lead Extraction with AI.
- Deliverability Radar to optimize inbox placement.
- Humanized Pacing and anti-ban safeguards.
- Unified response inbox with instant translation.

Activate your trial account using this link:
${inviteUrl}

(This invitation is valid for 14 days)

The ReachCraft Team
${baseUrl}`;

    // 2. High-deliverability, clean HTML template
    const htmlBody = isAr ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>دعوة لتجربة ReachCraft</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px 12px; margin: 0; line-height: 1.6;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);" border="0" cellspacing="0" cellpadding="0">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: #064e3b; padding: 36px 24px 28px 24px; text-align: center;">
                    <img src="${logoSrc}" alt="ReachCraft" width="60" height="60" style="width: 60px; height: 60px; border-radius: 14px; display: inline-block; vertical-align: middle; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 14px 0 4px 0; letter-spacing: -0.3px;">ReachCraft</h1>
                    <p style="color: #a7f3d0; font-size: 13px; margin: 0;">منصة أتمتة التواصل والوصول لجهات الاتصال المستهدفة</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 32px 28px; text-align: right;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: bold;">
                        ${planLabel}
                      </span>
                    </div>

                    <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">
                      مرحباً ${options.name ? options.name : ''} 👋
                    </h2>
                    
                    <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">
                      يسعدنا دعوتك لتجربة منصة <strong>ReachCraft</strong>، الأداة المتخصصة لمساعدة فرق العمل وتطوير الأعمال على استخراج بيانات الشركات والتواصل الفعّال بذكاء واحترافية.
                    </p>

                    ${options.customMessage ? `
                      <div style="background-color: #f0fdf4; border-right: 4px solid #10b981; border-radius: 6px 12px 12px 6px; padding: 14px 18px; margin: 18px 0; color: #065f46; font-size: 13px;">
                        <strong style="display: block; margin-bottom: 4px;">رسالة من الإدارة:</strong>
                        «${options.customMessage}»
                      </div>
                    ` : ''}

                    <!-- Features -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; margin: 20px 0;">
                      <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">ما تقدمه لك المنصة:</div>
                      
                      <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                        • <strong>استخراج البيانات:</strong> تحويل ملفات الكتالوجات وPDF إلى جهات اتصال جاهزة.
                      </div>
                      <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                        • <strong>رادار فحص التسليم:</strong> تحسين محتوى الرسائل وتجنب مرشحات السبام.
                      </div>
                      <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                        • <strong>حماية الحسابات:</strong> إرسال بفواصل زمنية بشرية آمنة.
                      </div>
                      <div style="font-size: 13px; color: #334155;">
                        • <strong>صندوق وارد موحد:</strong> إدارة الردود والترجمة الفورية للغات متعددة.
                      </div>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 28px 0 20px 0;">
                      <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                        تفعيل الحساب وبدء التجربة ←
                      </a>
                    </div>

                    <!-- Direct link fallback -->
                    <p style="font-size: 11px; color: #64748b; text-align: center; word-break: break-all; margin: 16px 0 0 0;">
                      إذا لم يعمل الزر أعلاه، انسخ الرابط التالي:<br>
                      <a href="${inviteUrl}" style="color: #059669; text-decoration: underline;">${inviteUrl}</a>
                    </p>

                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 14px;">
                      صلاحية رابط الدعوة 14 يوماً من تاريخ استلام الرسالة.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
                    منصة ReachCraft • منصة أتمتة التواصل الذكي<br>
                    © ${new Date().getFullYear()} ReachCraft. جميع الحقوق محفوظة.
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
        <title>ReachCraft Invitation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px 12px; margin: 0; line-height: 1.6;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);" border="0" cellspacing="0" cellpadding="0">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: #064e3b; padding: 36px 24px 28px 24px; text-align: center;">
                    <img src="${logoSrc}" alt="ReachCraft" width="60" height="60" style="width: 60px; height: 60px; border-radius: 14px; display: inline-block; vertical-align: middle; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 14px 0 4px 0; letter-spacing: -0.3px;">ReachCraft</h1>
                    <p style="color: #a7f3d0; font-size: 13px; margin: 0;">B2B Outreach & Targeted Lead Intelligence</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 32px 28px; text-align: left;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: bold;">
                        ${planLabel}
                      </span>
                    </div>

                    <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">
                      Hello ${options.name ? options.name : ''} 👋
                    </h2>
                    
                    <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">
                      You have been invited to test <strong>ReachCraft</strong>, the all-in-one platform built to help sales and business development teams extract lead directories and manage cold outreach with high deliverability.
                    </p>

                    ${options.customMessage ? `
                      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 12px 6px 6px 12px; padding: 14px 18px; margin: 18px 0; color: #065f46; font-size: 13px;">
                        <strong style="display: block; margin-bottom: 4px;">Note from the Admin:</strong>
                        "${options.customMessage}"
                      </div>
                    ` : ''}

                    <!-- Features -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; margin: 20px 0;">
                      <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Platform Highlights:</div>
                      
                      <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                        • <strong>Directory Extraction:</strong> OCR and AI parser to turn PDFs into verified leads.
                      </div>
                      <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                        • <strong>Deliverability Radar:</strong> Content analysis to maximize primary inbox placement.
                      </div>
                      <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                        • <strong>Anti-Ban Pacing:</strong> Safe, humanized intervals protecting sender reputation.
                      </div>
                      <div style="font-size: 13px; color: #334155;">
                        • <strong>Unified Inbox:</strong> Two-way tracking and real-time multilingual translation.
                      </div>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 28px 0 20px 0;">
                      <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                        Accept Invitation & Activate Trial →
                      </a>
                    </div>

                    <!-- Direct link fallback -->
                    <p style="font-size: 11px; color: #64748b; text-align: center; word-break: break-all; margin: 16px 0 0 0;">
                      If the button doesn't work, copy and paste this URL:<br>
                      <a href="${inviteUrl}" style="color: #059669; text-decoration: underline;">${inviteUrl}</a>
                    </p>

                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 14px;">
                      This invitation is valid for 14 days from dispatch.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
                    ReachCraft Platform • B2B Sales Automation<br>
                    © ${new Date().getFullYear()} ReachCraft. All rights reserved.
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
      to: options.email,
      replyTo: env.SMTP_USER,
      subject,
      text: textBody,
      html: htmlBody,
      headers: {
        'X-Entity-Ref-ID': `invitation-${options.token}`,
        'X-Mailer': 'ReachCraft Cloud Mailer',
        'Auto-Submitted': 'auto-generated',
        'List-Unsubscribe': `<mailto:${env.SMTP_USER}?subject=unsubscribe>`,
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

    logger.info({ email: options.email, token: options.token }, 'Sent platform invitation email successfully');
    return { success: true };
  } catch (err: any) {
    logger.error({ error: err.message, email: options.email }, 'Failed to send platform invitation email');
    return { success: false, error: err.message || 'Failed to dispatch email' };
  }
}
