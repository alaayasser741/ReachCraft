import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getDatabase } from '../db/connection.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name?: string;
  role: 'super_admin' | 'user';
  plan: string;
  is_verified: number;
  onboarding_completed: number;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // Support both httpOnly cookie and Authorization: Bearer <token>
  const cookieToken = req.cookies?.token;
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : undefined;

  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: number; email: string };
    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, email, name, role, plan, is_verified, onboarding_completed, status 
      FROM users 
      WHERE id = ?
    `).get(decoded.id) as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, error: 'تم تجميد هذا الحساب لمخالفة سياسة الاستخدام العادل. يرجى التواصل مع الدعم.' });
      return;
    }

    req.user = user;
    next();
  } catch (_err) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session' });
  }
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Forbidden: Super Admin access required' });
      return;
    }
    next();
  });
}
