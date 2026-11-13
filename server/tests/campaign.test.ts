import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/schema.js';
import { env } from '../src/config/env.js';
import { getDatabase } from '../src/db/connection.js';

describe('Campaigns & Queue Engine Integration', () => {
  const app = createApp();
  let authToken: string;

  beforeAll(async () => {
    runMigrations();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
    authToken = loginRes.body.token;

    // Ensure we have at least one test company & contact
    const db = getDatabase();
    db.prepare("DELETE FROM contacts WHERE email IN ('alice@acme-global.com', 'bob@acme-global.com') OR phone_mobile IN ('+201012345678', '+201198765432')").run();

    const compRes = db.prepare(`
      INSERT INTO companies (name, website, description, has_direct_contact)
      VALUES ('Acme Corp Global', 'https://acme-global.com', 'Innovative Cloud Solutions', 1)
    `).run();
    const compId = Number(compRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO contacts (company_id, person_name, job_title, email, phone_mobile, whatsapp_number, is_valid_email, is_valid_whatsapp, opted_out)
      VALUES (?, 'Alice Wonderland', 'Chief Architect', 'alice@acme-global.com', '+201012345678', '+201012345678', 1, 1, 0)
    `).run(compId);

    db.prepare(`
      INSERT INTO contacts (company_id, person_name, job_title, email, phone_mobile, whatsapp_number, is_valid_email, is_valid_whatsapp, opted_out)
      VALUES (?, 'Bob OptedOut', 'Security Lead', 'bob@acme-global.com', '+201198765432', '+201198765432', 1, 1, 1)
    `).run(compId);
  });

  it('Creates and executes a dry-run email campaign with opt-out exclusion', async () => {
    const db = getDatabase();
    const contacts = db.prepare('SELECT id, email, opted_out FROM contacts ORDER BY id DESC LIMIT 2').all() as any[];
    const contactIds = contacts.map((c) => c.id);

    // Get default template
    const template = db.prepare("SELECT id FROM templates WHERE channel = 'email' LIMIT 1").get() as { id: number };

    // 1. Create campaign
    const createRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Q4 B2B Partnership Reach (Dry Run)',
        channel: 'email',
        template_id: template.id,
        is_dry_run: true,
        contact_ids: contactIds,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const campaignId = createRes.body.campaignId;

    // 2. Start campaign
    const startRes = await request(app)
      .post(`/api/campaigns/${campaignId}/start`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(startRes.status).toBe(200);

    // Wait 250ms for queue to process dry-run
    await new Promise((resolve) => setTimeout(resolve, 250));

    // 3. Check campaign status
    const statusRes = await request(app)
      .get(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusRes.status).toBe(200);
    expect(['done', 'running']).toContain(statusRes.body.campaign.status);

    // 4. Verify recipients: Alice was sent, Bob (opted_out) was skipped
    const recipientsRes = await request(app)
      .get(`/api/campaigns/${campaignId}/recipients`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(recipientsRes.status).toBe(200);
    const recipients = recipientsRes.body.recipients;

    const alice = recipients.find((r: any) => r.email === 'alice@acme-global.com');
    const bob = recipients.find((r: any) => r.email === 'bob@acme-global.com');

    expect(alice.status).toBe('sent');
    expect(bob.status).toBe('skipped');
    expect(bob.error).toContain('opted out');

    // 5. Verify message_log
    const logRes = await request(app)
      .get(`/api/logs?campaignId=${campaignId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(logRes.status).toBe(200);
    expect(logRes.body.logs.length).toBeGreaterThan(0);
    expect(logRes.body.logs[0].status).toBe('dry_run');
  });
});
