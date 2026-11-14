import {
  User,
  Company,
  Contact,
  Template,
  Campaign,
  CampaignRecipient,
  MessageLog,
  ActivityLog,
  AppSettings,
  ParseResult,
  ParsedCompany,
  SpamAnalysis,
  JobMatch,
  SpamFixResult,
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public message: string, public status?: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends httpOnly cookie
  });

  if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/me')) {
    window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }

  let data: any = {};
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) throw new ApiError(text || res.statusText, res.status);
    return text as unknown as T;
  }

  if (!res.ok || data.success === false) {
    throw new ApiError(data.error || 'Request failed', res.status, data.details);
  }

  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ success: boolean; user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request<{ success: boolean; user: User }>('/auth/me'),
  requestRegisterOtp: (data: { name: string; email: string; password: string; acceptTerms: boolean; language: 'ar' | 'en' }) =>
    request<{ success: boolean; message: string; devCode?: string }>('/auth/register-request-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyRegisterOtp: (data: { name: string; email: string; password: string; code: string }) =>
    request<{ success: boolean; user: User; token: string }>('/auth/register-verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  loginWithGoogle: (credential: string) =>
    request<{ success: boolean; user: User; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  completeOnboarding: (data: { gemini_api_key?: string; smtp_user?: string; smtp_pass?: string; smtp_from_name?: string; smtp_from_email?: string }) =>
    request<{ success: boolean; user: User; message: string }>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getIntegrations: () =>
    request<{
      success: boolean;
      integrations: {
        has_gemini_key: boolean;
        has_smtp_pass: boolean;
        smtp_user: string;
        smtp_from_name: string;
        smtp_from_email: string;
        updated_at: string | null;
      };
    }>('/auth/integrations'),

  // Super Admin
  getAdminStats: () =>
    request<{ success: boolean; stats: any }>('/admin/stats'),
  getAdminUsers: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ success: boolean; users: any[] }>(`/admin/users${q}`);
  },
  updateAdminUserPlan: (userId: number, plan: string) =>
    request<{ success: boolean; message: string }>(`/admin/users/${userId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    }),
  updateAdminUserStatus: (userId: number, status: 'active' | 'suspended') =>
    request<{ success: boolean; message: string }>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteAdminUser: (userId: number) =>
    request<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),
  // Admin Plans CRUD
  getAdminPlans: () =>
    request<{ success: boolean; plans: any[] }>('/admin/plans'),
  createAdminPlan: (data: any) =>
    request<{ success: boolean; message: string }>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminPlan: (id: string, data: any) =>
    request<{ success: boolean; message: string }>(`/admin/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteAdminPlan: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/plans/${id}`, {
      method: 'DELETE',
    }),
  // Admin Default Templates
  getAdminTemplates: () =>
    request<{ success: boolean; templates: any[] }>('/admin/templates'),
  createAdminTemplate: (data: { name: string; channel: 'email' | 'whatsapp'; subject?: string; body: string }) =>
    request<{ success: boolean; message: string; templateId: number }>('/admin/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminTemplate: (id: number, data: any) =>
    request<{ success: boolean; message: string }>(`/admin/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteAdminTemplate: (id: number) =>
    request<{ success: boolean; message: string }>(`/admin/templates/${id}`, {
      method: 'DELETE',
    }),
  // Admin Verified Contacts Pool
  getAdminVerifiedContacts: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ success: boolean; contacts: any[] }>(`/admin/verified-contacts${q}`);
  },
  createAdminVerifiedContact: (data: any) =>
    request<{ success: boolean; message: string }>('/admin/verified-contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeAdminVerifiedContact: (id: number) =>
    request<{ success: boolean; message: string }>(`/admin/verified-contacts/${id}`, {
      method: 'DELETE',
    }),
  // Admin Global Audit Logs
  getAdminLogs: (params?: { category?: string; action?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.action) q.set('action', params.action);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<{ success: boolean; logs: any[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/logs${qs}`);
  },

  // Files
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ success: boolean; fileId: number; parseResult: ParseResult }>('/files/upload', {
      method: 'POST',
      body: formData,
    });
  },
  getFile: (id: number) =>
    request<{ success: boolean; file: any }>('/files/' + id),
  getFiles: () =>
    request<{ success: boolean; files: any[] }>('/files'),
  confirmFileData: (fileId: number, companies: ParsedCompany[]) =>
    request<{ success: boolean; savedCompaniesCount: number; savedContactsCount: number }>(
      `/files/${fileId}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ companies }),
      }
    ),

  // Companies
  getCompanies: (params?: { search?: string; hasDirectContact?: number; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.hasDirectContact !== undefined) query.append('hasDirectContact', String(params.hasDirectContact));
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    return request<{
      success: boolean;
      count: number;
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
      companies: Company[];
    }>(`/companies?${query.toString()}`);
  },
  getCompany: (id: number) =>
    request<{ success: boolean; company: Company }>(`/companies/${id}`),
  updateCompany: (id: number, data: Partial<Company>) =>
    request<{ success: boolean }>(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCompany: (id: number) =>
    request<{ success: boolean }>(`/companies/${id}`, { method: 'DELETE' }),

  // Contacts
  getContacts: (params?: {
    search?: string;
    companyId?: number;
    hasEmail?: boolean;
    hasWhatsApp?: boolean;
    optedOut?: boolean;
    page?: number;
    limit?: number;
    pool?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.companyId) query.append('companyId', String(params.companyId));
    if (params?.hasEmail !== undefined) query.append('hasEmail', String(params.hasEmail));
    if (params?.hasWhatsApp !== undefined) query.append('hasWhatsApp', String(params.hasWhatsApp));
    if (params?.optedOut !== undefined) query.append('optedOut', String(params.optedOut));
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    if (params?.pool !== undefined) query.append('pool', String(params.pool));
    return request<{
      success: boolean;
      count: number;
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
      contacts: Contact[];
    }>(`/contacts?${query.toString()}`);
  },
  getContactStats: () =>
    request<{
      success: boolean;
      stats: {
        totalContacts: number;
        verifiedEmails: number;
        validWhatsApp: number;
        optedOut: number;
        totalCompanies: number;
        poolCount?: number;
      };
    }>('/contacts/stats'),
  getContact: (id: number) =>
    request<{ success: boolean; contact: Contact }>(`/contacts/${id}`),
  updateContact: (id: number, data: Partial<Contact>) =>
    request<{ success: boolean }>(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteContact: (id: number) =>
    request<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' }),
  exportContactsCsvUrl: () => `${API_BASE}/contacts/export/csv`,

  // Templates
  getTemplates: (channel?: 'email' | 'whatsapp') => {
    const query = channel ? `?channel=${channel}` : '';
    return request<{ success: boolean; templates: Template[] }>(`/templates${query}`);
  },
  getTemplate: (id: number) =>
    request<{ success: boolean; template: Template }>(`/templates/${id}`),
  createTemplate: (data: { name: string; channel: 'email' | 'whatsapp'; subject?: string; body: string }) =>
    request<{ success: boolean; templateId: number }>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplate: (id: number, data: Partial<Template>) =>
    request<{ success: boolean }>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTemplate: (id: number) =>
    request<{ success: boolean }>(`/templates/${id}`, { method: 'DELETE' }),
  setDefaultTemplate: (id: number) =>
    request<{ success: boolean; message: string }>(`/templates/${id}/set-default`, {
      method: 'POST',
    }),
  previewTemplate: (subject: string | null, body: string, variables?: any) =>
    request<{ success: boolean; renderedSubject: string | null; renderedBody: string }>('/templates/preview', {
      method: 'POST',
      body: JSON.stringify({ subject, body, variables }),
    }),

  // Campaigns
  getCampaigns: () =>
    request<{ success: boolean; campaigns: Campaign[] }>('/campaigns'),
  getCampaign: (id: number) =>
    request<{ success: boolean; campaign: Campaign; stats: Array<{ status: string; count: number }> }>(
      `/campaigns/${id}`
    ),
  getCampaignRecipients: (id: number) =>
    request<{ success: boolean; recipients: CampaignRecipient[] }>(`/campaigns/${id}/recipients`),
  getContactedRecipients: (channel?: 'email' | 'whatsapp') => {
    const query = channel ? `?channel=${channel}` : '';
    return request<{
      success: boolean;
      addresses: string[];
      contactIds: number[];
      details: Record<string, { lastSentAt: string; sendCount: number; channel: string }>;
    }>(`/campaigns/contacted-recipients${query}`);
  },
  createCampaign: (data: {
    name: string;
    channel: 'email' | 'whatsapp';
    template_id: number;
    is_dry_run: boolean;
    contact_ids: number[];
    exclude_previously_contacted?: boolean;
  }) =>
    request<{ success: boolean; campaignId: number; message?: string }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  startCampaign: (id: number) =>
    request<{ success: boolean }>(`/campaigns/${id}/start`, { method: 'POST' }),
  pauseCampaign: (id: number) =>
    request<{ success: boolean }>(`/campaigns/${id}/pause`, { method: 'POST' }),
  resumeCampaign: (id: number) =>
    request<{ success: boolean }>(`/campaigns/${id}/resume`, { method: 'POST' }),
  cancelCampaign: (id: number) =>
    request<{ success: boolean }>(`/campaigns/${id}/cancel`, { method: 'POST' }),
  deleteCampaign: (id: number) =>
    request<{ success: boolean; message?: string }>(`/campaigns/${id}`, { method: 'DELETE' }),
  testSend: (data: { channel: 'email' | 'whatsapp'; template_id: number; recipient_address: string }) =>
    request<{ success: boolean; message: string; clickToChatUrl?: string; error?: string }>(
      '/campaigns/test-send',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  sendDirect: (data: {
    channel: 'email' | 'whatsapp';
    recipient_address: string;
    person_name?: string;
    company_name?: string;
    job_title?: string;
    subject?: string;
    body: string;
    is_dry_run?: boolean;
    save_to_contacts?: boolean;
  }) =>
    request<{ success: boolean; message: string; clickToChatUrl?: string; error?: string }>(
      '/campaigns/send-direct',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // WhatsApp
  getWhatsAppStatus: () =>
    request<{ success: boolean; status: any }>('/whatsapp/status'),
  generateWhatsAppLink: (phone: string, message: string) =>
    request<{ success: boolean; url: string; resolvedText: string }>('/whatsapp/generate-link', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    }),

  // Logs
  getActivityLogs: (params?: {
    category?: string;
    action?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    allUsers?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.action) query.append('action', params.action);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    if (params?.allUsers) query.append('allUsers', 'true');
    return request<{
      success: boolean;
      count: number;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      activities: ActivityLog[];
    }>(`/logs/activity?${query.toString()}`);
  },
  getLogs: (params?: {
    campaignId?: number;
    channel?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    allUsers?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.campaignId) query.append('campaignId', String(params.campaignId));
    if (params?.channel) query.append('channel', params.channel);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    if (params?.allUsers) query.append('allUsers', 'true');
    return request<{
      success: boolean;
      count: number;
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
      logs: MessageLog[];
    }>(`/logs?${query.toString()}`);
  },
  getLogStats: (allUsers?: boolean) =>
    request<{ success: boolean; stats: any }>(allUsers ? '/logs/stats?allUsers=true' : '/logs/stats'),

  // Settings
  getSettings: () =>
    request<{ success: boolean; settings: AppSettings }>('/settings'),
  updateSettings: (data: Partial<AppSettings>) =>
    request<{ success: boolean }>('/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testSmtp: (data?: any) =>
    request<{ success: boolean; message: string }>('/settings/test-smtp', {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // Google Gemini AI
  getAiStatus: () =>
    request<{ success: boolean; configured: boolean; model: string }>('/ai/status'),
  testAiConnection: () =>
    request<{ success: boolean; model: string; responseTimeMs: number; message?: string }>(
      '/ai/test-connection',
      { method: 'POST' }
    ),
  personalizePitch: (data: {
    companyName: string;
    companyWebsite?: string;
    companyDescription?: string;
    role?: string;
    recipientName?: string;
  }) =>
    request<{ success: boolean; personalizedText: string }>('/ai/personalize', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  checkSpam: (data: { subject: string; body: string }) =>
    request<{ success: boolean; analysis: SpamAnalysis }>('/ai/spam-check', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  applySpamFixes: (data: {
    subject?: string;
    body: string;
    suggestions: string[];
    spamWordsFound?: string[];
    channel?: 'email' | 'whatsapp';
  }) =>
    request<{ success: boolean } & SpamFixResult>('/ai/apply-spam-fixes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateSubjects: (data: { companyName?: string; role?: string; context?: string }) =>
    request<{ success: boolean; subjects: string[] }>('/ai/generate-subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  matchJob: (data: { jobDescription: string; companyName?: string }) =>
    request<{ success: boolean; match: JobMatch }>('/ai/match-job', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Smart AI Inbox
  getInboxMessages: (params?: { category?: string; search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<{ success: boolean; messages: any[]; counts: any }>(`/inbox${qs}`);
  },
  syncInbox: (limit?: number) =>
    request<{ success: boolean; message: string; result: any }>('/inbox/sync', {
      method: 'POST',
      body: JSON.stringify({ limit: limit || 30 }),
    }),
  getInboxMessage: (id: number) =>
    request<{ success: boolean; message: any }>('/inbox/' + id),
  markInboxRead: (id: number, isRead: boolean) =>
    request<{ success: boolean; isRead: boolean }>('/inbox/' + id + '/read', {
      method: 'PATCH',
      body: JSON.stringify({ isRead }),
    }),
  draftInboxReply: (id: number, userInstructions?: string) =>
    request<{ success: boolean; draftReply: string }>('/inbox/' + id + '/draft-reply', {
      method: 'POST',
      body: JSON.stringify({ userInstructions }),
    }),
  sendInboxReply: (id: number, replyText: string) =>
    request<{ success: boolean; message: string }>('/inbox/' + id + '/send-reply', {
      method: 'POST',
      body: JSON.stringify({ replyText }),
    }),
  translateInboxMessage: (id: number, targetLang?: 'ar' | 'en') =>
    request<{
      success: boolean;
      translatedSubject: string;
      translatedBody: string;
      targetLang: 'ar' | 'en';
    }>('/inbox/' + id + '/translate', {
      method: 'POST',
      body: JSON.stringify({ targetLang }),
    }),
  deleteInboxMessage: (id: number) =>
    request<{ success: boolean; message: string }>('/inbox/' + id, {
      method: 'DELETE',
    }),
};
