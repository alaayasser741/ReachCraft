export interface WhatsAppMessage {
  to: string; // E.164 phone number
  text: string;
  contactId?: number;
  companyId?: number;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  clickToChatUrl?: string;
  error?: string;
  isRateLimitError?: boolean;
}

export interface WhatsAppStatus {
  provider: 'click-to-chat' | 'session' | 'cloud';
  connected: boolean;
  qrCode?: string | null;
  phoneNumber?: string | null;
  warmupMode: boolean;
  dailySentCount: number;
  dailyCap: number;
}

export interface WhatsAppProvider {
  name: string;
  sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
  getStatus(): Promise<WhatsAppStatus>;
  generateClickToChatUrl(phone: string, message: string): string;
}
