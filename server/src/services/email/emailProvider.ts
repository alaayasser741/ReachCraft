export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  unsubscribeUrl?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isQuotaOrAuthError?: boolean;
}

export interface EmailProvider {
  name: string;
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
  verifyConnection(): Promise<{ success: boolean; error?: string }>;
}
