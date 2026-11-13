import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/schema.js';
import { env } from '../src/config/env.js';

describe('Auth & Database Setup', () => {
  const app = createApp();

  beforeAll(() => {
    runMigrations();
  });

  it('Health endpoint returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('Fails login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: env.ADMIN_EMAIL, password: 'wrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Succeeds login with admin credentials and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(env.ADMIN_EMAIL);

    // Verify /api/auth/me with Bearer token
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(env.ADMIN_EMAIL);
  });
});
