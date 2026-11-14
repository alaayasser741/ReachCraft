export interface User {
  id: number;
  email: string;
  name?: string;
  role?: 'super_admin' | 'user';
  plan?: 'beta_free' | 'pro' | 'unlimited';
  is_verified?: number;
  onboarding_completed?: number;
  status?: string;
}

export interface ParsedLink {
  type: 'website' | 'linkedin' | 'instagram' | 'facebook' | 'x' | 'qr_link' | 'careers' | 'other';
  url: string;
}

export interface ParsedContact {
  id?: string;
  personName: string | null;
  jobTitle: string | null;
  email: string | null;
  phoneMobile: string | null;
  phoneLandline: string | null;
  whatsappNumber: string | null;
  address: string | null;
  isValidEmail: boolean;
  isValidWhatsApp: boolean;
  optedOut: boolean;
  notes: string | null;
}

export interface ParsedCompany {
  id?: string;
  headingNumber: number | null;
  name: string;
  website: string | null;
  description: string | null;
  address: string | null;
  contacts: ParsedContact[];
  links: ParsedLink[];
  hasDirectContact: boolean;
  anomalies: string[];
  status: 'valid' | 'warning' | 'no_direct_contact';
  isExcluded?: boolean;
}

export interface ParseResult {
  filename: string;
  totalCompanies: number;
  totalContacts: number;
  contactsWithEmail: number;
  contactsWithWhatsApp: number;
  companiesNoDirectContact: number;
  totalAnomalies: number;
  companies: ParsedCompany[];
  missingNumbers: number[];
  duplicateNumbers: number[];
}

export interface Company {
  id: number;
  name: string;
  website: string | null;
  description: string | null;
  address: string | null;
  source_file_id: number | null;
  has_direct_contact: number;
  created_at: string;
  contact_count?: number;
  link_count?: number;
  contacts?: Contact[];
  links?: ParsedLink[];
}

export interface Contact {
  id: number;
  company_id: number;
  company_name?: string;
  company_website?: string | null;
  person_name: string | null;
  job_title: string | null;
  email: string | null;
  phone_mobile: string | null;
  phone_landline: string | null;
  whatsapp_number: string | null;
  address: string | null;
  is_valid_email: number;
  is_valid_whatsapp: number;
  opted_out: number;
  is_verified_pool?: number;
  user_id?: number;
  notes: string | null;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  channel: 'email' | 'whatsapp';
  subject: string | null;
  body: string;
  is_default?: number;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  channel: 'email' | 'whatsapp';
  template_id: number;
  template_name?: string;
  template_subject?: string | null;
  template_body?: string;
  status: 'draft' | 'running' | 'paused' | 'done' | 'cancelled';
  pause_reason?: string | null;
  is_dry_run: number;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CampaignRecipient {
  id: number;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  error: string | null;
  retry_count: number;
  sent_at: string | null;
  person_name: string | null;
  job_title: string | null;
  email: string | null;
  phone_mobile: string | null;
  whatsapp_number: string | null;
  company_name: string;
}

export interface MessageLog {
  id: number;
  campaign_id: number | null;
  campaign_name?: string | null;
  contact_id: number | null;
  person_name?: string | null;
  company_name?: string | null;
  channel: 'email' | 'whatsapp';
  recipient_address: string;
  subject: string | null;
  rendered_body: string;
  status: 'sent' | 'failed' | 'dry_run' | 'skipped';
  error: string | null;
  provider_response: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  category: 'campaign' | 'contact' | 'company' | 'message' | 'file' | 'template' | 'auth' | 'settings';
  action: 'create' | 'update' | 'delete' | 'start' | 'pause' | 'resume' | 'cancel' | 'send' | 'upload' | 'confirm' | 'login' | 'logout' | 'import';
  title: string;
  details: string | null;
  status: 'success' | 'warning' | 'failed' | 'info';
  ip_address: string | null;
  created_at: string;
}

export interface AppSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_has_pass: boolean;
  smtp_from_name: string;
  smtp_from_email: string;
  email_daily_cap: number;
  email_min_interval: number;
  email_max_interval: number;
  whatsapp_provider: 'click-to-chat' | 'session' | 'cloud';
  whatsapp_daily_cap: number;
  whatsapp_warmup: boolean;
  gemini_api_key?: string;
  gemini_has_key?: boolean;
  gemini_model?: string;
}

export interface SpamAnalysis {
  score: number;
  verdict: 'excellent' | 'good' | 'risky';
  spamWordsFound: string[];
  strengths: string[];
  suggestions: string[];
}

export interface JobMatch {
  matchScore: number;
  keyMatchingSkills: string[];
  tailoredOpening: string;
  suggestedSubject: string;
}

export interface SpamFixResult {
  improvedSubject: string;
  improvedBody: string;
  explanation: string;
  newScore: number;
}

export type EmailCategory = 'hr_interview' | 'company_update' | 'direct_reply' | 'job_alert' | 'rejection' | 'general';
export type EmailPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface InboxMessage {
  id: number;
  message_uid: string;
  from_name: string;
  from_email: string;
  subject: string;
  snippet: string;
  body_html?: string;
  body_text?: string;
  date: string;
  is_read: number;
  ai_category: EmailCategory;
  ai_summary: string;
  ai_priority: EmailPriority;
  ai_suggested_reply?: string;
  created_at: string;
}

export interface InboxCounts {
  all: number;
  unread: number;
  hr_interview: number;
  company_update: number;
  direct_reply: number;
}
