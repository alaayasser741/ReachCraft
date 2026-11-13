import { Router, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { imapReaderService } from '../services/email/imapReader.service.js';
import { geminiService } from '../services/ai/gemini.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/inbox
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const { category, search, limit = '50', offset = '0' } = req.query;

  const numLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));
  const numOffset = Math.max(0, parseInt(String(offset), 10) || 0);

  // Compute category counters
  const countRows = db.prepare(`
    SELECT 
      COUNT(*) as total_all,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as total_unread,
      SUM(CASE WHEN ai_category = 'hr_interview' THEN 1 ELSE 0 END) as total_hr,
      SUM(CASE WHEN ai_category = 'company_update' THEN 1 ELSE 0 END) as total_company,
      SUM(CASE WHEN ai_category = 'direct_reply' THEN 1 ELSE 0 END) as total_reply
    FROM inbox_messages
  `).get() as any;

  const counts = {
    all: countRows?.total_all || 0,
    unread: countRows?.total_unread || 0,
    hr_interview: countRows?.total_hr || 0,
    company_update: countRows?.total_company || 0,
    direct_reply: countRows?.total_reply || 0,
  };

  // Build filter query
  let whereClauses: string[] = [];
  let params: any[] = [];

  if (category && category !== 'all') {
    if (category === 'unread') {
      whereClauses.push('is_read = 0');
    } else {
      whereClauses.push('ai_category = ?');
      params.push(category);
    }
  }

  if (search && String(search).trim() !== '') {
    const q = `%${String(search).trim()}%`;
    whereClauses.push('(subject LIKE ? OR from_name LIKE ? OR from_email LIKE ? OR snippet LIKE ? OR ai_summary LIKE ?)');
    params.push(q, q, q, q, q);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const querySql = `
    SELECT 
      id, message_uid, from_name, from_email, subject, snippet,
      date, is_read, ai_category, ai_summary, ai_priority,
      created_at
    FROM inbox_messages
    ${whereSql}
    ORDER BY datetime(date) DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  params.push(numLimit, numOffset);
  const messages = db.prepare(querySql).all(...params);

  res.json({
    success: true,
    messages,
    counts,
    pagination: { limit: numLimit, offset: numOffset },
  });
});

// POST /api/inbox/sync
router.post('/sync', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await imapReaderService.syncInbox(30);
    res.json({
      success: true,
      message: `تم مزامنة البريد بنجاح! تم استيراد ${result.newEmailsCount} إيميل جديد وفلترتها بالذكاء الاصطناعي.`,
      result,
    });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to sync IMAP inbox');
    res.status(500).json({
      success: false,
      error: err.message || 'فشل الاتصال بـ Gmail IMAP. يرجى مراجعة إعدادات البريد.',
    });
  }
});

// GET /api/inbox/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const id = parseInt(req.params.id, 10);

  const message = db.prepare('SELECT * FROM inbox_messages WHERE id = ?').get(id) as any;
  if (!message) {
    res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
    return;
  }

  // Mark as read automatically when opened
  if (!message.is_read) {
    db.prepare('UPDATE inbox_messages SET is_read = 1 WHERE id = ?').run(id);
    message.is_read = 1;
  }

  res.json({ success: true, message });
});

// PATCH /api/inbox/:id/read
router.patch('/:id/read', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const id = parseInt(req.params.id, 10);
  const isRead = req.body.isRead ? 1 : 0;

  db.prepare('UPDATE inbox_messages SET is_read = ? WHERE id = ?').run(isRead, id);
  res.json({ success: true, isRead: Boolean(isRead) });
});

// POST /api/inbox/:id/draft-reply
const draftReplySchema = z.object({
  userInstructions: z.string().optional(),
});

router.post('/:id/draft-reply', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = draftReplySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed' });
    return;
  }

  const db = getDatabase();
  const id = parseInt(req.params.id, 10);
  const message = db.prepare('SELECT * FROM inbox_messages WHERE id = ?').get(id) as any;

  if (!message) {
    res.status(404).json({ success: false, error: 'Email message not found' });
    return;
  }

  try {
    const result = await geminiService.generateCustomReply({
      from: `${message.from_name} <${message.from_email}>`,
      subject: message.subject,
      originalBody: message.body_text || message.snippet || message.subject,
      userInstructions: parseResult.data.userInstructions,
    });

    res.json({ success: true, draftReply: result.replyBody });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate AI reply' });
  }
});

// POST /api/inbox/:id/send-reply
const sendReplySchema = z.object({
  replyText: z.string().min(1, 'نص الرد مطلوب'),
});

router.post('/:id/send-reply', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = sendReplySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed' });
    return;
  }

  const db = getDatabase();
  const id = parseInt(req.params.id, 10);
  const message = db.prepare('SELECT * FROM inbox_messages WHERE id = ?').get(id) as any;

  if (!message) {
    res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
    return;
  }

  const result = await imapReaderService.sendReply({
    inboxMessageId: id,
    recipientEmail: message.from_email,
    subject: message.subject,
    replyText: parseResult.data.replyText,
  });

  if (result.success) {
    res.json({ success: true, message: 'تم إرسال الرد بنجاح!' });
  } else {
    res.status(500).json({ success: false, error: result.error || 'فشل إرسال الرد' });
  }
});

// POST /api/inbox/:id/translate
router.post('/:id/translate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDatabase();
  const id = parseInt(req.params.id, 10);
  const message = db.prepare('SELECT * FROM inbox_messages WHERE id = ?').get(id) as any;

  if (!message) {
    res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
    return;
  }

  const { targetLang } = req.body || {};
  try {
    const result = await geminiService.translateEmail({
      subject: message.subject,
      body: message.body_html || message.body_text || message.snippet || '',
      targetLang: targetLang === 'en' ? 'en' : 'ar',
    });

    res.json({
      success: true,
      translatedSubject: result.translatedSubject,
      translatedBody: result.translatedBody,
      targetLang: result.targetLang,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'فشل ترجمة الرسالة' });
  }
});

// DELETE /api/inbox/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const id = parseInt(req.params.id, 10);

  const info = db.prepare('DELETE FROM inbox_messages WHERE id = ?').run(id);
  if (info.changes > 0) {
    res.json({ success: true, message: 'تم حذف الرسالة بنجاح' });
  } else {
    res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
  }
});

export default router;
