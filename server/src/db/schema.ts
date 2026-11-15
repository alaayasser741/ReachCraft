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
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      auth_provider TEXT NOT NULL DEFAULT 'local',
      is_verified INTEGER NOT NULL DEFAULT 0,
      plan TEXT NOT NULL DEFAULT 'beta_free',
      status TEXT NOT NULL DEFAULT 'active',
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      terms_accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
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
      user_id INTEGER DEFAULT 1,
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
      user_id INTEGER DEFAULT 1,
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
      is_verified_pool INTEGER NOT NULL DEFAULT 0,
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
      user_id INTEGER DEFAULT 1,
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
      user_id INTEGER DEFAULT 1,
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
      user_id INTEGER DEFAULT 1,
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
      user_id INTEGER DEFAULT 1,
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

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      category TEXT NOT NULL,
      action TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activity_log_category ON activity_log(category);
    CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

    CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    CREATE INDEX IF NOT EXISTS idx_contacts_phone_mobile ON contacts(phone_mobile);
    CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_number ON contacts(whatsapp_number);
    CREATE INDEX IF NOT EXISTS idx_company_links_company_id ON company_links(company_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(campaign_id, status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_recipients_unique_contact ON campaign_recipients(campaign_id, contact_id);
    CREATE INDEX IF NOT EXISTS idx_message_log_campaign ON message_log(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_message_log_status_addr ON message_log(status, recipient_address);
    CREATE INDEX IF NOT EXISTS idx_message_log_contact_id ON message_log(contact_id);
    CREATE INDEX IF NOT EXISTS idx_unsubscribes_token ON unsubscribes(token);
    CREATE INDEX IF NOT EXISTS idx_unsubscribes_identifier ON unsubscribes(identifier);

    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT,
      invited_by INTEGER REFERENCES users(id),
      token TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL DEFAULT 'beta_free',
      custom_message TEXT,
      language TEXT NOT NULL DEFAULT 'ar',
      status TEXT NOT NULL DEFAULT 'sent',
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      accepted_at TEXT,
      expires_at TEXT NOT NULL DEFAULT (datetime('now', '+14 days')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
    CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
    CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

    CREATE TABLE IF NOT EXISTS user_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gemini_api_key_encrypted TEXT,
      gemini_api_key_iv TEXT,
      gemini_api_key_tag TEXT,
      smtp_host TEXT DEFAULT 'smtp.gmail.com',
      smtp_port INTEGER DEFAULT 465,
      smtp_secure INTEGER DEFAULT 1,
      smtp_user TEXT,
      smtp_pass_encrypted TEXT,
      smtp_pass_iv TEXT,
      smtp_pass_tag TEXT,
      smtp_from_name TEXT,
      smtp_from_email TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      daily_email_limit INTEGER NOT NULL,
      monthly_upload_limit INTEGER NOT NULL,
      max_contacts INTEGER NOT NULL,
      can_export_csv INTEGER NOT NULL DEFAULT 1,
      can_use_ai INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Run schema upgrades safely with try/catch for existing databases
  const userColumns = [
    { col: 'name', type: 'TEXT' },
    { col: 'role', type: "TEXT NOT NULL DEFAULT 'user'" },
    { col: 'auth_provider', type: "TEXT NOT NULL DEFAULT 'local'" },
    { col: 'is_verified', type: 'INTEGER NOT NULL DEFAULT 0' },
    { col: 'plan', type: "TEXT NOT NULL DEFAULT 'beta_free'" },
    { col: 'status', type: "TEXT NOT NULL DEFAULT 'active'" },
    { col: 'onboarding_completed', type: 'INTEGER NOT NULL DEFAULT 0' },
    { col: 'terms_accepted_at', type: 'TEXT' },
  ];

  userColumns.forEach(({ col, type }) => {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} ${type}`);
    } catch {}
  });

  const tenantTables = [
    'uploaded_files',
    'companies',
    'contacts',
    'campaigns',
    'templates',
    'message_log',
    'inbox_messages',
    'activity_log',
  ];

  tenantTables.forEach((table) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER DEFAULT 1`);
    } catch {}
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_user_id ON ${table}(user_id)`);
    } catch {}
  });

  try {
    db.exec('ALTER TABLE templates ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0');
  } catch {}

  try {
    db.exec('ALTER TABLE contacts ADD COLUMN is_verified_pool INTEGER NOT NULL DEFAULT 0');
    db.exec('CREATE INDEX IF NOT EXISTS idx_contacts_verified_pool ON contacts(is_verified_pool)');
  } catch {}

  try {
    db.exec('ALTER TABLE campaigns ADD COLUMN pause_reason TEXT');
  } catch {}

  // Multi-tenant indexes upgrade: drop old global indexes, ensure user-scoped unique indexes
  try {
    db.exec(`
      DROP INDEX IF EXISTS idx_companies_unique_name;
      DROP INDEX IF EXISTS idx_contacts_unique_email;
      DROP INDEX IF EXISTS idx_contacts_unique_phone;
      DROP INDEX IF EXISTS idx_contacts_unique_wa;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_user_name ON companies(LOWER(TRIM(name)), user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_email ON contacts(LOWER(email), user_id) WHERE email IS NOT NULL AND email != '';
      CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_phone ON contacts(phone_mobile, user_id) WHERE phone_mobile IS NOT NULL AND phone_mobile != '';
      CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_wa ON contacts(whatsapp_number, user_id) WHERE whatsapp_number IS NOT NULL AND whatsapp_number != '';
    `);
  } catch (err) {
    logger.warn({ err }, 'Note while updating unique indexes');
  }

  // Seed Admin User
  seedAdminUser();
  // Seed Plans
  seedPlans();
  // Seed Default Templates
  seedDefaultTemplates();
  // Seed Gemini Settings
  seedGeminiSettings();
  // Clean up any test seed data as requested
  cleanupTestData();

  logger.info('Database schema initialized successfully.');
}

function seedPlans(): void {
  const db = getDatabase();
  const insertPlan = db.prepare(`
    INSERT OR IGNORE INTO plans (id, name_ar, name_en, daily_email_limit, monthly_upload_limit, max_contacts, can_export_csv, can_use_ai)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPlan.run('beta_free', 'النسخة التجريبية المجانية', 'Beta Free Access', 50, 10, 500, 1, 1);
  insertPlan.run('pro', 'الباقة المتقدمة', 'Pro Growth', 500, 100, 5000, 1, 1);
  insertPlan.run('unlimited', 'غير محدود (إدارة النظام)', 'Unlimited Admin', 10000, 1000, 100000, 1, 1);
}

function seedAdminUser(): void {
  const db = getDatabase();
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(env.ADMIN_PASSWORD, salt);

  // If old demo admin@outreach.local exists, seamlessly migrate to new admin email
  const legacyAdmin = db.prepare("SELECT id FROM users WHERE email = 'admin@outreach.local'").get() as { id: number } | undefined;
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(env.ADMIN_EMAIL) as { id: number } | undefined;

  if (legacyAdmin && !existingUser) {
    db.prepare(`
      UPDATE users 
      SET email = ?,
          password_hash = ?,
          name = 'Alaa Abdullah (Admin)',
          role = 'super_admin',
          is_verified = 1,
          plan = 'unlimited',
          onboarding_completed = 1,
          status = 'active'
      WHERE id = ?
    `).run(env.ADMIN_EMAIL, passwordHash, legacyAdmin.id);
    logger.info({ email: env.ADMIN_EMAIL }, 'Migrated admin account to new production email and password');
    return;
  }

  if (legacyAdmin && existingUser && legacyAdmin.id !== existingUser.id) {
    db.prepare("DELETE FROM users WHERE email = 'admin@outreach.local'").run();
  }

  if (!existingUser) {
    db.prepare(`
      INSERT INTO users (email, password_hash, name, role, is_verified, plan, onboarding_completed, status)
      VALUES (?, ?, ?, 'super_admin', 1, 'unlimited', 1, 'active')
    `).run(
      env.ADMIN_EMAIL,
      passwordHash,
      'Alaa Abdullah (Admin)'
    );

    logger.info({ email: env.ADMIN_EMAIL }, 'Seeded default admin user');
  } else {
    // Ensure existing user has super_admin role and updated password
    db.prepare(`
      UPDATE users 
      SET password_hash = ?,
          role = 'super_admin',
          name = COALESCE(name, 'Alaa Abdullah (Admin)'),
          is_verified = 1,
          plan = 'unlimited',
          onboarding_completed = 1,
          status = 'active'
      WHERE id = ?
    `).run(passwordHash, existingUser.id);
  }
}

function seedDefaultTemplates(): void {
  const db = getDatabase();

  // 1. Purge legacy personal / hardcoded templates (Alaa / Frontend Engineer)
  db.prepare("DELETE FROM templates WHERE name LIKE '%Alaa%' OR name LIKE '%Frontend Engineer%' OR body LIKE '%Alaa Abdullah%'").run();

  // 2. Seed Universal B2B Default Email Template (English)
  const defaultEmailTmpl = db.prepare("SELECT id FROM templates WHERE name LIKE '%B2B Partnership%' AND channel = 'email'").get() as { id: number } | undefined;

  if (!defaultEmailTmpl) {
    db.prepare("UPDATE templates SET is_default = 0 WHERE channel = 'email'").run();

    db.prepare(`
      INSERT INTO templates (name, channel, subject, body, is_default)
      VALUES (?, ?, ?, ?, 1)
    `).run(
      'B2B Partnership & Business Development (Email Default)',
      'email',
      'Exploring Partnership | {{company_name}} & {{sender_company}}',
      `<p>Hi {{person_name}},</p>

<p>I hope this email finds you well.</p>

<p>I'm reaching out from <strong>{{sender_company}}</strong>. We've been following <strong>{{company_name}}</strong>'s growth and track record in the industry and see strong alignment between our offerings.</p>

<p>We help businesses like yours streamline operations, accelerate market reach, and establish valuable strategic partnerships across key regional markets.</p>

<p>Would you be open to a brief 10-minute introductory call next week to see how we might collaborate?</p>

<p>Best regards,<br>
<strong>{{sender_name}}</strong><br>
{{sender_title}}<br>
{{sender_company}}<br>
✉️ {{sender_email}} | 📞 {{sender_phone}}</p>`
    );
    logger.info('Seeded universal B2B Partnership default email template');
  }

  // 3. Seed Arabic B2B Email Template
  const arEmailTmpl = db.prepare("SELECT id FROM templates WHERE name LIKE '%شراكة تجارية%' AND channel = 'email'").get() as { id: number } | undefined;
  if (!arEmailTmpl) {
    db.prepare(`
      INSERT INTO templates (name, channel, subject, body, is_default)
      VALUES (?, ?, ?, ?, 0)
    `).run(
      'شراكة تجارية وتواصل أعمال (عربي)',
      'email',
      'فرصة تعاون تجاري واعدة مع {{company_name}}',
      `<p>السيد / السيدة {{person_name}} المحترم،</p>

<p>تحية طيبة وبعد،</p>

<p>نتواصل معكم من شركة <strong>{{sender_company}}</strong> لمتابعة فرص التعاون والعمل المشترك مع <strong>{{company_name}}</strong>.</p>

<p>نحن متخصصون في مساعدة الشركات والمؤسسات الرائدة على توسيع شبكة أعمالها وفتح آفاق شراكات تجارية واستراتيجية مثمرة تلبي تطلعاتكم التوسعية.</p>

<p>يسعدنا ترتيب اتصال تعريفي موجز (10 دقائق) خلال هذا الأسبوع لبحث سبل العمل المشترك التي تعود بالنفع على الطرفين.</p>

<p>مع خالص التحية والتقدير،<br>
<strong>{{sender_name}}</strong><br>
{{sender_title}}<br>
{{sender_company}}<br>
✉️ {{sender_email}} | 📞 {{sender_phone}}</p>`
    );
    logger.info('Seeded Arabic B2B Partnership email template');
  }

  // 4. Seed Universal B2B Default WhatsApp Template (English)
  const defaultWaTmpl = db.prepare("SELECT id FROM templates WHERE name LIKE '%B2B Quick Intro%' AND channel = 'whatsapp'").get() as { id: number } | undefined;

  if (!defaultWaTmpl) {
    db.prepare("UPDATE templates SET is_default = 0 WHERE channel = 'whatsapp'").run();

    db.prepare(`
      INSERT INTO templates (name, channel, subject, body, is_default)
      VALUES (?, ?, ?, ?, 1)
    `).run(
      'B2B Quick Intro (WhatsApp Default)',
      'whatsapp',
      null,
      `Hello {{person_name}} 👋

I'm reaching out from {{sender_company}}. We've been following {{company_name}}'s work and would love to explore a quick partnership opportunity.

Do you have a few minutes this week for a brief introductory chat?

Best regards,
{{sender_name}}
{{sender_company}}`
    );
    logger.info('Seeded universal B2B Quick Intro WhatsApp template');
  }

  // 5. Seed Arabic WhatsApp Template
  const arWaTmpl = db.prepare("SELECT id FROM templates WHERE name LIKE '%تواصل أعمال سريع%' AND channel = 'whatsapp'").get() as { id: number } | undefined;
  if (!arWaTmpl) {
    db.prepare(`
      INSERT INTO templates (name, channel, subject, body, is_default)
      VALUES (?, ?, ?, ?, 0)
    `).run(
      'تواصل أعمال سريع عبر واتساب (عربي)',
      'whatsapp',
      null,
      `مرحباً أستاذ {{person_name}} 👋

نتواصل معكم من شركة {{sender_company}}. نتابع باهتمام نجاحات {{company_name}} في السوق، ويسعدنا بحث سبل التعاون والعمل المشترك بيننا.

هل يناسبكم اتصال تعريفي موجز خلال هذا الأسبوع؟

مع أطيب التحيات،
{{sender_name}}
{{sender_company}}`
    );
    logger.info('Seeded Arabic B2B WhatsApp template');
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

function cleanupTestData(): void {
  const db = getDatabase();
  try {
    db.exec(`
      DELETE FROM campaign_recipients;
      DELETE FROM message_log;
      DELETE FROM campaigns;
      DELETE FROM contacts;
      DELETE FROM company_links;
      DELETE FROM companies;
      DELETE FROM uploaded_files;
      DELETE FROM inbox_messages;
      DELETE FROM activity_log;
    `);
    logger.info('Cleaned test data from database.');
  } catch (err) {
    logger.warn({ err }, 'Failed to clean test data');
  }
}
