import { Router, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';

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
  const channel = req.query.channel as string | undefined;

  let query = 'SELECT * FROM templates';
  const params: any[] = [];

  if (channel && (channel === 'email' || channel === 'whatsapp')) {
    query += ' WHERE channel = ?';
    params.push(channel);
  }

  query += ' ORDER BY is_default DESC, id DESC';

  const templates = db.prepare(query).all(...params);
  res.json({ success: true, templates });
});

// POST /api/templates/:id/set-default
router.post('/:id/set-default', requireAuth, (req: AuthRequest, res: Response): void => {
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

  res.json({ success: true, message: 'Template set as default successfully' });
});

// GET /api/templates/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);

  if (!template) {
    res.status(404).json({ success: false, error: 'Template not found' });
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
  const db = getDatabase();

  const result = db.prepare(`
    INSERT INTO templates (name, channel, subject, body)
    VALUES (?, ?, ?, ?)
  `).run(name, channel, subject || null, body);

  res.status(201).json({
    success: true,
    templateId: Number(result.lastInsertRowid),
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
    res.json({ success: true, message: 'No fields to update' });
    return;
  }

  fields.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true, message: 'Template updated successfully' });
});

// DELETE /api/templates/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
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
