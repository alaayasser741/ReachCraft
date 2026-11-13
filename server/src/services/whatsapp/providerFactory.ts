import { WhatsAppProvider } from './whatsappProvider.js';
import { ClickToChatProvider } from './clickToChatProvider.js';
import { env } from '../../config/env.js';

let activeProvider: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (activeProvider) {
    return activeProvider;
  }

  // Click-to-chat is the safe default as requested in Section 6
  activeProvider = new ClickToChatProvider();
  return activeProvider;
}
