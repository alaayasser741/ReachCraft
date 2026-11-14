import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { getDatabase } from '../../db/connection.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { geminiService } from '../ai/gemini.service.js';
import { getEmailProvider } from './providerFactory.js';
import { decryptSecret } from '../encryption.service.js';

export interface SyncResult {
  syncedCount: number;
  newEmailsCount: number;
  totalInInbox: number;
}

export class ImapReaderService {
  private getCredentials(userId?: number) {
    try {
      const db = getDatabase();

      if (userId) {
        const userIntegration = db.prepare(`
          SELECT smtp_user, smtp_pass_encrypted, smtp_pass_iv, smtp_pass_tag
          FROM user_integrations 
          WHERE user_id = ?
        `).get(userId) as any;

        if (userIntegration && userIntegration.smtp_pass_encrypted && userIntegration.smtp_user) {
          const decryptedPass = decryptSecret(
            userIntegration.smtp_pass_encrypted,
            userIntegration.smtp_pass_iv,
            userIntegration.smtp_pass_tag
          );
          return {
            user: userIntegration.smtp_user,
            pass: decryptedPass,
          };
        }
      }

      const rows = db.prepare("SELECT key, value FROM app_settings WHERE key IN ('smtp_user', 'smtp_pass')").all() as Array<{
        key: string;
        value: string;
      }>;
      const map = new Map<string, string>();
      rows.forEach((r) => map.set(r.key, r.value));

      return {
        user: map.get('smtp_user') || env.SMTP_USER,
        pass: map.get('smtp_pass') || env.SMTP_PASS,
      };
    } catch {
      return {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      };
    }
  }

  public async syncInbox(limit = 25, userId: number = 1): Promise<SyncResult> {
    const creds = this.getCredentials(userId);
    if (!creds.user || !creds.pass) {
      throw new Error('SMTP/IMAP user and pass are not configured');
    }

    const cleanPass = creds.pass.replace(/\s+/g, '');
    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: creds.user.trim(),
        pass: cleanPass,
      },
      logger: false,
    });

    logger.info({ user: creds.user }, 'Connecting to Gmail IMAP for inbox sync');
    await client.connect();

    const db = getDatabase();
    let newEmailsCount = 0;
    let totalInInbox = 0;

    const lock = await client.getMailboxLock('INBOX');
    try {
      const mailbox = client.mailbox;
      if (!mailbox) {
        throw new Error('Could not access INBOX');
      }
      totalInInbox = mailbox.exists;

      if (mailbox.exists === 0) {
        return { syncedCount: 0, newEmailsCount: 0, totalInInbox: 0 };
      }

      // Fetch the latest N messages from the tail of mailbox
      const fromSeq = Math.max(1, mailbox.exists - limit + 1);
      const toSeq = mailbox.exists;
      const range = `${fromSeq}:${toSeq}`;

      logger.info({ range, totalInInbox }, 'Fetching messages from IMAP');

      const checkStmt = db.prepare('SELECT id, is_read FROM inbox_messages WHERE message_uid = ? AND user_id = ?');
      const insertStmt = db.prepare(`
        INSERT INTO inbox_messages (
          message_uid, from_name, from_email, subject, snippet,
          body_html, body_text, date, is_read, ai_category,
          ai_summary, ai_priority, ai_suggested_reply, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const updateReadStmt = db.prepare('UPDATE inbox_messages SET is_read = ? WHERE id = ? AND user_id = ?');

      // Fetch messages with raw source for parsing
      const messagesGenerator = client.fetch(range, {
        uid: true,
        flags: true,
        source: true,
        envelope: true,
      });

      for await (const msg of messagesGenerator) {
        const uidStr = String(msg.uid);
        const existing = checkStmt.get(uidStr, userId) as { id: number; is_read: number } | undefined;
        const isReadFlag = msg.flags?.has('\\Seen') ? 1 : 0;

        if (existing) {
          if (isReadFlag === 1 && existing.is_read === 0) {
            // Marked as read on Gmail web/app -> reflect in ReachCraft
            updateReadStmt.run(1, existing.id, userId);
          } else if (existing.is_read === 1 && isReadFlag === 0) {
            // User opened/read this email in ReachCraft -> preserve read state and sync \Seen to Gmail
            try {
              await client.messageFlagsAdd(uidStr, ['\\Seen'], { uid: true });
            } catch (flagErr: any) {
              logger.warn({ err: flagErr.message, uid: uidStr }, 'Failed to sync \\Seen to IMAP during syncInbox');
            }
          }
          continue;
        }

        // New email: parse full RFC822 message
        try {
          if (!msg.source) {
            continue;
          }
          const parsed: any = await simpleParser(msg.source);
          const fromName = parsed.from?.value?.[0]?.name || parsed.from?.text || 'Unknown Sender';
          const fromEmail = parsed.from?.value?.[0]?.address || 'unknown@domain.com';
          const subject = parsed.subject || '(بدون عنوان)';
          const bodyText = typeof parsed.text === 'string' ? parsed.text : '';
          const bodyHtml = typeof parsed.html === 'string' ? parsed.html : '';
          const snippet = (bodyText || subject).replace(/\s+/g, ' ').slice(0, 180);
          const emailDate = parsed.date ? parsed.date.toISOString() : new Date().toISOString();

          // Fast Heuristic Classification to conserve Gemini 15 RPM free tier quota
          let aiCategory = 'general';
          let aiSummary = 'وصلك إيميل جديد في بريدك.';
          let aiPriority = 'normal';
          let aiSuggestedReply = '';

          const lowerFrom = fromEmail.toLowerCase();
          const lowerSub = subject.toLowerCase();

          // Obvious automated job alerts
          if (
            lowerFrom.includes('jobalerts') ||
            lowerFrom.includes('linkedin.com') && (lowerSub.includes('job') || lowerSub.includes('hiring')) ||
            lowerFrom.includes('indeed.com') ||
            lowerFrom.includes('wuzzuf') ||
            lowerFrom.includes('bayt')
          ) {
            aiCategory = 'job_alert';
            aiPriority = 'low';
            aiSummary = `تنبيه وظائف تلقائي من ${fromName}: ${subject}`;
          } else if (
            lowerFrom.includes('noreply') ||
            lowerFrom.includes('no-reply') ||
            lowerFrom.includes('newsletter') ||
            lowerFrom.includes('promo') ||
            lowerFrom.includes('shop@') ||
            lowerFrom.includes('billing@') ||
            lowerFrom.includes('donotreply')
          ) {
            // Obvious automated system / marketing mail
            aiCategory = 'general';
            aiPriority = 'low';
            aiSummary = `إشعار تلقائي من ${fromName}: ${subject}`;
          } else {
            // High-value recruiter / human / company email: run Gemini AI classification
            try {
              const classification = await geminiService.classifyIncomingEmail({
                from: `${fromName} <${fromEmail}>`,
                subject,
                body: bodyText || snippet,
              });
              aiCategory = classification.category;
              aiSummary = classification.takeawayAr;
              aiPriority = classification.priority;
              aiSuggestedReply = classification.suggestedReply;
            } catch (aiErr: any) {
              logger.warn({ error: aiErr.message, subject }, 'AI classification skipped, using heuristic fallback');
              // Heuristic fallback if quota reached
              if (lowerSub.includes('interview') || lowerSub.includes('frontend') || lowerSub.includes('application') || lowerSub.includes('call')) {
                aiCategory = 'hr_interview';
                aiPriority = 'high';
                aiSummary = `تواصل بخصوص وظيفة أو مقابلة: ${subject}`;
              }
            }
          }

          insertStmt.run(
            uidStr,
            fromName,
            fromEmail,
            subject,
            snippet,
            bodyHtml,
            bodyText,
            emailDate,
            isReadFlag,
            aiCategory,
            aiSummary,
            aiPriority,
            aiSuggestedReply,
            userId
          );

          newEmailsCount++;
        } catch (parseErr: any) {
          logger.error({ error: parseErr.message, uid: uidStr }, 'Error parsing IMAP message');
        }
      }
    } finally {
      lock.release();
      await client.logout();
    }

    return {
      syncedCount: limit,
      newEmailsCount,
      totalInInbox,
    };
  }

  public async sendReply(params: {
    inboxMessageId: number;
    replyText: string;
    recipientEmail: string;
    subject: string;
    userId?: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailProvider = getEmailProvider(params.userId);
      const replySubject = params.subject.startsWith('Re:') ? params.subject : `Re: ${params.subject}`;

      // Format text with paragraph breaks and signature
      const formattedHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6;">
          ${params.replyText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}
        </div>
      `;

      const result = await emailProvider.sendEmail({
        to: params.recipientEmail,
        subject: replySubject,
        html: formattedHtml,
        text: params.replyText,
      });

      if (result.success) {
        const db = getDatabase();
        // Mark as read after replying
        db.prepare('UPDATE inbox_messages SET is_read = 1 WHERE id = ?').run(params.inboxMessageId);
        const row = db.prepare('SELECT message_uid FROM inbox_messages WHERE id = ?').get(params.inboxMessageId) as { message_uid?: string } | undefined;
        if (row?.message_uid && !row.message_uid.startsWith('demo')) {
          this.markMessageAsReadOnImap(row.message_uid, true).catch(() => {});
        }
      }

      return result;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reply' };
    }
  }

  public async markMessageAsReadOnImap(messageUid: string, isRead: boolean = true): Promise<boolean> {
    const creds = this.getCredentials();
    if (!creds.user || !creds.pass || !messageUid) {
      return false;
    }

    const cleanPass = creds.pass.replace(/\s+/g, '');
    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: creds.user.trim(),
        pass: cleanPass,
      },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      try {
        if (isRead) {
          await client.messageFlagsAdd(messageUid, ['\\Seen'], { uid: true });
        } else {
          await client.messageFlagsRemove(messageUid, ['\\Seen'], { uid: true });
        }
        return true;
      } finally {
        lock.release();
        await client.logout();
      }
    } catch (err: any) {
      logger.warn({ error: err.message, messageUid, isRead }, 'Failed to sync flag to IMAP server');
      return false;
    }
  }
}

export const imapReaderService = new ImapReaderService();
