import { Router, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import { requireSuperAdmin, AuthRequest } from '../middlewares/auth.middleware.js';
import { logActivity } from '../services/activityLogger.js';

const router = Router();

// Protect all admin routes with Super Admin requirement
router.use(requireSuperAdmin);

// 1. GET /api/admin/stats - Overview KPIs
router.get('/stats', (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0;
  const activeUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get() as any)?.count || 0;
  const verifiedUsers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE is_verified = 1').get() as any)?.count || 0;
  const onboardedUsers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE onboarding_completed = 1').get() as any)?.count || 0;

  const totalCompanies = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as any)?.count || 0;
  const totalContacts = (db.prepare('SELECT COUNT(*) as count FROM contacts').get() as any)?.count || 0;
  const totalCampaigns = (db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as any)?.count || 0;
  const totalFiles = (db.prepare('SELECT COUNT(*) as count FROM uploaded_files').get() as any)?.count || 0;

  const totalEmailsSent = (db.prepare("SELECT COUNT(*) as count FROM message_log WHERE status = 'sent'").get() as any)?.count || 0;
  const emailsSentToday = (db.prepare("SELECT COUNT(*) as count FROM message_log WHERE status = 'sent' AND date(created_at) = date('now')").get() as any)?.count || 0;

  const planBreakdown = db.prepare(`
    SELECT plan, COUNT(*) as count 
    FROM users 
    GROUP BY plan
  `).all();

  res.json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      verifiedUsers,
      onboardedUsers,
      totalCompanies,
      totalContacts,
      totalCampaigns,
      totalFiles,
      totalEmailsSent,
      emailsSentToday,
      planBreakdown,
    },
  });
});

// 2. GET /api/admin/users - List users with metrics
router.get('/users', (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;

  let query = `
    SELECT 
      u.id, u.email, u.name, u.role, u.auth_provider, u.plan, 
      u.is_verified, u.onboarding_completed, u.status, u.created_at,
      (SELECT COUNT(*) FROM companies WHERE user_id = u.id) as companies_count,
      (SELECT COUNT(*) FROM contacts WHERE user_id = u.id) as contacts_count,
      (SELECT COUNT(*) FROM campaigns WHERE user_id = u.id) as campaigns_count,
      (SELECT COUNT(*) FROM message_log WHERE user_id = u.id AND status = 'sent' AND date(created_at) = date('now')) as emails_sent_today
    FROM users u
  `;

  const params: any[] = [];
  if (search) {
    query += ' WHERE u.email LIKE ? OR u.name LIKE ? ';
    params.push(search, search);
  }

  query += ' ORDER BY u.id DESC';

  const users = db.prepare(query).all(...params);

  res.json({
    success: true,
    users,
  });
});

// 3. PATCH /api/admin/users/:id/plan - Change plan
const updatePlanSchema = z.object({
  plan: z.enum(['beta_free', 'pro', 'unlimited']),
});

router.patch('/users/:id/plan', (req: AuthRequest, res: Response): void => {
  const userId = Number(req.params.id);
  const parseResult = updatePlanSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Invalid plan' });
    return;
  }

  const db = getDatabase();
  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(parseResult.data.plan, userId);

  logActivity({
    category: 'admin',
    action: 'change_plan',
    title: `تعديل باقة المستخدم #${userId} إلى: ${parseResult.data.plan}`,
    ip: req.ip,
  });

  res.json({ success: true, message: 'Plan updated successfully' });
});

// 4. PATCH /api/admin/users/:id/status - Toggle active/suspended
const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

router.patch('/users/:id/status', (req: AuthRequest, res: Response): void => {
  const userId = Number(req.params.id);
  const parseResult = updateStatusSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Invalid status' });
    return;
  }

  // Prevent suspending self
  if (userId === req.user!.id) {
    res.status(400).json({ success: false, error: 'Cannot suspend your own account' });
    return;
  }

  const db = getDatabase();
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(parseResult.data.status, userId);

  logActivity({
    category: 'admin',
    action: 'change_status',
    title: `تغيير حالة المستخدم #${userId} إلى: ${parseResult.data.status}`,
    ip: req.ip,
  });

  res.json({ success: true, message: `User status changed to ${parseResult.data.status}` });
});

// 5. DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', (req: AuthRequest, res: Response): void => {
  const userId = Number(req.params.id);

  if (userId === req.user!.id) {
    res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    return;
  }

  const db = getDatabase();
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);

  logActivity({
    category: 'admin',
    action: 'delete_user',
    title: `حذف المستخدم #${userId} نهائياً مع كافة بياناته`,
    ip: req.ip,
  });

  res.json({ success: true, message: 'User deleted successfully' });
});

// ==========================================
// 6. PLANS MANAGEMENT (CRUD)
// ==========================================

// GET /api/admin/plans - List all plans with user count
router.get('/plans', (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const plans = db.prepare(`
    SELECT 
      p.*,
      (SELECT COUNT(*) FROM users WHERE plan = p.id) as users_count
    FROM plans p
    ORDER BY p.daily_email_limit ASC
  `).all();

  res.json({ success: true, plans });
});

// POST /api/admin/plans - Create new plan
const planSchema = z.object({
  id: z.string().min(2).max(30).regex(/^[a-z0-9_]+$/, 'ID must be lowercase alphanumeric and underscores only'),
  name_ar: z.string().min(2, 'الاسم بالعربية مطلوب'),
  name_en: z.string().min(2, 'English name is required'),
  daily_email_limit: z.number().int().min(1),
  monthly_upload_limit: z.number().int().min(1),
  max_contacts: z.number().int().min(1),
  can_export_csv: z.boolean().default(true),
  can_use_ai: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

router.post('/plans', (req: AuthRequest, res: Response): void => {
  const parseResult = planSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'بيانات الباقة غير صحيحة', details: parseResult.error.format() });
    return;
  }

  const p = parseResult.data;
  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(p.id);
  if (existing) {
    res.status(400).json({ success: false, error: 'معرّف الباقة موجود مسبقاً' });
    return;
  }

  db.prepare(`
    INSERT INTO plans (id, name_ar, name_en, daily_email_limit, monthly_upload_limit, max_contacts, can_export_csv, can_use_ai, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    p.id,
    p.name_ar,
    p.name_en,
    p.daily_email_limit,
    p.monthly_upload_limit,
    p.max_contacts,
    p.can_export_csv ? 1 : 0,
    p.can_use_ai ? 1 : 0,
    p.is_active ? 1 : 0
  );

  logActivity({
    category: 'admin',
    action: 'create_plan',
    title: `إنشاء باقة جديدة: "${p.name_ar}" (${p.id})`,
    details: p,
    userId: req.user!.id,
  });

  res.status(201).json({ success: true, message: 'تم إنشاء الباقة بنجاح' });
});

// PATCH /api/admin/plans/:id - Update plan
const updatePlanDetailsSchema = planSchema.partial().omit({ id: true });

router.patch('/plans/:id', (req: AuthRequest, res: Response): void => {
  const planId = req.params.id;
  const parseResult = updatePlanDetailsSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'بيانات غير صحيحة', details: parseResult.error.format() });
    return;
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(planId);
  if (!existing) {
    res.status(404).json({ success: false, error: 'الباقة غير موجودة' });
    return;
  }

  const updates = parseResult.data;
  const fields: string[] = [];
  const params: any[] = [];

  if (updates.name_ar !== undefined) { fields.push('name_ar = ?'); params.push(updates.name_ar); }
  if (updates.name_en !== undefined) { fields.push('name_en = ?'); params.push(updates.name_en); }
  if (updates.daily_email_limit !== undefined) { fields.push('daily_email_limit = ?'); params.push(updates.daily_email_limit); }
  if (updates.monthly_upload_limit !== undefined) { fields.push('monthly_upload_limit = ?'); params.push(updates.monthly_upload_limit); }
  if (updates.max_contacts !== undefined) { fields.push('max_contacts = ?'); params.push(updates.max_contacts); }
  if (updates.can_export_csv !== undefined) { fields.push('can_export_csv = ?'); params.push(updates.can_export_csv ? 1 : 0); }
  if (updates.can_use_ai !== undefined) { fields.push('can_use_ai = ?'); params.push(updates.can_use_ai ? 1 : 0); }
  if (updates.is_active !== undefined) { fields.push('is_active = ?'); params.push(updates.is_active ? 1 : 0); }

  if (fields.length > 0) {
    params.push(planId);
    db.prepare(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  logActivity({
    category: 'admin',
    action: 'update_plan',
    title: `تعديل إعدادات الباقة: "${planId}"`,
    details: updates,
    userId: req.user!.id,
  });

  res.json({ success: true, message: 'تم تحديث بيانات الباقة بنجاح' });
});

// DELETE /api/admin/plans/:id - Delete plan
router.delete('/plans/:id', (req: AuthRequest, res: Response): void => {
  const planId = req.params.id;
  if (['beta_free', 'unlimited'].includes(planId)) {
    res.status(400).json({ success: false, error: 'لا يمكن حذف الباقات الافتراضية للنظام' });
    return;
  }

  const db = getDatabase();
  const usersOnPlan = db.prepare('SELECT COUNT(*) as count FROM users WHERE plan = ?').get(planId) as { count: number };
  if (usersOnPlan && usersOnPlan.count > 0) {
    // Reassign them to beta_free before deleting
    db.prepare("UPDATE users SET plan = 'beta_free' WHERE plan = ?").run(planId);
  }

  db.prepare('DELETE FROM plans WHERE id = ?').run(planId);

  logActivity({
    category: 'admin',
    action: 'delete_plan',
    title: `حذف الباقة: "${planId}" وتحويل مستخدميها للباقة الافتراضية`,
    userId: req.user!.id,
  });

  res.json({ success: true, message: 'تم حذف الباقة بنجاح' });
});

// ==========================================
// 7. DEFAULT TEMPLATES MANAGEMENT
// ==========================================

// GET /api/admin/templates - List default templates
router.get('/templates', (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const templates = db.prepare('SELECT * FROM templates WHERE is_default = 1 ORDER BY id DESC').all();
  res.json({ success: true, templates });
});

// POST /api/admin/templates - Create system default template
const adminTemplateSchema = z.object({
  name: z.string().min(1, 'اسم القالب مطلوب'),
  channel: z.enum(['email', 'whatsapp']),
  subject: z.string().nullable().optional(),
  body: z.string().min(1, 'محتوى القالب مطلوب'),
});

router.post('/templates', (req: AuthRequest, res: Response): void => {
  const parseResult = adminTemplateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'بيانات القالب غير صحيحة', details: parseResult.error.format() });
    return;
  }

  const { name, channel, subject, body } = parseResult.data;
  const db = getDatabase();

  const result = db.prepare(`
    INSERT INTO templates (name, channel, subject, body, is_default, user_id)
    VALUES (?, ?, ?, ?, 1, ?)
  `).run(name, channel, subject || null, body, req.user!.id);

  logActivity({
    category: 'admin',
    action: 'create_default_template',
    title: `إضافة قالب افتراضي عام للمنصة: "${name}" (${channel})`,
    details: { templateId: Number(result.lastInsertRowid), name, channel },
    userId: req.user!.id,
  });

  res.status(201).json({ success: true, message: 'تمت إضافة القالب الافتراضي بنجاح', templateId: Number(result.lastInsertRowid) });
});

// PATCH /api/admin/templates/:id - Update default template
router.patch('/templates/:id', (req: AuthRequest, res: Response): void => {
  const parseResult = adminTemplateSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'بيانات غير صحيحة' });
    return;
  }

  const db = getDatabase();
  const tmpl = db.prepare('SELECT id, name FROM templates WHERE id = ?').get(req.params.id) as any;
  if (!tmpl) {
    res.status(404).json({ success: false, error: 'القالب غير موجود' });
    return;
  }

  const updates = parseResult.data;
  const fields: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
  if (updates.channel !== undefined) { fields.push('channel = ?'); params.push(updates.channel); }
  if (updates.subject !== undefined) { fields.push('subject = ?'); params.push(updates.subject); }
  if (updates.body !== undefined) { fields.push('body = ?'); params.push(updates.body); }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    params.push(req.params.id);
    db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  logActivity({
    category: 'admin',
    action: 'update_default_template',
    title: `تعديل القالب الافتراضي: "${updates.name || tmpl.name}"`,
    details: updates,
    userId: req.user!.id,
  });

  res.json({ success: true, message: 'تم تحديث القالب الافتراضي بنجاح' });
});

// DELETE /api/admin/templates/:id - Delete default template
router.delete('/templates/:id', (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const tmpl = db.prepare('SELECT name FROM templates WHERE id = ?').get(req.params.id) as any;
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);

  logActivity({
    category: 'admin',
    action: 'delete_default_template',
    title: `حذف القالب الافتراضي: "${tmpl?.name || `#${req.params.id}`}"`,
    userId: req.user!.id,
  });

  res.json({ success: true, message: 'تم حذف القالب الافتراضي بنجاح' });
});

// ==========================================
// 8. VERIFIED CONTACTS POOL MANAGEMENT
// ==========================================

// GET /api/admin/verified-contacts - List verified contacts pool
router.get('/verified-contacts', (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;

  let query = `
    SELECT 
      ct.id, ct.person_name, ct.job_title, ct.email, ct.phone_mobile, ct.whatsapp_number,
      ct.address, ct.is_valid_email, ct.is_valid_whatsapp, ct.created_at, ct.is_verified_pool,
      c.name as company_name, c.website as company_website, c.description as company_description
    FROM contacts ct
    LEFT JOIN companies c ON c.id = ct.company_id
    WHERE ct.is_verified_pool = 1
  `;

  const params: any[] = [];
  if (search) {
    query += ' AND (ct.person_name LIKE ? OR ct.email LIKE ? OR c.name LIKE ? OR ct.job_title LIKE ?)';
    params.push(search, search, search, search);
  }

  query += ' ORDER BY ct.id DESC';

  const contacts = db.prepare(query).all(...params);
  res.json({ success: true, contacts });
});

// POST /api/admin/verified-contacts - Add lead to verified pool
const verifiedContactSchema = z.object({
  person_name: z.string().optional().default(''),
  job_title: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  phone_mobile: z.string().optional().default(''),
  whatsapp_number: z.string().optional().default(''),
  company_name: z.string().min(1, 'اسم الشركة مطلوب'),
  company_website: z.string().optional().default(''),
  company_description: z.string().optional().default(''),
});

router.post('/verified-contacts', (req: AuthRequest, res: Response): void => {
  const parseResult = verifiedContactSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'بيانات غير صحيحة', details: parseResult.error.format() });
    return;
  }

  const data = parseResult.data;
  const db = getDatabase();

  db.exec('BEGIN TRANSACTION;');
  try {
    // Find or create company
    let companyId: number;
    const existingCompany = db.prepare('SELECT id FROM companies WHERE name = ?').get(data.company_name) as { id: number } | undefined;
    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const compRes = db.prepare(`
        INSERT INTO companies (name, website, description, has_direct_contact, user_id)
        VALUES (?, ?, ?, 1, ?)
      `).run(data.company_name, data.company_website || null, data.company_description || null, req.user!.id);
      companyId = Number(compRes.lastInsertRowid);
    }

    const contactRes = db.prepare(`
      INSERT INTO contacts (
        company_id, person_name, job_title, email, phone_mobile, 
        whatsapp_number, is_valid_email, is_valid_whatsapp, is_verified_pool, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      companyId,
      data.person_name || null,
      data.job_title || null,
      data.email || null,
      data.phone_mobile || null,
      data.whatsapp_number || null,
      data.email ? 1 : 0,
      data.whatsapp_number ? 1 : 0,
      req.user!.id
    );

    db.exec('COMMIT;');

    logActivity({
      category: 'admin',
      action: 'add_verified_contact',
      title: `إضافة جهة اتصال موثقة جديدة للمنصة: "${data.person_name || data.company_name}"`,
      details: { contactId: Number(contactRes.lastInsertRowid), ...data },
      userId: req.user!.id,
    });

    res.status(201).json({ success: true, message: 'تمت إضافة جهة الاتصال إلى قاعدة البيانات الموثقة بنجاح' });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/verified-contacts/:id - Remove from verified pool
router.delete('/verified-contacts/:id', (req: AuthRequest, res: Response): void => {
  const contactId = Number(req.params.id);
  const db = getDatabase();

  db.prepare('UPDATE contacts SET is_verified_pool = 0 WHERE id = ?').run(contactId);

  logActivity({
    category: 'admin',
    action: 'remove_verified_contact',
    title: `إزالة جهة الاتصال #${contactId} من قاعدة المعارض الموثقة`,
    userId: req.user!.id,
  });

  res.json({ success: true, message: 'تمت إزالة جهة الاتصال من القائمة الموثقة' });
});

// ==========================================
// 9. GLOBAL AUDIT LOGS
// ==========================================

// GET /api/admin/logs - Global Activity Log
router.get('/logs', (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const category = req.query.category as string | undefined;
  const action = req.query.action as string | undefined;
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 30), 200);
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (category && category !== 'all') {
    whereClause += ' AND a.category = ?';
    params.push(category);
  }

  if (action && action !== 'all') {
    whereClause += ' AND a.action = ?';
    params.push(action);
  }

  if (search) {
    whereClause += ' AND (a.title LIKE ? OR u.email LIKE ? OR u.name LIKE ?)';
    params.push(search, search, search);
  }

  const countRow = db.prepare(`
    SELECT COUNT(*) as count 
    FROM activity_log a
    LEFT JOIN users u ON u.id = a.user_id
    ${whereClause}
  `).get(...params) as { count: number };

  const total = countRow.count;
  const totalPages = Math.ceil(total / limit) || 1;

  const logs = db.prepare(`
    SELECT 
      a.*,
      u.email as user_email,
      u.name as user_name
    FROM activity_log a
    LEFT JOIN users u ON u.id = a.user_id
    ${whereClause}
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    success: true,
    logs,
    total,
    page,
    limit,
    totalPages,
  });
});

export default router;
