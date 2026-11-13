import { Router, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/companies
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
  const hasDirect = req.query.hasDirectContact !== undefined ? Number(req.query.hasDirectContact) : null;

  let query = `
    SELECT 
      c.id, c.name, c.website, c.description, c.address, c.source_file_id, c.has_direct_contact, c.created_at,
      COUNT(DISTINCT ct.id) as contact_count,
      COUNT(DISTINCT cl.id) as link_count
    FROM companies c
    LEFT JOIN contacts ct ON ct.company_id = c.id
    LEFT JOIN company_links cl ON cl.company_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    query += ` AND (c.name LIKE ? OR c.description LIKE ? OR c.website LIKE ?)`;
    params.push(search, search, search);
  }

  if (hasDirect !== null) {
    query += ` AND c.has_direct_contact = ?`;
    params.push(hasDirect);
  }

  query += ` GROUP BY c.id ORDER BY c.id ASC`;

  const companies = db.prepare(query).all(...params);
  res.json({ success: true, companies });
});

// GET /api/companies/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const companyId = req.params.id;

  const company = db.prepare(`SELECT * FROM companies WHERE id = ?`).get(companyId) as any;
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
  const companyId = req.params.id;
  const updates = parseResult.data;

  const fields: string[] = [];
  const params: any[] = [];

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
  params.push(companyId);

  db.prepare(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  res.json({ success: true, message: 'Company updated successfully' });
});

// DELETE /api/companies/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  db.prepare(`DELETE FROM companies WHERE id = ?`).run(req.params.id);
  res.json({ success: true, message: 'Company deleted successfully' });
});

export default router;
