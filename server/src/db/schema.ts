import bcrypt from 'bcryptjs';
import { getDatabase } from './connection.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function runMigrations(): void {
  const db = getDatabase();

  logger.info('Initializing SQLite database schema...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'pending',
      parsed_count INTEGER NOT NULL DEFAULT 0,
      raw_data_json TEXT,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      website TEXT,
      description TEXT,
      address TEXT,
      source_file_id INTEGER REFERENCES uploaded_files(id) ON DELETE SET NULL,
      has_direct_contact INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      person_name TEXT,
      job_title TEXT,
      email TEXT,
      phone_mobile TEXT,
      phone_landline TEXT,
      whatsapp_number TEXT,
      address TEXT,
      is_valid_email INTEGER NOT NULL DEFAULT 0,
      is_valid_whatsapp INTEGER NOT NULL DEFAULT 0,
      opted_out INTEGER NOT NULL DEFAULT 0,
      opted_out_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      channel TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      channel TEXT NOT NULL,
      template_id INTEGER NOT NULL REFERENCES templates(id),
      status TEXT NOT NULL DEFAULT 'draft',
      pause_reason TEXT,
      is_dry_run INTEGER NOT NULL DEFAULT 0,
      total_recipients INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      scheduled_at TEXT,
      started_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS campaign_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      channel TEXT NOT NULL,
      recipient_address TEXT NOT NULL,
      subject TEXT,
      rendered_body TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      provider_response TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS unsubscribes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT UNIQUE NOT NULL,
      token TEXT UNIQUE NOT NULL,
      channel TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inbox_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_uid TEXT UNIQUE,
      from_name TEXT,
      from_email TEXT NOT NULL,
      subject TEXT,
      snippet TEXT,
      body_html TEXT,
      body_text TEXT,
      date TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      ai_category TEXT DEFAULT 'general',
      ai_summary TEXT,
      ai_priority TEXT DEFAULT 'normal',
      ai_suggested_reply TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    CREATE INDEX IF NOT EXISTS idx_contacts_phone_mobile ON contacts(phone_mobile);
    CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_number ON contacts(whatsapp_number);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_email ON contacts(LOWER(email)) WHERE email IS NOT NULL AND email != '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_phone ON contacts(phone_mobile) WHERE phone_mobile IS NOT NULL AND phone_mobile != '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_wa ON contacts(whatsapp_number) WHERE whatsapp_number IS NOT NULL AND whatsapp_number != '';
    CREATE INDEX IF NOT EXISTS idx_company_links_company_id ON company_links(company_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(campaign_id, status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_recipients_unique_contact ON campaign_recipients(campaign_id, contact_id);
    CREATE INDEX IF NOT EXISTS idx_message_log_campaign ON message_log(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_message_log_status_addr ON message_log(status, recipient_address);
    CREATE INDEX IF NOT EXISTS idx_message_log_contact_id ON message_log(contact_id);
    CREATE INDEX IF NOT EXISTS idx_unsubscribes_token ON unsubscribes(token);
    CREATE INDEX IF NOT EXISTS idx_unsubscribes_identifier ON unsubscribes(identifier);
  `);

  try {
    const db = getDatabase();
    db.exec('ALTER TABLE templates ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0');
  } catch {}

  try {
    const db = getDatabase();
    db.exec('ALTER TABLE campaigns ADD COLUMN pause_reason TEXT');
  } catch {}

  // Seed Admin User
  seedAdminUser();
  // Seed Default Templates
  seedDefaultTemplates();
  // Seed Gemini Settings
  seedGeminiSettings();

  logger.info('Database schema initialized successfully.');
}

function seedAdminUser(): void {
  const db = getDatabase();
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(env.ADMIN_EMAIL);

  if (!existingUser) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(env.ADMIN_PASSWORD, salt);

    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(
      env.ADMIN_EMAIL,
      passwordHash
    );

    logger.info({ email: env.ADMIN_EMAIL }, 'Seeded default admin user');
  }
}

function seedDefaultTemplates(): void {
  const db = getDatabase();

  // Check if Alaa's default Frontend Engineer template already exists
  const alaaEmailTmpl = db.prepare("SELECT id FROM templates WHERE name LIKE '%Frontend Engineer%' AND channel = 'email'").get() as { id: number } | undefined;

  if (!alaaEmailTmpl) {
    // Reset existing email defaults
    db.prepare("UPDATE templates SET is_default = 0 WHERE channel = 'email'").run();

    // 1. Primary Default: Alaa Abdullah Frontend Engineer Outreach Email
    db.prepare(`
      INSERT INTO templates (name, channel, subject, body, is_default)
      VALUES (?, ?, ?, ?, 1)
    `).run(
      'Frontend Engineer Application – Alaa Abdullah (Default)',
      'email',
      'Frontend Engineer Application – Alaa Abdullah | {{company_name}}',
      `<p>Hi {{person_name}},</p>

<p>I'm a Frontend Engineer with 3 years of production experience in <strong>React.js</strong>, <strong>Next.js</strong>, and <strong>TypeScript</strong>. I came across the Front-end role at <strong>{{company_name}}</strong> and wanted to reach out directly.</p>

<p>I've shipped production projects across e-commerce, SaaS, and enterprise platforms — always with a focus on performance, clean architecture, and end-to-end ownership. My recent work includes live platforms serving thousands of users built with the exact stack your role requires.</p>

<p>I'd welcome the opportunity to discuss how I can contribute to your team.</p>

<p style="margin: 24px 0 16px 0;">
  <a href="https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);">
    📄 View My Resume / CV
  </a>
</p>

<p style="font-size: 12px; color: #64748b;">
  Direct CV Link: <a href="https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link" style="color: #2563eb; text-decoration: underline;">https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link</a>
</p>

<p style="margin-top: 24px;">
Best regards,<br>
<strong>Alaa Abdullah</strong><br>
📞 <a href="tel:+201040353590" style="color: inherit; text-decoration: none;">+201040353590</a><br>
✉️ <a href="mailto:alaayasser2018@gmail.com" style="color: inherit; text-decoration: none;">alaayasser2018@gmail.com</a>
</p>`
    );
    logger.info("Seeded Alaa's default Frontend Engineer email template");
  }

  // Check if Alaa's default WhatsApp template exists
  const alaaWaTmpl = db.prepare("SELECT id FROM templates WHERE name LIKE '%Frontend Engineer%' AND channel = 'whatsapp'").get() as { id: number } | undefined;

  if (!alaaWaTmpl) {
    db.prepare("UPDATE templates SET is_default = 0 WHERE channel = 'whatsapp'").run();

    db.prepare(`
      INSERT INTO templates (name, channel, subject, body, is_default)
      VALUES (?, ?, ?, ?, 1)
    `).run(
      'Frontend Engineer Intro – Alaa Abdullah (WhatsApp)',
      'whatsapp',
      null,
      `Hello {{person_name}} 👋

I'm Alaa Abdullah, a Frontend Engineer with 3 years of production experience in React.js, Next.js, and TypeScript. I came across the Front-end role at {{company_name}} and wanted to reach out directly.

I've shipped production projects across e-commerce, SaaS, and enterprise platforms — always with a focus on performance, clean architecture, and end-to-end ownership. My recent work includes live platforms serving thousands of users built with the exact stack your role requires.

📄 My CV / Resume Link:
https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link

I'd welcome the opportunity to discuss how I can contribute to your team.

Best regards,
Alaa Abdullah
+201040353590`
    );
    logger.info("Seeded Alaa's default Frontend Engineer WhatsApp template");
  }
}

function seedGeminiSettings(): void {
  const db = getDatabase();
  const existingKey = db.prepare("SELECT value FROM app_settings WHERE key = 'gemini_api_key'").get();
  if (!existingKey && env.GEMINI_API_KEY) {
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('gemini_api_key', ?)").run(env.GEMINI_API_KEY);
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('gemini_model', ?)").run(env.GEMINI_MODEL || 'gemini-3.5-flash-lite');
    logger.info('Seeded Gemini API settings in database');
  }
}
