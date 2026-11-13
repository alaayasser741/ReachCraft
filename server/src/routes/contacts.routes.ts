import { Router, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { logActivity } from '../services/activityLogger.js';

const router = Router();

// GET /api/contacts/stats
router.get('/stats', requireAuth, (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const totalContacts = (db.prepare('SELECT COUNT(*) as c FROM contacts').get() as { c: number }).c;
  const verifiedEmails = (db.prepare("SELECT COUNT(*) as c FROM contacts WHERE is_valid_email = 1 AND email IS NOT NULL AND email != ''").get() as { c: number }).c;
  const validWhatsApp = (db.prepare("SELECT COUNT(*) as c FROM contacts WHERE is_valid_whatsapp = 1 AND ((whatsapp_number IS NOT NULL AND whatsapp_number != '') OR (phone_mobile IS NOT NULL AND phone_mobile != ''))").get() as { c: number }).c;
  const optedOut = (db.prepare('SELECT COUNT(*) as c FROM contacts WHERE opted_out = 1').get() as { c: number }).c;
  const totalCompanies = (db.prepare('SELECT COUNT(*) as c FROM companies').get() as { c: number }).c;

  res.json({
    success: true,
    stats: {
      totalContacts,
      verifiedEmails,
      validWhatsApp,
      optedOut,
      totalCompanies,
    },
  });
});

// GET /api/contacts
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
  const companyId = req.query.companyId ? Number(req.query.companyId) : null;
  const hasEmail = req.query.hasEmail !== undefined ? req.query.hasEmail === 'true' : null;
  const hasWhatsApp = req.query.hasWhatsApp !== undefined ? req.query.hasWhatsApp === 'true' : null;
  const optedOut = req.query.optedOut !== undefined ? req.query.optedOut === 'true' : null;
  const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : undefined;
  const limit = req.query.limit ? Math.max(1, Math.min(200, parseInt(String(req.query.limit), 10))) : undefined;

  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ` AND (ct.person_name LIKE ? OR ct.email LIKE ? OR ct.phone_mobile LIKE ? OR c.name LIKE ? OR ct.job_title LIKE ?)`;
    params.push(search, search, search, search, search);
  }

  if (companyId) {
    whereClause += ` AND ct.company_id = ?`;
    params.push(companyId);
  }

  if (hasEmail !== null) {
    whereClause += hasEmail ? ` AND (ct.email IS NOT NULL AND ct.email != '')` : ` AND (ct.email IS NULL OR ct.email = '')`;
  }

  if (hasWhatsApp !== null) {
    whereClause += hasWhatsApp
      ? ` AND (ct.whatsapp_number IS NOT NULL AND ct.whatsapp_number != '')`
      : ` AND (ct.whatsapp_number IS NULL OR ct.whatsapp_number = '')`;
  }

  if (optedOut !== null) {
    whereClause += ` AND ct.opted_out = ?`;
    params.push(optedOut ? 1 : 0);
  }

  const countQuery = `
    SELECT COUNT(*) as c
    FROM contacts ct
    JOIN companies c ON c.id = ct.company_id
    ${whereClause}
  `;
  const total = (db.prepare(countQuery).get(...params) as { c: number }).c;

  let query = `
    SELECT 
      ct.*,
      c.name as company_name,
      c.website as company_website
    FROM contacts ct
    JOIN companies c ON c.id = ct.company_id
    ${whereClause}
    ORDER BY ct.id ASC
  `;

  const queryParams = [...params];
  if (page && limit) {
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
  }

  const contacts = db.prepare(query).all(...queryParams);
  res.json({
    success: true,
    count: contacts.length,
    total,
    page: page || 1,
    limit: limit || total,
    totalPages: limit ? Math.ceil(total / limit) : 1,
    contacts,
  });
});

// GET /api/contacts/export/csv
router.get('/export/csv', requireAuth, (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const contacts = db.prepare(`
    SELECT 
      c.name as "Company Name",
      c.website as "Website",
      ct.person_name as "Contact Person",
      ct.job_title as "Job Title",
      ct.email as "Email",
      ct.phone_mobile as "Mobile (WhatsApp)",
      ct.phone_landline as "Landline",
      ct.is_valid_email as "Valid Email",
      ct.is_valid_whatsapp as "Valid WhatsApp",
      ct.opted_out as "Opted Out",
      ct.address as "Address"
    FROM contacts ct
    JOIN companies c ON c.id = ct.company_id
    ORDER BY c.id ASC, ct.id ASC
  `).all() as any[];

  if (contacts.length === 0) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send('No contacts found');
    return;
  }

  // Generate CSV content
  const headers = Object.keys(contacts[0]);
  const csvRows: string[] = [headers.join(',')];

  for (const row of contacts) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // UTF-8 BOM for Excel compatibility

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="reachcraft_contacts_export.csv"');
  res.send(csvContent);
});

// GET /api/contacts/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const contact = db.prepare(`
    SELECT ct.*, c.name as company_name, c.website as company_website, c.description as company_description
    FROM contacts ct
    JOIN companies c ON c.id = ct.company_id
    WHERE ct.id = ?
  `).get(req.params.id);

  if (!contact) {
    res.status(404).json({ success: false, error: 'Contact not found' });
    return;
  }

  res.json({ success: true, contact });
});

// PATCH /api/contacts/:id
const updateContactSchema = z.object({
  person_name: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone_mobile: z.string().nullable().optional(),
  phone_landline: z.string().nullable().optional(),
  whatsapp_number: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  is_valid_email: z.number().min(0).max(1).optional(),
  is_valid_whatsapp: z.number().min(0).max(1).optional(),
  opted_out: z.number().min(0).max(1).optional(),
  notes: z.string().nullable().optional(),
});

router.patch('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const parseResult = updateContactSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Invalid input', details: parseResult.error.format() });
    return;
  }

  const db = getDatabase();
  const contactId = req.params.id;
  const updates = parseResult.data;

  // Strict Deduplication Check: Prevent assigning email/phone that belongs to another contact
  if (updates.email || updates.phone_mobile || updates.whatsapp_number) {
    const conflict = db.prepare(`
      SELECT id FROM contacts 
      WHERE id != ? AND (
        (email IS NOT NULL AND email != '' AND LOWER(email) = LOWER(?)) OR
        (phone_mobile IS NOT NULL AND phone_mobile != '' AND phone_mobile = ?) OR
        (whatsapp_number IS NOT NULL AND whatsapp_number != '' AND whatsapp_number = ?)
      )
      LIMIT 1
    `).get(
      contactId,
      updates.email || '',
      updates.phone_mobile || '',
      updates.whatsapp_number || ''
    );

    if (conflict) {
      res.status(409).json({
        success: false,
        error: 'يوجد جهة اتصال أخرى مسجلة مسبقاً بنفس البريد الإلكتروني أو رقم الهاتف أو الواتساب. يُمنع التكرار.',
      });
      return;
    }
  }

  const fields: string[] = [];
  const params: any[] = [];

  const existing = db.prepare('SELECT person_name, email, phone_mobile FROM contacts WHERE id = ?').get(contactId) as any;

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
  params.push(contactId);

  db.prepare(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  logActivity({
    category: 'contact',
    action: 'update',
    title: `تعديل بيانات جهة الاتصال: ${existing?.person_name || existing?.email || `#${contactId}`}`,
    details: updates,
  });

  res.json({ success: true, message: 'Contact updated successfully' });
});

// DELETE /api/contacts/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const existing = db.prepare('SELECT person_name, email, phone_mobile FROM contacts WHERE id = ?').get(req.params.id) as any;
  db.prepare(`DELETE FROM contacts WHERE id = ?`).run(req.params.id);

  logActivity({
    category: 'contact',
    action: 'delete',
    title: `حذف جهة اتصال: ${existing?.person_name || existing?.email || `#${req.params.id}`}`,
    details: existing || null,
    status: 'warning',
  });

  res.json({ success: true, message: 'Contact deleted successfully' });
});

export default router;
