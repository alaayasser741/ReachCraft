import { Router, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { logActivity } from '../services/activityLogger.js';

const router = Router();

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  channel: z.enum(['email', 'whatsapp']),
  subject: z.string().nullable().optional(),
  body: z.string().min(1, 'Body is required'),
});

// GET /api/templates
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const channel = req.query.channel as string | undefined;

  let query = 'SELECT * FROM templates WHERE (user_id = ? OR is_default = 1)';
  const params: any[] = [userId];

  if (channel && (channel === 'email' || channel === 'whatsapp')) {
    query += ' AND channel = ?';
    params.push(channel);
  }

  query += ' ORDER BY is_default DESC, id DESC';

  const templates = db.prepare(query).all(...params);
  res.json({ success: true, templates });
});

// POST /api/templates/:id/set-default
router.post('/:id/set-default', requireAuth, (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'فقط المسؤول (Super Admin) يملك صلاحية تعيين قوالب افتراضية للمنصة.' });
    return;
  }

  const db = getDatabase();
  const template = db.prepare('SELECT id, channel FROM templates WHERE id = ?').get(req.params.id) as
    | { id: number; channel: string }
    | undefined;

  if (!template) {
    res.status(404).json({ success: false, error: 'Template not found' });
    return;
  }

  db.prepare('UPDATE templates SET is_default = 0 WHERE channel = ?').run(template.channel);
  db.prepare('UPDATE templates SET is_default = 1 WHERE id = ?').run(template.id);

  logActivity({
    category: 'template',
    action: 'update',
    title: `تعيين قالب كافتراضي لقناة (${template.channel})`,
    details: { templateId: template.id, channel: template.channel },
    userId: req.user!.id,
  });

  res.json({ success: true, message: 'Template set as default successfully' });
});

// GET /api/templates/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const template = db.prepare(`
    SELECT * FROM templates
    WHERE id = ? AND (user_id = ? OR is_default = 1 OR ? = 1)
  `).get(req.params.id, userId, isSuperAdmin ? 1 : 0);

  if (!template) {
    res.status(404).json({ success: false, error: 'القالب غير موجود أو ليس لديك صلاحية للوصول إليه' });
    return;
  }

  res.json({ success: true, template });
});

// POST /api/templates
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const parseResult = templateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parseResult.error.format() });
    return;
  }

  const { name, channel, subject, body } = parseResult.data;

  if (channel === 'whatsapp') {
    res.status(400).json({
      success: false,
      error: 'إنشاء قوالب الواتساب معطل حالياً (الميزة قادمة قريباً).',
    });
    return;
  }

  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';
  const isDefault = isSuperAdmin && (req.body.is_default === 1 || req.body.is_default === true) ? 1 : 0;

  const result = db.prepare(`
    INSERT INTO templates (name, channel, subject, body, user_id, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, channel, subject || null, body, userId, isDefault);

  const templateId = Number(result.lastInsertRowid);

  logActivity({
    category: 'template',
    action: 'create',
    title: `إنشاء قالب جديد: "${name}" (${channel})`,
    details: { templateId, name, channel, subject, isDefault },
    userId,
  });

  res.status(201).json({
    success: true,
    templateId,
    message: 'Template created successfully',
  });
});

// PATCH /api/templates/:id
router.patch('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const parseResult = templateSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parseResult.error.format() });
    return;
  }

  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const tmpl = db.prepare('SELECT id, name, channel, user_id, is_default FROM templates WHERE id = ?').get(req.params.id) as any;
  if (!tmpl) {
    res.status(404).json({ success: false, error: 'القالب غير موجود' });
    return;
  }

  if (tmpl.user_id !== userId && !isSuperAdmin) {
    res.status(403).json({ success: false, error: 'لا يمكنك تعديل هذا القالب لأنه قالب افتراضي للنظام أو لا يخص حسابك' });
    return;
  }

  const updates = parseResult.data;

  if (updates.channel === 'whatsapp') {
    res.status(400).json({
      success: false,
      error: 'تعديل القالب إلى قناة الواتساب معطل حالياً (الميزة قادمة قريباً).',
    });
    return;
  }
  const fields: string[] = [];
  const params: any[] = [];

  Object.entries(updates).forEach(([key, val]) => {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      params.push(val);
    }
  });

  if (isSuperAdmin && typeof req.body.is_default !== 'undefined') {
    fields.push('is_default = ?');
    params.push(req.body.is_default ? 1 : 0);
  }

  if (fields.length === 0) {
    res.json({ success: true, message: 'No fields to update' });
    return;
  }

  fields.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  logActivity({
    category: 'template',
    action: 'update',
    title: `تعديل القالب: "${updates.name || tmpl?.name || `#${req.params.id}`}"`,
    details: updates,
    userId,
  });

  res.json({ success: true, message: 'Template updated successfully' });
});

// DELETE /api/templates/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const tmpl = db.prepare('SELECT id, name, channel, user_id, is_default FROM templates WHERE id = ?').get(req.params.id) as any;
  if (!tmpl) {
    res.status(404).json({ success: false, error: 'القالب غير موجود' });
    return;
  }

  if (tmpl.user_id !== userId && !isSuperAdmin) {
    res.status(403).json({ success: false, error: 'لا تملك صلاحية حذف هذا القالب لأنه قالب افتراضي للنظام' });
    return;
  }

  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);

  logActivity({
    category: 'template',
    action: 'delete',
    title: `حذف قالب: "${tmpl?.name || `#${req.params.id}`}"`,
    details: tmpl || null,
    status: 'warning',
    userId,
  });

  res.json({ success: true, message: 'Template deleted successfully' });
});

// POST /api/templates/preview - Helper to render variables
export function renderTemplate(
  text: string,
  variables: {
    company_name?: string | null;
    person_name?: string | null;
    job_title?: string | null;
    website?: string | null;
    unsubscribe_url?: string | null;
  }
): string {
  let rendered = text;
  rendered = rendered.replace(/\{\{\s*company_name\s*\}\}/gi, variables.company_name || 'your company');
  rendered = rendered.replace(/\{\{\s*person_name\s*\}\}/gi, variables.person_name || 'there');
  rendered = rendered.replace(/\{\{\s*job_title\s*\}\}/gi, variables.job_title || 'Leader');
  rendered = rendered.replace(/\{\{\s*website\s*\}\}/gi, variables.website || '');
  if (variables.unsubscribe_url) {
    rendered = rendered.replace(/\{\{\s*unsubscribe_url\s*\}\}/gi, variables.unsubscribe_url);
  }
  return rendered;
}

router.post('/preview', requireAuth, (req: AuthRequest, res: Response): void => {
  const { subject, body, variables } = req.body;
  const sampleVariables = {
    company_name: variables?.company_name || 'Acme Tech Solutions',
    person_name: variables?.person_name || 'Sarah Connor',
    job_title: variables?.job_title || 'Chief Technology Officer',
    website: variables?.website || 'https://acme.tech',
    unsubscribe_url: 'http://localhost:5000/unsubscribe/sample-preview-token',
  };

  const renderedSubject = subject ? renderTemplate(subject, sampleVariables) : null;
  const renderedBody = body ? renderTemplate(body, sampleVariables) : '';

  res.json({
    success: true,
    renderedSubject,
    renderedBody,
  });
});

export default router;
