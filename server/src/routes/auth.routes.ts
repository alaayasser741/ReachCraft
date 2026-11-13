import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

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

  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email) as
    | { id: number; email: string; password_hash: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ success: false, error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    user: { id: user.id, email: user.email },
    token,
  });
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, user: req.user });
});

export default router;
