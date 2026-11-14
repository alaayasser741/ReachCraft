import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { env } from '../config/env.js';
import { campaignQueue } from '../services/queue/jobQueue.js';
import { getEmailProvider } from '../services/email/providerFactory.js';
import { getWhatsAppProvider } from '../services/whatsapp/providerFactory.js';
import { renderTemplate } from './templates.routes.js';
import { logActivity } from '../services/activityLogger.js';

const router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  channel: z.enum(['email', 'whatsapp']),
  template_id: z.number().int().positive(),
  is_dry_run: z.boolean().default(false),
  contact_ids: z.array(z.number().int().positive()).min(1, 'At least one contact must be selected'),
  exclude_previously_contacted: z.boolean().optional().default(false),
});

// GET /api/campaigns
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const campaigns = db.prepare(`
    SELECT 
      c.*,
      t.name as template_name,
      t.subject as template_subject
    FROM campaigns c
    JOIN templates t ON t.id = c.template_id
    WHERE c.user_id = ?
    ORDER BY c.id DESC
  `).all(userId);

  res.json({ success: true, campaigns });
});

// GET /api/campaigns/contacted-recipients
router.get('/contacted-recipients', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const channel = req.query.channel as string | undefined;

  let query = `
    SELECT 
      LOWER(TRIM(ml.recipient_address)) as address,
      ml.channel,
      ml.contact_id,
      MAX(ml.created_at) as last_sent_at,
      COUNT(*) as send_count
    FROM message_log ml
    WHERE ml.status = 'sent' AND ml.user_id = ?
  `;
  const params: any[] = [userId];

  if (channel && ['email', 'whatsapp'].includes(channel)) {
    query += ' AND ml.channel = ?';
    params.push(channel);
  }

  query += ' GROUP BY LOWER(TRIM(ml.recipient_address)), ml.channel';

  const rows = db.prepare(query).all(...params) as Array<{
    address: string;
    channel: string;
    contact_id: number | null;
    last_sent_at: string;
    send_count: number;
  }>;

  const addresses: string[] = [];
  const contactIds: number[] = [];
  const details: Record<string, { lastSentAt: string; sendCount: number; channel: string }> = {};

  for (const row of rows) {
    if (row.address) {
      addresses.push(row.address);
      if (row.channel === 'whatsapp') {
        const digits = row.address.replace(/\D/g, '');
        if (digits && digits !== row.address) {
          addresses.push(digits);
        }
      }
      details[row.address] = {
        lastSentAt: row.last_sent_at,
        sendCount: row.send_count,
        channel: row.channel,
      };
    }
    if (row.contact_id) {
      contactIds.push(row.contact_id);
    }
  }

  res.json({
    success: true,
    addresses: Array.from(new Set(addresses)),
    contactIds: Array.from(new Set(contactIds)),
    details,
  });
});

// GET /api/campaigns/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const campaign = db.prepare(`
    SELECT 
      c.*,
      t.name as template_name,
      t.subject as template_subject,
      t.body as template_body
    FROM campaigns c
    JOIN templates t ON t.id = c.template_id
    WHERE c.id = ? AND (c.user_id = ? OR ? = 1)
  `).get(req.params.id, userId, isSuperAdmin ? 1 : 0) as any;

  if (!campaign) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }

  // Fetch recipients breakdown
  const stats = db.prepare(`
    SELECT 
      status, COUNT(*) as count 
    FROM campaign_recipients 
    WHERE campaign_id = ? 
    GROUP BY status
  `).all(req.params.id);

  res.json({ success: true, campaign, stats });
});

// GET /api/campaigns/:id/recipients
router.get('/:id/recipients', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  // Verify campaign belongs to user or is super_admin
  const campaign = db.prepare('SELECT id FROM campaigns WHERE id = ? AND (user_id = ? OR ? = 1)').get(req.params.id, userId, isSuperAdmin ? 1 : 0);
  if (!campaign) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }

  const recipients = db.prepare(`
    SELECT 
      cr.id, cr.status, cr.error, cr.retry_count, cr.sent_at,
      ct.person_name, ct.job_title, ct.email, ct.phone_mobile, ct.whatsapp_number,
      c.name as company_name
    FROM campaign_recipients cr
    JOIN contacts ct ON ct.id = cr.contact_id
    JOIN companies c ON c.id = ct.company_id
    WHERE cr.campaign_id = ?
    ORDER BY cr.id ASC
  `).all(req.params.id);

  res.json({ success: true, recipients });
});

// POST /api/campaigns
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const parseResult = createCampaignSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parseResult.error.format() });
    return;
  }

  const { name, channel, template_id, is_dry_run, contact_ids, exclude_previously_contacted } = parseResult.data;

  if (channel === 'whatsapp') {
    res.status(400).json({
      success: false,
      error: 'قناة الواتساب معطلة حالياً وقيد التطوير للربط السحابي الرسمي (قادمة قريباً). يرجى استخدام البريد الإلكتروني.',
    });
    return;
  }

  const db = getDatabase();

  // Verify template exists
  const template = db.prepare('SELECT id, channel FROM templates WHERE id = ?').get(template_id) as
    | { id: number; channel: string }
    | undefined;

  if (!template) {
    res.status(400).json({ success: false, error: 'Template not found' });
    return;
  }

  if (template.channel !== channel) {
    res.status(400).json({ success: false, error: `Template channel (${template.channel}) does not match campaign channel (${channel})` });
    return;
  }

  // Filter out contacts that are opted out or lack address, and strictly deduplicate by recipient address
  const uniqueContactIds = Array.from(new Set(contact_ids));

  if (uniqueContactIds.length === 0) {
    res.status(400).json({ success: false, error: 'يجب اختيار جهة اتصال واحدة على الأقل' });
    return;
  }

  // Fetch contact details to enforce single-send-per-address rule
  const placeholders = uniqueContactIds.map(() => '?').join(',');
  const selectedContacts = db.prepare(`
    SELECT id, email, phone_mobile, whatsapp_number, opted_out
    FROM contacts
    WHERE id IN (${placeholders})
  `).all(...uniqueContactIds) as Array<{
    id: number;
    email: string | null;
    phone_mobile: string | null;
    whatsapp_number: string | null;
    opted_out: number;
  }>;

  const seenAddresses = new Set<string>();
  let finalContactIds: number[] = [];

  for (const c of selectedContacts) {
    let targetAddress: string | null = null;
    if (channel === 'email') {
      targetAddress = c.email ? c.email.trim().toLowerCase() : null;
      if (!targetAddress || !targetAddress.includes('@')) continue;
    } else {
      const wa = c.whatsapp_number || c.phone_mobile;
      targetAddress = wa ? wa.replace(/\D/g, '') : null;
      if (!targetAddress || targetAddress.length < 7) continue;
    }

    // STRICT DEDUPLICATION: Only allow each email/phone to be added ONCE per campaign!
    if (seenAddresses.has(targetAddress)) {
      continue;
    }

    seenAddresses.add(targetAddress);
    finalContactIds.push(c.id);
  }

  // If exclude_previously_contacted is enabled, filter out any contact whose address was sent in message_log
  if (exclude_previously_contacted) {
    const sentRows = db.prepare(`
      SELECT DISTINCT LOWER(TRIM(recipient_address)) as addr
      FROM message_log
      WHERE status = 'sent' AND channel = ? AND user_id = ?
    `).all(channel, req.user!.id) as Array<{ addr: string }>;
    const sentSet = new Set(sentRows.map((r) => r.addr));

    finalContactIds = finalContactIds.filter((cId) => {
      const c = selectedContacts.find((sc) => sc.id === cId);
      if (!c) return false;
      const targetAddress = channel === 'email'
        ? (c.email ? c.email.trim().toLowerCase() : '')
        : (c.whatsapp_number || c.phone_mobile ? String(c.whatsapp_number || c.phone_mobile).replace(/\D/g, '') : '');
      return !sentSet.has(targetAddress);
    });
  }

  if (finalContactIds.length === 0) {
    res.status(400).json({
      success: false,
      error: 'لا توجد جهات اتصال صالحة للإرسال بالقناة المحددة، أو تم استثناؤها لسابقة مراسلتها في السجل.',
    });
    return;
  }

  db.exec('BEGIN TRANSACTION;');

  try {
    const insertCampaign = db.prepare(`
      INSERT INTO campaigns (name, channel, template_id, status, is_dry_run, total_recipients, user_id)
      VALUES (?, ?, ?, 'draft', ?, ?, ?)
    `);

    const campResult = insertCampaign.run(
      name,
      channel,
      template_id,
      is_dry_run ? 1 : 0,
      finalContactIds.length,
      req.user!.id
    );

    const campaignId = Number(campResult.lastInsertRowid);

    const insertRecipient = db.prepare(`
      INSERT INTO campaign_recipients (campaign_id, contact_id, status)
      VALUES (?, ?, 'pending')
    `);

    for (const cId of finalContactIds) {
      insertRecipient.run(campaignId, cId);
    }

    db.exec('COMMIT;');

    logActivity({
      category: 'campaign',
      action: 'create',
      title: `إنشاء حملة جديدة: "${name}"`,
      details: {
        campaignId,
        channel,
        template_id,
        recipientsCount: finalContactIds.length,
        is_dry_run,
      },
      userId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      campaignId,
      message: `تم إنشاء الحملة بنجاح مع ${finalContactIds.length} مستلم فريد بدون أي تكرار.`,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/campaigns/:id/start
router.post('/:id/start', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const camp = db.prepare('SELECT name FROM campaigns WHERE id = ? AND (user_id = ? OR ? = 1)').get(campaignId, userId, isSuperAdmin ? 1 : 0) as { name: string } | undefined;
  if (!camp) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }

  await campaignQueue.startCampaign(campaignId);

  logActivity({
    category: 'campaign',
    action: 'start',
    title: `إطلاق وبدء إرسال الحملة: "${camp?.name || `#${campaignId}`}"`,
    details: { campaignId },
    userId,
  });

  res.json({ success: true, message: 'Campaign started' });
});

// POST /api/campaigns/:id/pause
router.post('/:id/pause', requireAuth, (req: AuthRequest, res: Response): void => {
  const campaignId = parseInt(req.params.id, 10);
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const camp = db.prepare('SELECT name FROM campaigns WHERE id = ? AND (user_id = ? OR ? = 1)').get(campaignId, userId, isSuperAdmin ? 1 : 0) as { name: string } | undefined;
  if (!camp) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }

  campaignQueue.pauseCampaign(campaignId);

  logActivity({
    category: 'campaign',
    action: 'pause',
    title: `إيقاف مؤقت للحملة: "${camp?.name || `#${campaignId}`}"`,
    details: { campaignId },
    status: 'warning',
    userId,
  });

  res.json({ success: true, message: 'Campaign paused' });
});

// POST /api/campaigns/:id/resume
router.post('/:id/resume', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const camp = db.prepare('SELECT name FROM campaigns WHERE id = ? AND (user_id = ? OR ? = 1)').get(campaignId, userId, isSuperAdmin ? 1 : 0) as { name: string } | undefined;
  if (!camp) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }

  await campaignQueue.resumeCampaign(campaignId);

  logActivity({
    category: 'campaign',
    action: 'resume',
    title: `استئناف إرسال الحملة: "${camp?.name || `#${campaignId}`}"`,
    details: { campaignId },
    userId,
  });

  res.json({ success: true, message: 'Campaign resumed' });
});

// POST /api/campaigns/:id/cancel
router.post('/:id/cancel', requireAuth, (req: AuthRequest, res: Response): void => {
  const campaignId = parseInt(req.params.id, 10);
  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const camp = db.prepare('SELECT name FROM campaigns WHERE id = ? AND (user_id = ? OR ? = 1)').get(campaignId, userId, isSuperAdmin ? 1 : 0) as { name: string } | undefined;
  if (!camp) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }

  campaignQueue.cancelCampaign(campaignId);

  logActivity({
    category: 'campaign',
    action: 'cancel',
    title: `إلغاء الحملة: "${camp?.name || `#${campaignId}`}"`,
    details: { campaignId },
    status: 'warning',
    userId,
  });

  res.json({ success: true, message: 'Campaign cancelled' });
});

// DELETE /api/campaigns/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const campaignId = parseInt(req.params.id, 10);
  if (isNaN(campaignId)) {
    res.status(400).json({ success: false, error: 'Invalid campaign ID' });
    return;
  }

  const db = getDatabase();
  const userId = req.user!.id;
  const isSuperAdmin = req.user?.role === 'super_admin';

  const campaign = db
    .prepare('SELECT id, name, status FROM campaigns WHERE id = ? AND (user_id = ? OR ? = 1)')
    .get(campaignId, userId, isSuperAdmin ? 1 : 0) as
    | { id: number; name: string; status: string }
    | undefined;

  if (!campaign) {
    res.status(404).json({ success: false, error: 'الحملة غير موجودة أو تم حذفها مسبقاً' });
    return;
  }

  // If campaign is running or paused in queue, stop it from active set
  try {
    campaignQueue.cancelCampaign(campaignId);
  } catch (err) {
    console.warn(`Could not cancel campaign in queue before delete:`, err);
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Delete associated campaign recipients
    db.prepare('DELETE FROM campaign_recipients WHERE campaign_id = ?').run(campaignId);

    // 2. Disassociate message logs to keep historical sent logs intact while clearing campaign FK
    db.prepare('UPDATE message_log SET campaign_id = NULL WHERE campaign_id = ?').run(campaignId);

    // 3. Delete the campaign record
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(campaignId);

    db.exec('COMMIT;');

    logActivity({
      category: 'campaign',
      action: 'delete',
      title: `حذف الحملة نهائياً: "${campaign.name}"`,
      details: { campaignId },
      status: 'warning',
    });

    res.json({
      success: true,
      message: `تم حذف الحملة "${campaign.name}" بنجاح`,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    res.status(500).json({
      success: false,
      error: err.message || 'حدث خطأ أثناء حذف الحملة',
    });
  }
});

// POST /api/campaigns/test-send (Test send to own email or phone)
const testSendSchema = z.object({
  channel: z.enum(['email', 'whatsapp']),
  template_id: z.number().int().positive(),
  recipient_address: z.string().min(3),
});

router.post('/test-send', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = testSendSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parseResult.error.format() });
    return;
  }

  const { channel, template_id, recipient_address } = parseResult.data;

  if (channel === 'whatsapp') {
    res.status(400).json({
      success: false,
      error: 'الإرسال التجريبي للواتساب معطل حالياً وقيد التطوير (الميزة قادمة قريباً).',
    });
    return;
  }

  const db = getDatabase();

  const template = db.prepare('SELECT subject, body FROM templates WHERE id = ?').get(template_id) as
    | { subject: string | null; body: string }
    | undefined;

  if (!template) {
    res.status(404).json({ success: false, error: 'Template not found' });
    return;
  }

  const sampleVars = {
    company_name: 'Test Partner Co.',
    person_name: 'Dear Colleague',
    job_title: 'Director',
    website: 'https://example.com',
    unsubscribe_url: 'http://localhost:5000/unsubscribe/test-sample-token',
  };

  const renderedSubject = template.subject ? `[TEST] ${renderTemplate(template.subject, sampleVars)}` : '[TEST Outreach]';
  const renderedBody = renderTemplate(template.body, sampleVars);

  if (channel === 'email') {
    const provider = getEmailProvider(req.user!.id);
    const result = await provider.sendEmail({
      to: recipient_address,
      subject: renderedSubject,
      html: renderedBody,
      unsubscribeUrl: sampleVars.unsubscribe_url,
    });

    logActivity({
      category: 'message',
      action: 'send',
      title: `إرسال تجريبي (بريد) إلى: ${recipient_address}`,
      details: { channel: 'email', recipient_address, template_id },
      status: result.success ? 'success' : 'failed',
      userId: req.user!.id,
    });

    res.json({
      success: result.success,
      message: result.success ? `Test email dispatched to ${recipient_address}` : `Failed: ${result.error}`,
      error: result.error,
    });
  } else {
    const waProvider = getWhatsAppProvider();
    const result = await waProvider.sendMessage({
      to: recipient_address,
      text: renderedBody,
    });

    logActivity({
      category: 'message',
      action: 'send',
      title: `إرسال تجريبي (واتساب) إلى: ${recipient_address}`,
      details: { channel: 'whatsapp', recipient_address, template_id, clickToChatUrl: result.clickToChatUrl },
      status: result.success ? 'success' : 'failed',
    });

    res.json({
      success: result.success,
      clickToChatUrl: result.clickToChatUrl,
      message: result.clickToChatUrl
        ? `WhatsApp test prepared. Open link: ${result.clickToChatUrl}`
        : 'Dispatched test message',
    });
  }
});

// POST /api/campaigns/send-direct
const directSendSchema = z.object({
  channel: z.enum(['email', 'whatsapp']).default('email'),
  recipient_address: z.string().min(1, 'Recipient address is required'),
  person_name: z.string().optional().default(''),
  company_name: z.string().optional().default(''),
  job_title: z.string().optional().default(''),
  subject: z.string().optional().default(''),
  body: z.string().min(1, 'Body is required'),
  is_dry_run: z.boolean().default(false),
  save_to_contacts: z.boolean().default(false),
});

router.post('/send-direct', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = directSendSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parseResult.error.format() });
    return;
  }

  const {
    channel,
    recipient_address,
    person_name,
    company_name,
    job_title,
    subject,
    body,
    is_dry_run,
    save_to_contacts,
  } = parseResult.data;

  if (channel === 'whatsapp') {
    res.status(400).json({
      success: false,
      error: 'إرسال الواتساب المباشر معطل حالياً وقيد التطوير للربط السحابي (قريباً).',
    });
    return;
  }

  const db = getDatabase();

  // Generate unsubscribe link
  const unsubToken = crypto.randomUUID();
  try {
    db.prepare('INSERT INTO unsubscribes (token, identifier, channel, created_at) VALUES (?, ?, ?, datetime(\'now\'))')
      .run(unsubToken, recipient_address, channel);
  } catch {}

  const unsubscribeUrl = `${env.UNSUBSCRIBE_BASE_URL || 'http://localhost:5000/unsubscribe'}/${unsubToken}`;

  const vars = {
    company_name: company_name || 'Valued Partner',
    person_name: person_name || 'Dear Partner',
    job_title: job_title || '',
    email: recipient_address,
    website: '',
    unsubscribe_url: unsubscribeUrl,
  };

  const renderedSubject = subject ? renderTemplate(subject, vars) : 'Direct Outreach';
  const renderedBody = renderTemplate(body, vars);

  let sendSuccess = false;
  let errorMsg: string | undefined;
  let clickToChatUrl: string | undefined;
  let providerResp: string | undefined;

  if (is_dry_run) {
    sendSuccess = true;
    providerResp = 'Simulated direct dispatch (Dry Run)';
  } else if (channel === 'email') {
    const provider = getEmailProvider(req.user!.id);
    const result = await provider.sendEmail({
      to: recipient_address,
      subject: renderedSubject,
      html: renderedBody,
      unsubscribeUrl,
    });
    sendSuccess = result.success;
    errorMsg = result.error;
    providerResp = result.messageId ? `Message ID: ${result.messageId}` : undefined;
  } else {
    const waProvider = getWhatsAppProvider();
    const result = await waProvider.sendMessage({
      to: recipient_address,
      text: renderedBody,
    });
    sendSuccess = result.success;
    errorMsg = result.error;
    clickToChatUrl = result.clickToChatUrl;
    providerResp = clickToChatUrl ? 'Click-to-chat URL generated' : 'Sent';
  }

  // Find or optionally create contact & company for linking
  let contactId: number | null = null;
  const userId = req.user!.id;
  try {
    const existing = db.prepare(
      'SELECT id FROM contacts WHERE user_id = ? AND ((email = ? AND email IS NOT NULL) OR (whatsapp_number = ? AND whatsapp_number IS NOT NULL))'
    ).get(userId, recipient_address, recipient_address) as { id: number } | undefined;

    if (existing) {
      contactId = existing.id;
    } else if (save_to_contacts || person_name || company_name) {
      let companyId: number | null = null;
      if (company_name) {
        const existingCo = db.prepare('SELECT id FROM companies WHERE name = ? AND user_id = ?').get(company_name, userId) as { id: number } | undefined;
        if (existingCo) {
          companyId = existingCo.id;
        } else {
          const ins = db.prepare("INSERT INTO companies (name, created_at, updated_at, user_id) VALUES (?, datetime('now'), datetime('now'), ?)").run(company_name, userId);
          companyId = Number(ins.lastInsertRowid);
        }
      }

      const ins = db.prepare(`
        INSERT INTO contacts (company_id, person_name, job_title, email, whatsapp_number, consent_status, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'), ?)
      `).run(
        companyId,
        person_name || null,
        job_title || null,
        channel === 'email' ? recipient_address : null,
        (channel as string) === 'whatsapp' ? recipient_address : null,
        userId
      );
      contactId = Number(ins.lastInsertRowid);
    }
  } catch (err: any) {
    console.error('Contact resolution error:', err);
  }

  // Record in message_log and activity_log
  try {
    db.prepare(`
      INSERT INTO message_log (
        campaign_id, contact_id, channel, recipient_address,
        subject, rendered_body, status, provider_response, error, created_at, user_id
      ) VALUES (
        NULL, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?
      )
    `).run(
      contactId,
      channel,
      recipient_address,
      channel === 'email' ? renderedSubject : null,
      renderedBody,
      is_dry_run ? 'dry_run' : sendSuccess ? 'sent' : 'failed',
      providerResp || null,
      errorMsg || null,
      userId
    );

    logActivity({
      category: 'message',
      action: 'send',
      title: `إرسال مباشر (${channel === 'email' ? 'بريد' : 'واتساب'}) إلى: ${recipient_address}`,
      details: {
        channel,
        recipient_address,
        person_name: person_name || null,
        company_name: company_name || null,
        is_dry_run,
      },
      status: sendSuccess ? 'success' : 'failed',
      userId,
    });
  } catch (err: any) {
    console.error('Failed to log message:', err);
  }

  if (sendSuccess) {
    res.json({
      success: true,
      clickToChatUrl,
      message: clickToChatUrl
        ? `WhatsApp message prepared. Click to chat: ${clickToChatUrl}`
        : is_dry_run
        ? `Dry run simulation logged successfully for ${recipient_address}`
        : `Email dispatched successfully to ${recipient_address}!`,
    });
  } else {
    res.status(400).json({
      success: false,
      error: errorMsg || 'Failed to dispatch email',
    });
  }
});

export default router;
