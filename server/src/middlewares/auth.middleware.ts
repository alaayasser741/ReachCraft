import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getDatabase } from '../db/connection.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
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
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(decoded.id) as
      | { id: number; email: string }
      | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (_err) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session' });
  }
}
