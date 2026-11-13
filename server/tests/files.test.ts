import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/schema.js';
import { env } from '../src/config/env.js';
import { getDatabase } from '../src/db/connection.js';

describe('File Upload & Confirm Flow', () => {
  const app = createApp();
  let authToken: string;
  const samplePdfPath = path.resolve(__dirname, '../fixtures/sample_exhibition_contacts.pdf');

  beforeAll(async () => {
    runMigrations();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
    authToken = loginRes.body.token;
  });

  it('Uploads and parses sample exhibition contacts PDF', async () => {
    const res = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', samplePdfPath);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fileId).toBeDefined();
    expect(res.body.parseResult).toBeDefined();
    expect(res.body.parseResult.totalCompanies).toBeGreaterThanOrEqual(68);

    const fileId = res.body.fileId;
    const companies = res.body.parseResult.companies;

    // Milestone 4: Confirm and save to DB
    const confirmRes = await request(app)
      .post(`/api/files/${fileId}/confirm`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ companies });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.savedCompaniesCount).toBeGreaterThanOrEqual(68);

    // Verify in database directly
    const db = getDatabase();
    const compCount = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count;
    const contactCount = (db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number }).count;

    expect(compCount).toBeGreaterThanOrEqual(68);
    expect(contactCount).toBeGreaterThan(0);
  });

  it('Re-confirming the same file data does not duplicate companies or contacts', async () => {
    const db = getDatabase();
    const initialCompCount = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count;
    const initialContactCount = (db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number }).count;

    // Upload file again
    const res = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', samplePdfPath);

    const fileId = res.body.fileId;
    const companies = res.body.parseResult.companies;

    // Confirm again
    const confirmRes = await request(app)
      .post(`/api/files/${fileId}/confirm`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ companies });

    expect(confirmRes.status).toBe(200);

    // Verify company count and contact count did NOT multiply
    const finalCompCount = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count;
    const finalContactCount = (db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number }).count;

    expect(finalCompCount).toBe(initialCompCount);
    expect(finalContactCount).toBe(initialContactCount);
  });
});
