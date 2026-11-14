import { getDatabase } from '../db/connection.js';

export interface LogActivityParams {
  category: 'campaign' | 'contact' | 'company' | 'message' | 'file' | 'template' | 'auth' | 'settings' | 'admin';
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'start'
    | 'pause'
    | 'resume'
    | 'cancel'
    | 'send'
    | 'upload'
    | 'confirm'
    | 'login'
    | 'logout'
    | 'import'
    | 'register'
    | 'register_google'
    | 'login_google'
    | 'change_plan'
    | 'change_status'
    | 'delete_user'
    | 'onboarding_complete'
    | 'create_plan'
    | 'update_plan'
    | 'delete_plan'
    | 'create_default_template'
    | 'update_default_template'
    | 'delete_default_template'
    | 'add_verified_contact'
    | 'remove_verified_contact'
    | 'system_init'
    | 'info';
  title: string;
  details?: Record<string, any> | string | null;
  status?: 'success' | 'warning' | 'failed' | 'info';
  ip?: string | null;
  userId?: number | null;
}

export function logActivity(params: LogActivityParams): void {
  try {
    const db = getDatabase();
    const detailsStr =
      params.details && typeof params.details === 'object'
        ? JSON.stringify(params.details)
        : params.details || null;

    db.prepare(`
      INSERT INTO activity_log (category, action, title, details, status, ip_address, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      params.category,
      params.action,
      params.title,
      detailsStr,
      params.status || 'success',
      params.ip || null,
      params.userId || null
    );
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}
