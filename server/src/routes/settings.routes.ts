import { Router, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { env } from '../config/env.js';
import { getEmailProvider } from '../services/email/providerFactory.js';
import { NodemailerProvider } from '../services/email/nodemailerProvider.js';

const router = Router();

// GET /api/settings
router.get('/', requireAuth, (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const rows = db.prepare('SELECT key, value FROM app_settings').all() as Array<{
    key: string;
    value: string;
  }>;

  const dbMap = new Map<string, string>();
  rows.forEach((r) => dbMap.set(r.key, r.value));

  const settings = {
    smtp_host: dbMap.get('smtp_host') || env.SMTP_HOST,
    smtp_port: Number(dbMap.get('smtp_port') || env.SMTP_PORT),
    smtp_secure: dbMap.get('smtp_secure') ? dbMap.get('smtp_secure') === 'true' : env.SMTP_SECURE,
    smtp_user: dbMap.get('smtp_user') || env.SMTP_USER,
    smtp_has_pass: Boolean(dbMap.get('smtp_pass') || env.SMTP_PASS),
    smtp_from_name: dbMap.get('smtp_from_name') || env.SMTP_FROM_NAME,
    smtp_from_email: dbMap.get('smtp_from_email') || env.SMTP_FROM_EMAIL,
    email_daily_cap: Number(dbMap.get('email_daily_cap') || env.EMAIL_DAILY_CAP),
    email_min_interval: Number(dbMap.get('email_min_interval') || env.EMAIL_MIN_INTERVAL_SEC),
    email_max_interval: Number(dbMap.get('email_max_interval') || env.EMAIL_MAX_INTERVAL_SEC),

    whatsapp_provider: dbMap.get('whatsapp_provider') || env.WHATSAPP_PROVIDER,
    whatsapp_daily_cap: Number(dbMap.get('whatsapp_daily_cap') || env.WHATSAPP_DAILY_CAP),
    whatsapp_warmup: dbMap.get('whatsapp_warmup') ? dbMap.get('whatsapp_warmup') === 'true' : env.WHATSAPP_WARMUP_MODE,

    gemini_api_key: dbMap.get('gemini_api_key') || env.GEMINI_API_KEY || '',
    gemini_has_key: Boolean(dbMap.get('gemini_api_key') || env.GEMINI_API_KEY),
    gemini_model: dbMap.get('gemini_model') || env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  };

  res.json({ success: true, settings });
});

// POST /api/settings
const updateSettingsSchema = z.object({
  smtp_host: z.string().optional(),
  smtp_port: z.number().optional(),
  smtp_secure: z.boolean().optional(),
  smtp_user: z.string().optional(),
  smtp_pass: z.string().optional(),
  smtp_from_name: z.string().optional(),
  smtp_from_email: z.string().optional(),
  email_daily_cap: z.number().min(1).max(2000).optional(),
  email_min_interval: z.number().min(1).optional(),
  email_max_interval: z.number().min(1).optional(),
  whatsapp_provider: z.enum(['click-to-chat', 'session', 'cloud']).optional(),
  whatsapp_daily_cap: z.number().min(1).max(200).optional(),
  whatsapp_warmup: z.boolean().optional(),
  gemini_api_key: z.string().optional(),
  gemini_model: z.string().optional(),
});

router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const parseResult = updateSettingsSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parseResult.error.format() });
    return;
  }

  const db = getDatabase();
  const upsertStmt = db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  Object.entries(parseResult.data).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      if (key === 'smtp_pass') {
        const sanitizedVal = String(val).replace(/\s+/g, '');
        // Guard against browser autofilling the admin panel password into the SMTP password field
        if (sanitizedVal === '' || sanitizedVal === env.ADMIN_PASSWORD || sanitizedVal === 'adminStrongPass2026!') {
          return;
        }
        upsertStmt.run(key, sanitizedVal);
      } else {
        upsertStmt.run(key, String(val));
      }
    }
  });

  res.json({ success: true, message: 'Settings saved successfully' });
});

// POST /api/settings/test-smtp
router.post('/test-smtp', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  let provider;
  const { host, port, secure, user, pass } = req.body || {};

  const cleanPass = pass ? String(pass).replace(/\s+/g, '') : '';
  const isAutofillAdminPass = cleanPass === env.ADMIN_PASSWORD || cleanPass === 'adminStrongPass2026!';

  if (user && cleanPass && !isAutofillAdminPass) {
    provider = new NodemailerProvider({
      host: host || 'smtp.gmail.com',
      port: port ? Number(port) : 465,
      secure: secure !== undefined ? Boolean(secure) : true,
      user: String(user).trim(),
      pass: cleanPass,
    });
  } else {
    // Use saved server password
    provider = getEmailProvider();
  }

  const result = await provider.verifyConnection();

  if (result.success) {
    res.json({ success: true, message: 'تم التحقق من اتصال SMTP بنجاح! جاهز للإرسال (SMTP Verified)' });
  } else {
    let friendlyError = result.error || 'Failed to authenticate with SMTP server. Please verify your App Password and host settings.';
    if (result.error?.includes('535') || result.error?.includes('BadCredentials')) {
      friendlyError = 'فشل التحقق من Google (535 Bad Credentials): تم رفض بيانات الدخول. يرجى التأكد من استخدام كلمة مرور التطبيق (App Password المكونة من 16 حرفاً من https://myaccount.google.com/apppasswords) وتجنب استخدام كلمة مرور الدخول للوحة التحكم أو كلمة مرور الحساب العادية.';
    }
    res.status(400).json({
      success: false,
      error: friendlyError,
    });
  }
});

export default router;
