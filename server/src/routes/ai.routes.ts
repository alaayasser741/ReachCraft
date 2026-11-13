import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { geminiService } from '../services/ai/gemini.service.js';

const router = Router();

// GET /api/ai/status
router.get('/status', requireAuth, (_req: AuthRequest, res: Response): void => {
  const hasKey = Boolean(geminiService.getApiKey());
  const model = geminiService.getModel();
  res.json({
    success: true,
    configured: hasKey,
    model,
  });
});

// POST /api/ai/test-connection
router.post('/test-connection', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await geminiService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Test failed' });
  }
});

// POST /api/ai/personalize
const personalizeSchema = z.object({
  companyName: z.string().default('Target Company'),
  companyWebsite: z.string().optional(),
  companyDescription: z.string().optional(),
  role: z.string().optional(),
  recipientName: z.string().optional(),
});

router.post('/personalize', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = personalizeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.format() });
    return;
  }

  try {
    const personalizedText = await geminiService.personalizePitch(parsed.data);
    res.json({ success: true, personalizedText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'AI personalization failed' });
  }
});

// POST /api/ai/spam-check
const spamCheckSchema = z.object({
  subject: z.string().default(''),
  body: z.string().min(1, 'Body is required'),
});

router.post('/spam-check', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = spamCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.format() });
    return;
  }

  try {
    const analysis = await geminiService.checkSpamAndDeliverability(parsed.data);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Spam analysis failed' });
  }
});

// POST /api/ai/apply-spam-fixes
const applySpamFixesSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, 'Body is required'),
  suggestions: z.array(z.string()).default([]),
  spamWordsFound: z.array(z.string()).optional(),
  channel: z.enum(['email', 'whatsapp']).optional(),
});

router.post('/apply-spam-fixes', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = applySpamFixesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.format() });
    return;
  }

  try {
    const fixResult = await geminiService.applySpamFixes(parsed.data);
    res.json({ success: true, ...fixResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Applying spam fixes failed' });
  }
});

// POST /api/ai/generate-subjects
const subjectsSchema = z.object({
  companyName: z.string().optional(),
  role: z.string().optional(),
  context: z.string().optional(),
});

router.post('/generate-subjects', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = subjectsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed' });
    return;
  }

  try {
    const subjects = await geminiService.generateSubjectLines(parsed.data);
    res.json({ success: true, subjects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Generating subjects failed' });
  }
});

// POST /api/ai/match-job
const matchJobSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  companyName: z.string().optional(),
});

router.post('/match-job', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = matchJobSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Job description is required' });
    return;
  }

  try {
    const match = await geminiService.matchJobDescription(parsed.data);
    res.json({ success: true, match });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Job match failed' });
  }
});

export default router;
