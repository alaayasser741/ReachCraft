import { Router, Response } from 'express';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/logs/activity - Audit Trail of all actions (create, delete, update, campaigns, contacts, companies, files)
router.get('/activity', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';
  const showAll = isSuperAdmin && req.query.allUsers === 'true';

  const category = req.query.category as string | undefined;
  const action = req.query.action as string | undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 25), 200);
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (!showAll) {
    whereClause += ' AND user_id = ?';
    params.push(userId);
  }

  if (category && category !== 'all') {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  if (action && action !== 'all') {
    whereClause += ' AND action = ?';
    params.push(action);
  }

  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    whereClause += ' AND (title LIKE ? OR details LIKE ?)';
    params.push(search, search);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM activity_log ${whereClause}`).get(...params) as { count: number };
  let total = countRow.count;

  if (total === 0 && !showAll && !category && !action && !status && !search) {
    try {
      db.prepare(`
        INSERT INTO activity_log (category, action, title, details, status, user_id, created_at)
        VALUES ('auth', 'login', 'تهيئة مساحة العمل وبدء جلسة النشاط في منصة ReachCraft', '{"status":"active"}', 'success', ?, datetime('now'))
      `).run(userId);
      total = 1;
    } catch {}
  }

  const totalPages = Math.ceil(total / limit) || 1;

  const activities = db.prepare(`
    SELECT * FROM activity_log
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    success: true,
    count: activities.length,
    total,
    page,
    limit,
    totalPages,
    activities,
  });
});

// GET /api/logs - Outreach Message Logs (email / WhatsApp delivery details)
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';
  const showAll = isSuperAdmin && req.query.allUsers === 'true';

  const campaignId = req.query.campaignId ? Number(req.query.campaignId) : null;
  const channel = req.query.channel as string | undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (!showAll) {
    whereClause += ' AND ml.user_id = ?';
    params.push(userId);
  }

  if (campaignId) {
    whereClause += ' AND ml.campaign_id = ?';
    params.push(campaignId);
  }

  if (channel && ['email', 'whatsapp'].includes(channel)) {
    whereClause += ' AND ml.channel = ?';
    params.push(channel);
  }

  if (status && status !== 'all') {
    whereClause += ' AND ml.status = ?';
    params.push(status);
  }

  if (search) {
    whereClause += ' AND (ml.recipient_address LIKE ? OR ml.subject LIKE ? OR ct.person_name LIKE ? OR comp.name LIKE ?)';
    params.push(search, search, search, search);
  }

  const countQuery = `
    SELECT COUNT(*) as count 
    FROM message_log ml
    LEFT JOIN contacts ct ON ct.id = ml.contact_id
    LEFT JOIN companies comp ON comp.id = ct.company_id
    ${whereClause}
  `;
  const countRow = db.prepare(countQuery).get(...params) as { count: number };
  const total = countRow.count;
  const totalPages = Math.ceil(total / limit) || 1;

  const query = `
    SELECT 
      ml.*,
      c.name as campaign_name,
      ct.person_name,
      comp.name as company_name
    FROM message_log ml
    LEFT JOIN campaigns c ON c.id = ml.campaign_id
    LEFT JOIN contacts ct ON ct.id = ml.contact_id
    LEFT JOIN companies comp ON comp.id = ct.company_id
    ${whereClause}
    ORDER BY ml.id DESC
    LIMIT ? OFFSET ?
  `;

  const logs = db.prepare(query).all(...params, limit, offset);
  res.json({ success: true, count: logs.length, total, page, limit, totalPages, logs });
});

// GET /api/logs/stats
router.get('/stats', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';
  const showAll = isSuperAdmin && req.query.allUsers === 'true';

  const userFilter = showAll ? '' : 'WHERE user_id = ?';
  const userAndFilter = showAll ? '' : 'AND user_id = ?';
  const mlUserFilter = showAll ? '' : 'WHERE ml.user_id = ?';
  const mlUserAnd = showAll ? '' : 'AND ml.user_id = ?';

  const p = showAll ? [] : [userId];

  // Activity Log Stats
  const totalActivities = (db.prepare(`SELECT COUNT(*) as c FROM activity_log ${userFilter}`).get(...p) as { c: number })?.c || 0;
  const activitiesToday = (db.prepare(`SELECT COUNT(*) as c FROM activity_log WHERE created_at >= date('now', 'start of day') ${userAndFilter}`).get(...p) as { c: number })?.c || 0;

  // Breakdown by activity category
  const activityCategories = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM activity_log 
    ${userFilter}
    GROUP BY category
  `).all(...p) as Array<{ category: string; count: number }>;

  // Message Log Stats
  const totalLogs = (db.prepare(`SELECT COUNT(*) as count FROM message_log ${userFilter}`).get(...p) as { count: number }).count;
  const emailSent = (
    db.prepare(`SELECT COUNT(*) as count FROM message_log WHERE channel = 'email' AND status = 'sent' ${userAndFilter}`).get(...p) as {
      count: number;
    }
  ).count;
  const waSent = (
    db.prepare(`SELECT COUNT(*) as count FROM message_log WHERE channel = 'whatsapp' AND status = 'sent' ${userAndFilter}`).get(...p) as {
      count: number;
    }
  ).count;
  const dryRuns = (
    db.prepare(`SELECT COUNT(*) as count FROM message_log WHERE status = 'dry_run' ${userAndFilter}`).get(...p) as { count: number }
  ).count;
  const failed = (
    db.prepare(`SELECT COUNT(*) as count FROM message_log WHERE status = 'failed' ${userAndFilter}`).get(...p) as { count: number }
  ).count;

  // Today's sent
  const emailToday = (
    db.prepare(`
      SELECT COUNT(*) as count FROM message_log 
      WHERE channel = 'email' AND status = 'sent' 
      AND created_at >= date('now', 'start of day')
      ${userAndFilter}
    `).get(...p) as { count: number }
  ).count;

  const waToday = (
    db.prepare(`
      SELECT COUNT(*) as count FROM message_log 
      WHERE channel = 'whatsapp' AND status = 'sent' 
      AND created_at >= date('now', 'start of day')
      ${userAndFilter}
    `).get(...p) as { count: number }
  ).count;

  res.json({
    success: true,
    stats: {
      totalActivities,
      activitiesToday,
      activityCategories,
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
