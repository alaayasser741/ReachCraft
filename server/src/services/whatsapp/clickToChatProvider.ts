import { WhatsAppMessage, WhatsAppProvider, WhatsAppSendResult, WhatsAppStatus } from './whatsappProvider.js';
import { env } from '../../config/env.js';
import { getDatabase } from '../../db/connection.js';

// Spintax resolver: converts {Hi|Hello|Hey} into a random choice
export function resolveSpintax(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (_match, group) => {
    const choices = group.split('|');
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    return randomChoice.trim();
  });
}

export class ClickToChatProvider implements WhatsAppProvider {
  public name = 'click-to-chat';

  generateClickToChatUrl(phone: string, message: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    const resolvedText = resolveSpintax(message);
    const encodedText = encodeURIComponent(resolvedText);
    return `https://wa.me/${digitsOnly}?text=${encodedText}`;
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const clickUrl = this.generateClickToChatUrl(message.to, message.text);
    return {
      success: true,
      clickToChatUrl: clickUrl,
      messageId: `c2c-${Date.now()}`,
    };
  }

  async getStatus(): Promise<WhatsAppStatus> {
    const db = getDatabase();
    const todaySent = (
      db.prepare(`
        SELECT COUNT(*) as count FROM message_log 
        WHERE channel = 'whatsapp' 
        AND status IN ('sent', 'dry_run')
        AND created_at >= date('now', 'start of day')
      `).get() as { count: number }
    ).count;

    return {
      provider: 'click-to-chat',
      connected: true,
      qrCode: null,
      phoneNumber: null,
      warmupMode: env.WHATSAPP_WARMUP_MODE,
      dailySentCount: todaySent,
      dailyCap: env.WHATSAPP_DAILY_CAP,
    };
  }
}
