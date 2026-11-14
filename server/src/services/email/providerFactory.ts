import { EmailProvider } from './emailProvider.js';
import { NodemailerProvider } from './nodemailerProvider.js';
import { env } from '../../config/env.js';
import { getDatabase } from '../../db/connection.js';
import { decryptSecret } from '../encryption.service.js';

export class MockEmailProvider implements EmailProvider {
  public name = 'mock';
  async verifyConnection() {
    return { success: true };
  }
  async sendEmail(message: any) {
    return { success: true, messageId: `mock-${Date.now()}` };
  }
}

export function getEmailProvider(userId?: number): EmailProvider {
  if (process.env.NODE_ENV === 'test') {
    return new MockEmailProvider();
  }

  try {
    const db = getDatabase();

    // Check user-specific encrypted integrations first
    if (userId) {
      const userIntegration = db.prepare(`
        SELECT smtp_host, smtp_port, smtp_secure, smtp_user, 
               smtp_pass_encrypted, smtp_pass_iv, smtp_pass_tag,
               smtp_from_name, smtp_from_email
        FROM user_integrations 
        WHERE user_id = ?
      `).get(userId) as any;

      if (userIntegration && userIntegration.smtp_pass_encrypted) {
        const decryptedPass = decryptSecret(
          userIntegration.smtp_pass_encrypted,
          userIntegration.smtp_pass_iv,
          userIntegration.smtp_pass_tag
        );

        return new NodemailerProvider({
          host: userIntegration.smtp_host || 'smtp.gmail.com',
          port: userIntegration.smtp_port || 465,
          secure: userIntegration.smtp_secure !== 0,
          user: userIntegration.smtp_user,
          pass: decryptedPass,
          fromName: userIntegration.smtp_from_name || env.SMTP_FROM_NAME,
          fromEmail: userIntegration.smtp_from_email || userIntegration.smtp_user,
          providerName: 'user-gmail-smtp',
        });
      }
    }

    // Fallback to global/admin settings
    const rows = db.prepare("SELECT key, value FROM app_settings WHERE key LIKE 'smtp_%'").all() as Array<{
      key: string;
      value: string;
    }>;

    const settingsMap = new Map<string, string>();
    rows.forEach((r) => settingsMap.set(r.key, r.value));

    const host = settingsMap.get('smtp_host') || env.SMTP_HOST;
    const port = settingsMap.get('smtp_port') ? parseInt(settingsMap.get('smtp_port')!, 10) : env.SMTP_PORT;
    const user = settingsMap.get('smtp_user') || env.SMTP_USER;
    const pass = settingsMap.get('smtp_pass') || env.SMTP_PASS;
    const fromName = settingsMap.get('smtp_from_name') || env.SMTP_FROM_NAME;
    const fromEmail = settingsMap.get('smtp_from_email') || env.SMTP_FROM_EMAIL;
    const secure = settingsMap.get('smtp_secure') ? settingsMap.get('smtp_secure') === 'true' : env.SMTP_SECURE;

    return new NodemailerProvider({
      host,
      port,
      user,
      pass,
      fromName,
      fromEmail,
      secure,
      providerName: env.EMAIL_PROVIDER,
    });
  } catch {
    return new NodemailerProvider();
  }
}
