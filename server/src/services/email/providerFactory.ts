import { EmailProvider } from './emailProvider.js';
import { NodemailerProvider } from './nodemailerProvider.js';
import { env } from '../../config/env.js';
import { getDatabase } from '../../db/connection.js';

export class MockEmailProvider implements EmailProvider {
  public name = 'mock';
  async verifyConnection() {
    return { success: true };
  }
  async sendEmail(message: any) {
    return { success: true, messageId: `mock-${Date.now()}` };
  }
}

export function getEmailProvider(): EmailProvider {
  if (process.env.NODE_ENV === 'test') {
    return new MockEmailProvider();
  }

  // Check database settings for custom SMTP overrides
  try {
    const db = getDatabase();
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
