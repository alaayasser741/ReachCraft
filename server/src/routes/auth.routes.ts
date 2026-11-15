import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest, AuthenticatedUser } from '../middlewares/auth.middleware.js';
import { logActivity } from '../services/activityLogger.js';
import { sendOtpEmail, verifyOtpCode } from '../services/email/verificationMail.service.js';
import { encryptSecret, decryptSecret } from '../services/encryption.service.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const registerRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms and privacy policy'),
  language: z.enum(['ar', 'en']).default('ar'),
});

const registerVerifySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
});

const onboardingSchema = z.object({
  gemini_api_key: z.string().optional(),
  smtp_user: z.string().email().optional(),
  smtp_pass: z.string().optional(),
  smtp_from_name: z.string().optional(),
  smtp_from_email: z.string().email().optional(),
});

function createSessionToken(user: { id: number; email: string }): string {
  return jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// 1. POST /api/auth/register-request-otp
router.post('/register-request-otp', async (req: Request, res: Response): Promise<void> => {
  const parseResult = registerRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: parseResult.error.format(),
    });
    return;
  }

  const { email, language } = parseResult.data;
  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    res.status(400).json({
      success: false,
      error: language === 'ar' ? 'البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' : 'Email is already registered. Please log in.',
    });
    return;
  }

  const sendResult = await sendOtpEmail(email, language);
  if (!sendResult.success) {
    res.status(500).json({
      success: false,
      error: sendResult.error || 'Failed to send verification code',
    });
    return;
  }

  res.json({
    success: true,
    message: language === 'ar' ? 'تم إرسال رمز التحقق إلى بريدك بنجاح.' : 'Verification code sent to your email.',
    // In dev mode, return the code for instant testing if needed
    devCode: env.NODE_ENV === 'development' ? sendResult.code : undefined,
  });
});

// 2. POST /api/auth/register-verify-otp
router.post('/register-verify-otp', (req: Request, res: Response): void => {
  const parseResult = registerVerifySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: parseResult.error.format(),
    });
    return;
  }

  const { name, email, password, code } = parseResult.data;
  const db = getDatabase();

  // Check OTP validity
  const otpCheck = verifyOtpCode(email, code);
  if (!otpCheck.valid) {
    res.status(400).json({
      success: false,
      error: otpCheck.message || 'Invalid or expired code',
    });
    return;
  }

  // Ensure user doesn't already exist
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    res.status(400).json({
      success: false,
      error: 'Email already registered',
    });
    return;
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Check if this user was invited by admin
  const pendingInvite = db.prepare("SELECT * FROM invitations WHERE email = ? AND status = 'sent'").get(email.toLowerCase()) as any;
  const initialPlan = pendingInvite?.plan || 'beta_free';

  const insertStmt = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, auth_provider, is_verified, plan, status, onboarding_completed, terms_accepted_at)
    VALUES (?, ?, ?, 'user', 'local', 1, ?, 'active', 0, datetime('now'))
  `);

  insertStmt.run(email.toLowerCase(), passwordHash, name, initialPlan);

  if (pendingInvite) {
    db.prepare("UPDATE invitations SET status = 'accepted', accepted_at = datetime('now') WHERE id = ?").run(pendingInvite.id);
  }

  const newUser = db.prepare(`
    SELECT id, email, name, role, plan, is_verified, onboarding_completed, status 
    FROM users 
    WHERE email = ?
  `).get(email.toLowerCase()) as unknown as AuthenticatedUser;

  const token = createSessionToken(newUser);
  setSessionCookie(res, token);

  logActivity({
    category: 'auth',
    action: 'register',
    title: `تسجيل مستخدم جديد: ${newUser.name} (${newUser.email})`,
    ip: req.ip,
    userId: newUser.id,
  });

  res.json({
    success: true,
    user: newUser,
    token,
  });
});

// 3. POST /api/auth/google
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const parseResult = googleAuthSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Invalid Google token' });
    return;
  }

  const { credential } = parseResult.data;

  try {
    // Verify credential with Google tokeninfo
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!verifyRes.ok) {
      res.status(401).json({ success: false, error: 'Failed to verify Google token' });
      return;
    }

    const payload = (await verifyRes.json()) as {
      email?: string;
      name?: string;
      email_verified?: string | boolean;
      aud?: string;
    };

    if (!payload.email) {
      res.status(400).json({ success: false, error: 'Google account missing email address' });
      return;
    }

    const db = getDatabase();
    let user = db.prepare(`
      SELECT id, email, name, role, plan, is_verified, onboarding_completed, status 
      FROM users 
      WHERE email = ?
    `).get(payload.email.toLowerCase()) as AuthenticatedUser | undefined;

    if (!user) {
      // Check if this Google user was invited by admin
      const pendingInvite = db.prepare("SELECT * FROM invitations WHERE email = ? AND status = 'sent'").get(payload.email.toLowerCase()) as any;
      const initialPlan = pendingInvite?.plan || 'beta_free';

      // First time Google registration
      const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);
      db.prepare(`
        INSERT INTO users (email, password_hash, name, role, auth_provider, is_verified, plan, status, onboarding_completed, terms_accepted_at)
        VALUES (?, ?, ?, 'user', 'google', 1, ?, 'active', 0, datetime('now'))
      `).run(payload.email.toLowerCase(), randomPassword, payload.name || payload.email.split('@')[0], initialPlan);

      if (pendingInvite) {
        db.prepare("UPDATE invitations SET status = 'accepted', accepted_at = datetime('now') WHERE id = ?").run(pendingInvite.id);
      }

      user = db.prepare(`
        SELECT id, email, name, role, plan, is_verified, onboarding_completed, status 
        FROM users 
        WHERE email = ?
      `).get(payload.email.toLowerCase()) as unknown as AuthenticatedUser;

      logActivity({
        category: 'auth',
        action: 'register_google',
        title: `تسجيل مستخدم جديد عبر Google: ${user.name} (${user.email})`,
        ip: req.ip,
        userId: user.id,
      });
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, error: 'تم تجميد هذا الحساب لمخالفة سياسة الاستخدام العادل.' });
      return;
    }

    const token = createSessionToken(user);
    setSessionCookie(res, token);

    logActivity({
      category: 'auth',
      action: 'login_google',
      title: `تسجيل دخول عبر Google: ${user.email}`,
      ip: req.ip,
      userId: user.id,
    });

    res.json({
      success: true,
      user,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Google authentication error' });
  }
});

// 4. POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: parseResult.error.format(),
    });
    return;
  }

  const { email, password } = parseResult.data;
  const db = getDatabase();

  const userWithPass = db.prepare(`
    SELECT id, email, password_hash, name, role, plan, is_verified, onboarding_completed, status 
    FROM users 
    WHERE email = ?
  `).get(email.toLowerCase()) as (AuthenticatedUser & { password_hash: string }) | undefined;

  if (!userWithPass || !bcrypt.compareSync(password, userWithPass.password_hash)) {
    res.status(401).json({
      success: false,
      error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة، يرجى التأكد والمحاولة مجدداً.',
    });
    return;
  }

  if (userWithPass.status === 'suspended') {
    res.status(403).json({ success: false, error: 'تم تجميد هذا الحساب لمخالفة شروط الاستخدام. تواصل مع الإدارة.' });
    return;
  }

  const token = createSessionToken(userWithPass);
  setSessionCookie(res, token);

  const { password_hash: _discard, ...user } = userWithPass;

  logActivity({
    category: 'auth',
    action: 'login',
    title: `تسجيل دخول: ${user.name || user.email} (${user.role})`,
    ip: req.ip,
    userId: user.id,
  });

  res.json({
    success: true,
    user,
    token,
  });
});

// 5. POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  const token = req.cookies?.token;
  let logoutUserId: number | undefined;
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      logoutUserId = decoded?.id;
    } catch {}
  }

  res.clearCookie('token');
  logActivity({
    category: 'auth',
    action: 'logout',
    title: 'تسجيل خروج من الجلسة',
    userId: logoutUserId,
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// 6. GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, user: req.user });
});

// 7. POST /api/auth/onboarding - Encrypt and save BYOK credentials
router.post('/onboarding', requireAuth, (req: AuthRequest, res: Response): void => {
  const parseResult = onboardingSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parseResult.error.format() });
    return;
  }

  const userId = req.user!.id;
  const { gemini_api_key, smtp_user, smtp_pass, smtp_from_name, smtp_from_email } = parseResult.data;

  const db = getDatabase();

  // Encrypt secrets using AES-256-GCM
  const geminiEnc = gemini_api_key ? encryptSecret(gemini_api_key.trim()) : null;
  const smtpPassEnc = smtp_pass ? encryptSecret(smtp_pass.replace(/\s+/g, '')) : null;

  // Check if integration row exists
  const existing = db.prepare('SELECT id FROM user_integrations WHERE user_id = ?').get(userId);

  if (existing) {
    const updates: string[] = [];
    const params: any[] = [];

    if (geminiEnc) {
      updates.push('gemini_api_key_encrypted = ?, gemini_api_key_iv = ?, gemini_api_key_tag = ?');
      params.push(geminiEnc.ciphertext, geminiEnc.iv, geminiEnc.tag);
    }
    if (smtp_user) {
      updates.push('smtp_user = ?');
      params.push(smtp_user.trim());
    }
    if (smtpPassEnc) {
      updates.push('smtp_pass_encrypted = ?, smtp_pass_iv = ?, smtp_pass_tag = ?');
      params.push(smtpPassEnc.ciphertext, smtpPassEnc.iv, smtpPassEnc.tag);
    }
    if (smtp_from_name) {
      updates.push('smtp_from_name = ?');
      params.push(smtp_from_name.trim());
    }
    if (smtp_from_email) {
      updates.push('smtp_from_email = ?');
      params.push(smtp_from_email.trim());
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(userId);
      db.prepare(`UPDATE user_integrations SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);
    }
  } else {
    db.prepare(`
      INSERT INTO user_integrations (
        user_id,
        gemini_api_key_encrypted, gemini_api_key_iv, gemini_api_key_tag,
        smtp_user,
        smtp_pass_encrypted, smtp_pass_iv, smtp_pass_tag,
        smtp_from_name, smtp_from_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      geminiEnc?.ciphertext || null, geminiEnc?.iv || null, geminiEnc?.tag || null,
      smtp_user || null,
      smtpPassEnc?.ciphertext || null, smtpPassEnc?.iv || null, smtpPassEnc?.tag || null,
      smtp_from_name || null,
      smtp_from_email || null
    );
  }

  // Mark onboarding complete on user record
  db.prepare("UPDATE users SET onboarding_completed = 1 WHERE id = ?").run(userId);

  const updatedUser = db.prepare(`
    SELECT id, email, name, role, plan, is_verified, onboarding_completed, status 
    FROM users 
    WHERE id = ?
  `).get(userId) as unknown as AuthenticatedUser;

  logActivity({
    category: 'settings',
    action: 'onboarding_complete',
    title: `إكمال الإعداد وتشفير بيانات الاعتماد بنجاح: ${updatedUser.email}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    user: updatedUser,
    message: 'تم تشفير وحفظ بيانات الاعتماد بأمان تام',
  });
});

// 8. GET /api/auth/integrations - Safe status check (never returns raw password)
router.get('/integrations', requireAuth, (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const db = getDatabase();

  const integration = db.prepare(`
    SELECT 
      gemini_api_key_encrypted,
      smtp_user,
      smtp_pass_encrypted,
      smtp_from_name,
      smtp_from_email,
      updated_at
    FROM user_integrations 
    WHERE user_id = ?
  `).get(userId) as any;

  res.json({
    success: true,
    integrations: {
      has_gemini_key: Boolean(integration?.gemini_api_key_encrypted),
      has_smtp_pass: Boolean(integration?.smtp_pass_encrypted),
      smtp_user: integration?.smtp_user || '',
      smtp_from_name: integration?.smtp_from_name || '',
      smtp_from_email: integration?.smtp_from_email || '',
      updated_at: integration?.updated_at || null,
    },
  });
});

export default router;
