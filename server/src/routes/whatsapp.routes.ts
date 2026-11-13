import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { getWhatsAppProvider } from '../services/whatsapp/providerFactory.js';
import { resolveSpintax } from '../services/whatsapp/clickToChatProvider.js';

const router = Router();

// GET /api/whatsapp/status
router.get('/status', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  const provider = getWhatsAppProvider();
  const status = await provider.getStatus();
  res.json({ success: true, status });
});

// GET /api/whatsapp/qr
router.get('/qr', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  const provider = getWhatsAppProvider();
  const status = await provider.getStatus();
  res.json({
    success: true,
    qrCode: status.qrCode || null,
    message: status.provider === 'click-to-chat'
      ? 'Click-to-chat safe mode is active. No QR scan is needed (zero ban risk).'
      : 'Scan QR with WhatsApp to link session.',
  });
});

// POST /api/whatsapp/generate-link
const generateLinkSchema = z.object({
  phone: z.string().min(5),
  message: z.string().min(1),
});

router.post('/generate-link', requireAuth, (req: AuthRequest, res: Response): void => {
  const parseResult = generateLinkSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Invalid input' });
    return;
  }

  const { phone, message } = parseResult.data;
  const provider = getWhatsAppProvider();
  const resolved = resolveSpintax(message);
  const url = provider.generateClickToChatUrl(phone, resolved);

  res.json({
    success: true,
    url,
    resolvedText: resolved,
  });
});

export default router;
