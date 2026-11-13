import { Router, Response } from 'express';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/logs
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const campaignId = req.query.campaignId ? Number(req.query.campaignId) : null;
  const channel = req.query.channel as string | undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;

  let query = `
    SELECT 
      ml.*,
      c.name as campaign_name,
      ct.person_name,
      comp.name as company_name
    FROM message_log ml
    LEFT JOIN campaigns c ON c.id = ml.campaign_id
    LEFT JOIN contacts ct ON ct.id = ml.contact_id
    LEFT JOIN companies comp ON comp.id = ct.company_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (campaignId) {
    query += ' AND ml.campaign_id = ?';
    params.push(campaignId);
  }

  if (channel && ['email', 'whatsapp'].includes(channel)) {
    query += ' AND ml.channel = ?';
    params.push(channel);
  }

  if (status) {
    query += ' AND ml.status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (ml.recipient_address LIKE ? OR ml.subject LIKE ? OR ct.person_name LIKE ? OR comp.name LIKE ?)';
    params.push(search, search, search, search);
  }

  query += ' ORDER BY ml.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = db.prepare(query).all(...params);
  res.json({ success: true, count: logs.length, logs });
});

// GET /api/logs/stats
router.get('/stats', requireAuth, (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();

  const totalLogs = (db.prepare('SELECT COUNT(*) as count FROM message_log').get() as { count: number }).count;
  const emailSent = (
    db.prepare("SELECT COUNT(*) as count FROM message_log WHERE channel = 'email' AND status = 'sent'").get() as {
      count: number;
    }
  ).count;
  const waSent = (
    db.prepare("SELECT COUNT(*) as count FROM message_log WHERE channel = 'whatsapp' AND status = 'sent'").get() as {
      count: number;
    }
  ).count;
  const dryRuns = (
    db.prepare("SELECT COUNT(*) as count FROM message_log WHERE status = 'dry_run'").get() as { count: number }
  ).count;
  const failed = (
    db.prepare("SELECT COUNT(*) as count FROM message_log WHERE status = 'failed'").get() as { count: number }
  ).count;

  // Today's sent
  const emailToday = (
    db.prepare(`
      SELECT COUNT(*) as count FROM message_log 
      WHERE channel = 'email' AND status = 'sent' 
      AND created_at >= date('now', 'start of day')
    `).get() as { count: number }
  ).count;

  const waToday = (
    db.prepare(`
      SELECT COUNT(*) as count FROM message_log 
      WHERE channel = 'whatsapp' AND status = 'sent' 
      AND created_at >= date('now', 'start of day')
    `).get() as { count: number }
  ).count;

  res.json({
    success: true,
    stats: {
      totalLogs,
      emailSent,
      waSent,
      dryRuns,
      failed,
      emailToday,
      waToday,
    },
  });
});

export default router;
