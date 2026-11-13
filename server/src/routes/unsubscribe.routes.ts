import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/connection.js';

const router = Router();

// GET /unsubscribe/:token (Public endpoint)
router.get('/:token', (req: Request, res: Response): void => {
  const { token } = req.params;
  const db = getDatabase();

  const record = db.prepare('SELECT identifier, channel FROM unsubscribes WHERE token = ?').get(token) as
    | { identifier: string; channel: string }
    | undefined;

  if (!record) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invalid Link</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 440px; text-align: center; }
          h1 { color: #e11d48; margin-top: 0; font-size: 22px; }
          p { color: #64748b; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Invalid or Expired Link</h1>
          <p>We could not find an active subscription associated with this link.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // Mark all contacts matching this email or phone as opted out permanently
  db.prepare(`
    UPDATE contacts 
    SET opted_out = 1, opted_out_at = datetime('now') 
    WHERE email = ? OR phone_mobile = ? OR whatsapp_number = ?
  `).run(record.identifier, record.identifier, record.identifier);

  // Return elegant human response
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unsubscribed Successfully</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
        .card { background: white; padding: 48px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); max-width: 480px; text-align: center; border: 1px solid #e2e8f0; }
        .icon { width: 56px; height: 56px; background: #ecfdf5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 28px; }
        h1 { margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #0f172a; }
        p { color: #64748b; line-height: 1.6; font-size: 15px; margin: 0 0 24px 0; }
        .badge { display: inline-block; background: #f1f5f9; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 500; color: #334155; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✓</div>
        <h1>You have been unsubscribed</h1>
        <p>Your address has been removed and added to our exclusion list. You will not receive future marketing messages from this sender.</p>
        <span class="badge">${record.identifier}</span>
      </div>
    </body>
    </html>
  `);
});

export default router;
