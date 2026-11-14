import { Router, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { logActivity } from '../services/activityLogger.js';

const router = Router();

// GET /api/companies
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
  const hasDirect = req.query.hasDirectContact !== undefined ? Number(req.query.hasDirectContact) : null;
  const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : undefined;
  const limit = req.query.limit ? Math.max(1, Math.min(200, parseInt(String(req.query.limit), 10))) : undefined;

  let whereClause = ' WHERE c.user_id = ?';
  const params: any[] = [userId];

  if (search) {
    whereClause += ` AND (c.name LIKE ? OR c.description LIKE ? OR c.website LIKE ?)`;
    params.push(search, search, search);
  }

  if (hasDirect !== null) {
    whereClause += ` AND c.has_direct_contact = ?`;
    params.push(hasDirect);
  }

  const countQuery = `SELECT COUNT(*) as c FROM companies c ${whereClause}`;
  const total = (db.prepare(countQuery).get(...params) as { c: number }).c;

  let query = `
    SELECT 
      c.id, c.name, c.website, c.description, c.address, c.source_file_id, c.has_direct_contact, c.created_at,
      COUNT(DISTINCT ct.id) as contact_count,
      COUNT(DISTINCT cl.id) as link_count
    FROM companies c
    LEFT JOIN contacts ct ON ct.company_id = c.id
    LEFT JOIN company_links cl ON cl.company_id = c.id
    ${whereClause}
    GROUP BY c.id ORDER BY c.id ASC
  `;

  const queryParams = [...params];
  if (page && limit) {
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
  }

  const companies = db.prepare(query).all(...queryParams);
  res.json({
    success: true,
    count: companies.length,
    total,
    page: page || 1,
    limit: limit || total,
    totalPages: limit ? Math.ceil(total / limit) : 1,
    companies,
  });
});

// GET /api/companies/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const companyId = req.params.id;

  const company = db.prepare(`SELECT * FROM companies WHERE id = ? AND user_id = ?`).get(companyId, userId) as any;
  if (!company) {
    res.status(404).json({ success: false, error: 'Company not found' });
    return;
  }

  const contacts = db.prepare(`SELECT * FROM contacts WHERE company_id = ? ORDER BY id ASC`).all(companyId);
  const links = db.prepare(`SELECT * FROM company_links WHERE company_id = ? ORDER BY id ASC`).all(companyId);

  res.json({
    success: true,
    company: {
      ...company,
      contacts,
      links,
    },
  });
});

// PATCH /api/companies/:id
const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  has_direct_contact: z.number().min(0).max(1).optional(),
});

router.patch('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const parseResult = updateCompanySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Invalid input', details: parseResult.error.format() });
    return;
  }

  const db = getDatabase();
  const userId = req.user!.id;
  const companyId = req.params.id;
  const updates = parseResult.data;

  const fields: string[] = [];
  const params: any[] = [];
  const existing = db.prepare('SELECT name FROM companies WHERE id = ? AND user_id = ?').get(companyId, userId) as any;

  if (!existing) {
    res.status(404).json({ success: false, error: 'Company not found' });
    return;
  }

  Object.entries(updates).forEach(([key, val]) => {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      params.push(val);
    }
  });

  if (fields.length === 0) {
    res.json({ success: true, message: 'No changes provided' });
    return;
  }

  fields.push("updated_at = datetime('now')");
  params.push(companyId, userId);

  db.prepare(`UPDATE companies SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);

  logActivity({
    category: 'company',
    action: 'update',
    title: `تعديل بيانات الشركة: ${updates.name || existing?.name || `#${companyId}`}`,
    details: updates,
    userId,
  });

  res.json({ success: true, message: 'Company updated successfully' });
});

// DELETE /api/companies/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const existing = db.prepare('SELECT name FROM companies WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;

  if (!existing) {
    res.status(404).json({ success: false, error: 'Company not found' });
    return;
  }

  db.prepare(`DELETE FROM companies WHERE id = ? AND user_id = ?`).run(req.params.id, userId);

  logActivity({
    category: 'company',
    action: 'delete',
    title: `حذف شركة: ${existing?.name || `#${req.params.id}`}`,
    status: 'warning',
    userId,
  });

  res.json({ success: true, message: 'Company deleted successfully' });
});

export default router;
