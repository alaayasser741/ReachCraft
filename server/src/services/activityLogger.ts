import { getDatabase } from '../db/connection.js';

export interface LogActivityParams {
  category: 'campaign' | 'contact' | 'company' | 'message' | 'file' | 'template' | 'auth' | 'settings';
  action: 'create' | 'update' | 'delete' | 'start' | 'pause' | 'resume' | 'cancel' | 'send' | 'upload' | 'confirm' | 'login' | 'logout' | 'import';
  title: string;
  details?: Record<string, any> | string | null;
  status?: 'success' | 'warning' | 'failed' | 'info';
  ip?: string | null;
}

export function logActivity(params: LogActivityParams): void {
  try {
    const db = getDatabase();
    const detailsStr =
      params.details && typeof params.details === 'object'
        ? JSON.stringify(params.details)
        : params.details || null;

    db.prepare(`
      INSERT INTO activity_log (category, action, title, details, status, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      params.category,
      params.action,
      params.title,
      detailsStr,
      params.status || 'success',
      params.ip || null
    );
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}
