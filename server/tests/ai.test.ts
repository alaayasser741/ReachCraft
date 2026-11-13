import { describe, it, expect, beforeAll } from 'vitest';
import { runMigrations } from '../src/db/schema.js';
import { geminiService } from '../src/services/ai/gemini.service.js';
import { campaignQueue } from '../src/services/queue/jobQueue.js';
import { getDatabase } from '../src/db/connection.js';

describe('Gemini AI & Circuit Breaker Protection System', () => {
  beforeAll(() => {
    runMigrations();
  });

  it('Verifies Google AI Studio Gemini connection with the provided key', async () => {
    const res = await geminiService.testConnection();
    expect(res.success).toBe(true);
    expect(res.model).toBeDefined();
    expect(res.responseTimeMs).toBeGreaterThan(0);
  }, 15000);

  it('Evaluates email deliverability and spam score accurately', async () => {
    const analysis = await geminiService.checkSpamAndDeliverability({
      subject: 'Frontend Engineer Application – Alaa Abdullah | Acme',
      body: 'Hi John, I am reaching out regarding your React role. Here is my CV: https://drive.google.com/file/d/123',
    });

    expect(typeof analysis.score).toBe('number');
    expect(analysis.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score).toBeLessThanOrEqual(100);
    expect(['excellent', 'good', 'risky']).toContain(analysis.verdict);
    expect(Array.isArray(analysis.suggestions)).toBe(true);
  }, 15000);

  it('Pauses campaign with an explanatory reason when circuit breaker trips', () => {
    const db = getDatabase();
    
    // Create a mock campaign
    const tmpl = db.prepare('SELECT id FROM templates LIMIT 1').get() as { id: number };
    const result = db.prepare(`
      INSERT INTO campaigns (name, channel, template_id, status)
      VALUES ('Test Protection Campaign', 'email', ?, 'running')
    `).run(tmpl.id);
    const campaignId = Number(result.lastInsertRowid);

    // Trip circuit breaker manually
    const reason = 'قاطع الدائرة الذكي (Circuit Breaker): تم اكتشاف خطأ في الكوتة. تم الإيقاف لحماية الحساب من الحظر.';
    campaignQueue.pauseCampaign(campaignId, reason);

    const paused = db.prepare('SELECT status, pause_reason FROM campaigns WHERE id = ?').get(campaignId) as {
      status: string;
      pause_reason: string;
    };

    expect(paused.status).toBe('paused');
    expect(paused.pause_reason).toContain('Circuit Breaker');

    // Resuming campaign clears pause_reason
    campaignQueue.resumeCampaign(campaignId);
    const resumed = db.prepare('SELECT status, pause_reason FROM campaigns WHERE id = ?').get(campaignId) as {
      status: string;
      pause_reason: string | null;
    };

    expect(['running', 'done']).toContain(resumed.status);
    expect(resumed.pause_reason).toBeNull();
  });
});
