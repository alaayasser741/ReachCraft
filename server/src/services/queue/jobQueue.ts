import crypto from 'node:crypto';
import { getDatabase } from '../../db/connection.js';
import { getEmailProvider } from '../email/providerFactory.js';
import { getWhatsAppProvider } from '../whatsapp/providerFactory.js';
import { renderTemplate } from '../../routes/templates.routes.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

interface CampaignRow {
  id: number;
  name: string;
  channel: 'email' | 'whatsapp';
  template_id: number;
  status: 'draft' | 'running' | 'paused' | 'done' | 'cancelled';
  is_dry_run: number;
  user_id: number;
}

interface RecipientRow {
  id: number;
  campaign_id: number;
  contact_id: number;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  retry_count: number;
  person_name: string | null;
  job_title: string | null;
  email: string | null;
  phone_mobile: string | null;
  whatsapp_number: string | null;
  opted_out: number;
  company_name: string;
  company_website: string | null;
}

class CampaignQueueEngine {
  private activeCampaigns = new Set<number>();
  private consecutiveFailures = new Map<number, number>();
  private isProcessing = false;

  public async startCampaign(campaignId: number): Promise<void> {
    const db = getDatabase();

    db.prepare(`
      UPDATE campaigns
      SET status = 'running', pause_reason = NULL, started_at = coalesce(started_at, datetime('now'))
      WHERE id = ?
    `).run(campaignId);

    this.consecutiveFailures.set(campaignId, 0);
    this.activeCampaigns.add(campaignId);
    this.triggerProcessing();
  }

  public pauseCampaign(campaignId: number, reason?: string): void {
    const db = getDatabase();
    db.prepare(`UPDATE campaigns SET status = 'paused', pause_reason = ? WHERE id = ?`).run(reason || null, campaignId);
    this.activeCampaigns.delete(campaignId);
  }

  public resumeCampaign(campaignId: number): void {
    this.startCampaign(campaignId);
  }

  public cancelCampaign(campaignId: number): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE campaigns 
      SET status = 'cancelled', completed_at = datetime('now') 
      WHERE id = ?
    `).run(campaignId);

    db.prepare(`
      UPDATE campaign_recipients 
      SET status = 'skipped', error = 'Campaign cancelled by user' 
      WHERE campaign_id = ? AND status = 'pending'
    `).run(campaignId);

    this.activeCampaigns.delete(campaignId);
  }

  private triggerProcessing(): void {
    if (this.isProcessing) return;
    this.processLoop().catch((err) => {
      logger.error({ err }, 'Error in campaign process loop');
      this.isProcessing = false;
    });
  }

  private async processLoop(): Promise<void> {
    this.isProcessing = true;
    const db = getDatabase();

    try {
      while (true) {
        // Find running campaigns
        const runningCampaigns = db.prepare(`
          SELECT id, name, channel, template_id, status, is_dry_run
          FROM campaigns
          WHERE status = 'running'
        `).all() as unknown as CampaignRow[];

        if (runningCampaigns.length === 0) {
          break;
        }

        let didWork = false;

        for (const campaign of runningCampaigns) {
          // Check daily caps before dispatching
          const isCapExceeded = this.checkDailyCap(campaign.channel);
          if (isCapExceeded) {
            const reason = `تم الوصول للحد اليومي الآمن للإرسال عبر ${campaign.channel === 'email' ? 'البريد الإلكتروني' : 'الواتساب'}. تم إيقاف الحملة لحماية الحساب.`;
            logger.warn({ campaignId: campaign.id, channel: campaign.channel }, 'Daily sending cap reached. Auto-pausing campaign.');
            this.pauseCampaign(campaign.id, reason);
            continue;
          }

          // Fetch next pending recipient
          const recipient = db.prepare(`
            SELECT 
              cr.id, cr.campaign_id, cr.contact_id, cr.status, cr.retry_count,
              ct.person_name, ct.job_title, ct.email, ct.phone_mobile, ct.whatsapp_number, ct.opted_out,
              c.name as company_name, c.website as company_website
            FROM campaign_recipients cr
            JOIN contacts ct ON ct.id = cr.contact_id
            JOIN companies c ON c.id = ct.company_id
            WHERE cr.campaign_id = ? AND cr.status = 'pending'
            ORDER BY cr.id ASC
            LIMIT 1
          `).get(campaign.id) as unknown as RecipientRow | undefined;

          if (!recipient) {
            // All recipients for this campaign have been processed! Mark done.
            db.prepare(`
              UPDATE campaigns 
              SET status = 'done', completed_at = datetime('now') 
              WHERE id = ?
            `).run(campaign.id);

            this.activeCampaigns.delete(campaign.id);
            logger.info({ campaignId: campaign.id }, 'Campaign finished all recipients.');
            continue;
          }

          didWork = true;
          await this.processSingleRecipient(campaign, recipient);

          // Rate limit delay with random jitter (instant in test/dry_run)
          if (!campaign.is_dry_run && process.env.NODE_ENV !== 'test') {
            const minSec = campaign.channel === 'email' ? env.EMAIL_MIN_INTERVAL_SEC : env.WHATSAPP_MIN_INTERVAL_SEC;
            const maxSec = campaign.channel === 'email' ? env.EMAIL_MAX_INTERVAL_SEC : env.WHATSAPP_MAX_INTERVAL_SEC;
            const delaySec = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
            await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
          } else {
            // Small pause for dry-run or tests
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        if (!didWork) {
          break;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private checkDailyCap(channel: 'email' | 'whatsapp'): boolean {
    const db = getDatabase();
    const cap = channel === 'email' ? env.EMAIL_DAILY_CAP : env.WHATSAPP_DAILY_CAP;

    const row = db.prepare(`
      SELECT COUNT(*) as count 
      FROM message_log 
      WHERE channel = ? 
      AND status = 'sent' 
      AND created_at >= date('now', 'start of day')
    `).get(channel) as { count: number };

    return row.count >= cap;
  }

  private async processSingleRecipient(campaign: CampaignRow, recipient: RecipientRow): Promise<void> {
    const db = getDatabase();

    // Check opt-out status
    if (recipient.opted_out === 1) {
      db.prepare(`
        UPDATE campaign_recipients 
        SET status = 'skipped', error = 'Contact is opted out' 
        WHERE id = ?
      `).run(recipient.id);

      db.prepare(`UPDATE campaigns SET skipped_count = skipped_count + 1 WHERE id = ?`).run(campaign.id);
      return;
    }

    // Check channel address
    const targetAddress = campaign.channel === 'email' ? recipient.email : recipient.whatsapp_number || recipient.phone_mobile;
    if (!targetAddress) {
      db.prepare(`
        UPDATE campaign_recipients 
        SET status = 'skipped', error = 'Missing address for channel' 
        WHERE id = ?
      `).run(recipient.id);

      db.prepare(`UPDATE campaigns SET skipped_count = skipped_count + 1 WHERE id = ?`).run(campaign.id);
      return;
    }

    // Strict runtime deduplication: Ensure no address is ever sent more than once per campaign
    const normalizedTarget = campaign.channel === 'email'
      ? targetAddress.trim().toLowerCase()
      : targetAddress.replace(/\D/g, '');

    const alreadySentInThisCampaign = db.prepare(`
      SELECT id FROM message_log 
      WHERE campaign_id = ? 
        AND status IN ('sent', 'dry_run')
        AND (
          (channel = 'email' AND LOWER(TRIM(recipient_address)) = ?) OR
          (channel = 'whatsapp' AND REPLACE(REPLACE(REPLACE(recipient_address, ' ', ''), '-', ''), '+', '') = ?)
        )
      LIMIT 1
    `).get(campaign.id, normalizedTarget, normalizedTarget);

    if (alreadySentInThisCampaign) {
      logger.warn({ campaignId: campaign.id, targetAddress }, 'Duplicate recipient address detected in campaign runner. Skipping duplicate send.');
      db.prepare(`
        UPDATE campaign_recipients 
        SET status = 'skipped', error = 'تم تخطي هذا المستلم لتجنب التكرار (تم الإرسال له مسبقاً في هذه الحملة)' 
        WHERE id = ?
      `).run(recipient.id);
      db.prepare(`UPDATE campaigns SET skipped_count = skipped_count + 1 WHERE id = ?`).run(campaign.id);
      return;
    }

    // Fetch Template
    const template = db.prepare('SELECT subject, body FROM templates WHERE id = ?').get(campaign.template_id) as
      | { subject: string | null; body: string }
      | undefined;

    if (!template) {
      db.prepare(`UPDATE campaign_recipients SET status = 'failed', error = 'Template not found' WHERE id = ?`).run(recipient.id);
      db.prepare(`UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = ?`).run(campaign.id);
      return;
    }

    // Generate or fetch unsubscribe token
    const unsubToken = this.getOrCreateUnsubscribeToken(targetAddress, campaign.channel);
    const unsubscribeUrl = `${env.UNSUBSCRIBE_BASE_URL}/${unsubToken}`;

    const variables = {
      company_name: recipient.company_name,
      person_name: recipient.person_name,
      job_title: recipient.job_title,
      website: recipient.company_website,
      unsubscribe_url: unsubscribeUrl,
    };

    const renderedSubject = template.subject ? renderTemplate(template.subject, variables) : null;
    const renderedBody = renderTemplate(template.body, variables);

    // Dry Run Mode
    if (campaign.is_dry_run) {
      db.prepare(`
        UPDATE campaign_recipients 
        SET status = 'sent', sent_at = datetime('now') 
        WHERE id = ?
      `).run(recipient.id);

      db.prepare(`
        INSERT INTO message_log (campaign_id, contact_id, channel, recipient_address, subject, rendered_body, status, provider_response, user_id)
        VALUES (?, ?, ?, ?, ?, ?, 'dry_run', 'Rendered successfully (Dry Run)', ?)
      `).run(campaign.id, recipient.contact_id, campaign.channel, targetAddress, renderedSubject, renderedBody, campaign.user_id || 1);

      db.prepare(`UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?`).run(campaign.id);
      return;
    }

    // Real Execution
    if (campaign.channel === 'email') {
      const emailProvider = getEmailProvider(campaign.user_id);
      const sendResult = await emailProvider.sendEmail({
        to: targetAddress,
        subject: renderedSubject || 'Important Notice',
        html: renderedBody,
        unsubscribeUrl,
      });

      if (sendResult.success) {
        this.consecutiveFailures.set(campaign.id, 0);

        db.prepare(`
          UPDATE campaign_recipients 
          SET status = 'sent', sent_at = datetime('now') 
          WHERE id = ?
        `).run(recipient.id);

        db.prepare(`
          INSERT INTO message_log (campaign_id, contact_id, channel, recipient_address, subject, rendered_body, status, provider_response, user_id)
          VALUES (?, ?, 'email', ?, ?, ?, 'sent', ?, ?)
        `).run(campaign.id, recipient.contact_id, targetAddress, renderedSubject, renderedBody, sendResult.messageId || 'Success', campaign.user_id || 1);

        db.prepare(`UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?`).run(campaign.id);
      } else {
        // Handle failure & Circuit Breaker
        const isQuotaOrAuth = Boolean(sendResult.isQuotaOrAuthError);
        const retryCount = recipient.retry_count + 1;
        const failures = (this.consecutiveFailures.get(campaign.id) || 0) + 1;
        this.consecutiveFailures.set(campaign.id, failures);

        if (isQuotaOrAuth) {
          const reason = `تنبيه حماية Google SMTP: تم اكتشاف تجاوز كوتة الإرسال أو خطأ في الصلاحيات (${sendResult.error}). تم إيقاف الحملة فوراً لحماية حسابك من الحظر.`;
          logger.warn({ campaignId: campaign.id, reason }, 'Email provider reported auth or quota limit. Halting campaign.');
          this.pauseCampaign(campaign.id, reason);
        } else if (failures >= 3) {
          const reason = `قاطع الدائرة الذكي (Circuit Breaker): فشل إرسال 3 رسائل متتالية (${sendResult.error}). تم إيقاف الحملة فوراً لحماية سمعة النطاق وتجنب التصنيف كـ Spam.`;
          logger.warn({ campaignId: campaign.id, failures, reason }, 'Circuit breaker tripped. Auto-pausing campaign.');
          this.pauseCampaign(campaign.id, reason);
        }

        if (retryCount >= 2 || isQuotaOrAuth) {
          // Permanently fail this recipient
          db.prepare(`
            UPDATE campaign_recipients 
            SET status = 'failed', error = ?, retry_count = ? 
            WHERE id = ?
          `).run(sendResult.error || 'Send failed', retryCount, recipient.id);

          db.prepare(`
            INSERT INTO message_log (campaign_id, contact_id, channel, recipient_address, subject, rendered_body, status, error)
            VALUES (?, ?, 'email', ?, ?, ?, 'failed', ?)
          `).run(campaign.id, recipient.contact_id, targetAddress, renderedSubject, renderedBody, sendResult.error || 'Failed');

          db.prepare(`UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = ?`).run(campaign.id);
        } else {
          // Retry later
          db.prepare(`
            UPDATE campaign_recipients 
            SET retry_count = ?, error = ? 
            WHERE id = ?
          `).run(retryCount, sendResult.error || 'Temporary send error', recipient.id);
        }
      }
    } else {
      // WhatsApp Channel
      const waProvider = getWhatsAppProvider();
      const waResult = await waProvider.sendMessage({
        to: targetAddress,
        text: renderedBody,
        contactId: recipient.contact_id,
      });

      if (waResult.success) {
        this.consecutiveFailures.set(campaign.id, 0);

        db.prepare(`
          UPDATE campaign_recipients 
          SET status = 'sent', sent_at = datetime('now') 
          WHERE id = ?
        `).run(recipient.id);

        db.prepare(`
          INSERT INTO message_log (campaign_id, contact_id, channel, recipient_address, subject, rendered_body, status, provider_response)
          VALUES (?, ?, 'whatsapp', ?, null, ?, 'sent', ?)
        `).run(campaign.id, recipient.contact_id, targetAddress, renderedBody, waResult.clickToChatUrl || 'Click-to-chat ready');

        db.prepare(`UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?`).run(campaign.id);
      } else {
        const failures = (this.consecutiveFailures.get(campaign.id) || 0) + 1;
        this.consecutiveFailures.set(campaign.id, failures);

        if (failures >= 3) {
          const reason = `قاطع الدائرة الذكي (Circuit Breaker): فشل إرسال 3 رسائل واتساب متتالية (${waResult.error}). تم إيقاف الحملة لتجنب حظر الرقم.`;
          this.pauseCampaign(campaign.id, reason);
        }

        db.prepare(`
          UPDATE campaign_recipients 
          SET status = 'failed', error = ? 
          WHERE id = ?
        `).run(waResult.error || 'WhatsApp send error', recipient.id);

        db.prepare(`UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = ?`).run(campaign.id);
      }
    }
  }

  private getOrCreateUnsubscribeToken(identifier: string, channel: string): string {
    const db = getDatabase();
    const existing = db.prepare('SELECT token FROM unsubscribes WHERE identifier = ?').get(identifier) as
      | { token: string }
      | undefined;

    if (existing) return existing.token;

    const token = crypto.randomBytes(16).toString('hex');
    db.prepare(`
      INSERT INTO unsubscribes (identifier, token, channel)
      VALUES (?, ?, ?)
    `).run(identifier, token, channel);

    return token;
  }
}

export const campaignQueue = new CampaignQueueEngine();
