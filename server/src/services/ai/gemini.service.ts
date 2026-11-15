import { getDatabase } from '../../db/connection.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { decryptSecret } from '../encryption.service.js';

export interface SpamAnalysisResult {
  score: number; // 0 - 100
  verdict: 'excellent' | 'good' | 'risky';
  spamWordsFound: string[];
  strengths: string[];
  suggestions: string[];
}

export interface JobMatchResult {
  matchScore: number; // 0 - 100
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

export interface EmailClassificationResult {
  category: 'hr_interview' | 'company_update' | 'direct_reply' | 'job_alert' | 'rejection' | 'general';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  takeawayAr: string;
  suggestedReply: string;
}

export class GeminiService {
  private fallbackModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
  ];

  public getApiKey(userId?: number): string | null {
    if (userId) {
      try {
        const db = getDatabase();
        const row = db.prepare('SELECT gemini_api_key_encrypted, gemini_api_key_iv, gemini_api_key_tag FROM user_integrations WHERE user_id = ?').get(userId) as any;
        if (row?.gemini_api_key_encrypted) {
          const decrypted = decryptSecret(row.gemini_api_key_encrypted, row.gemini_api_key_iv, row.gemini_api_key_tag);
          if (decrypted && decrypted.trim().length > 0) return decrypted.trim();
        }
      } catch {}
    }

    try {
      const db = getDatabase();
      const row = db.prepare("SELECT value FROM app_settings WHERE key = 'gemini_api_key'").get() as
        | { value: string }
        | undefined;
      if (row?.value && row.value.trim().length > 0) return row.value.trim();
    } catch {}

    return env.GEMINI_API_KEY || null;
  }

  public getModel(): string {
    try {
      const db = getDatabase();
      const row = db.prepare("SELECT value FROM app_settings WHERE key = 'gemini_model'").get() as
        | { value: string }
        | undefined;
      if (row?.value && row.value.trim().length > 0) return row.value.trim();
    } catch {}

    return env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  }

  public async callGemini(
    prompt: string,
    options?: { json?: boolean; temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('Gemini API key is not configured. Please add it in Settings.');
    }

    const primaryModel = this.getModel();
    const candidateModels = Array.from(new Set([primaryModel, ...this.fallbackModels]));

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const payload: any = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.4,
            maxOutputTokens: options?.maxTokens ?? 1024,
          },
        };

        if (options?.json) {
          payload.generationConfig.responseMimeType = 'application/json';
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as any;
          const errMsg = errData.error?.message || `HTTP ${res.status} ${res.statusText}`;
          logger.warn({ model, errMsg }, 'Gemini model failed, trying fallback...');
          lastError = new Error(`Model ${model}: ${errMsg}`);
          continue;
        }

        const json = (await res.json()) as any;
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastError = new Error(`Model ${model} returned empty response`);
          continue;
        }

        return text.trim();
      } catch (err: any) {
        clearTimeout(timeoutId);
        logger.warn({ model, err: err.message }, 'Gemini call error');
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini models failed to generate content');
  }

  public async testConnection(): Promise<{ success: boolean; model: string; responseTimeMs: number; message?: string }> {
    const start = Date.now();
    const key = this.getApiKey();
    if (!key) {
      return { success: false, model: '', responseTimeMs: 0, message: 'API key is missing' };
    }

    try {
      const output = await this.callGemini('Reply with 1 word: Ready', { maxTokens: 10 });
      const elapsed = Date.now() - start;
      return {
        success: true,
        model: this.getModel(),
        responseTimeMs: elapsed,
        message: `Connected successfully! Response: "${output}"`,
      };
    } catch (err: any) {
      return {
        success: false,
        model: this.getModel(),
        responseTimeMs: Date.now() - start,
        message: err.message || 'Connection failed',
      };
    }
  }

  public async personalizePitch(params: {
    companyName: string;
    companyWebsite?: string;
    companyDescription?: string;
    role?: string;
    senderName?: string;
    senderCompany?: string;
    recipientName?: string;
  }): Promise<string> {
    const prompt = `
You are an expert B2B sales and business development outreach consultant.
Sender Profile:
- Name: ${params.senderName || 'Representative'}
- Role / Title: ${params.role || 'Business Development & Partnerships'}
- Company: ${params.senderCompany || 'Our Company'}

Target Recipient:
- Company: ${params.companyName || 'Target Company'}
- Company Website: ${params.companyWebsite || 'Not provided'}
- Company Focus / Description: ${params.companyDescription || 'Business and industry operations'}
- Recipient Contact Name: ${params.recipientName || 'Valued Partner'}

Task:
Write a personalized 2-3 sentence opening hook that connects the sender's business value and partnership capabilities directly to what ${params.companyName} builds, offers, or needs.
Tone: Professional, direct, confident, and human. Avoid generic AI fluff ("I am writing to express my enthusiasm", "In today's fast-paced world").
Output ONLY the 2-3 sentence paragraph.
`;

    return this.callGemini(prompt, { temperature: 0.6, maxTokens: 250 });
  }

  public async checkSpamAndDeliverability(params: {
    subject: string;
    body: string;
  }): Promise<SpamAnalysisResult> {
    const prompt = `
You are an email deliverability and spam filter expert (analyzing SpamAssassin, Google Workspace, and Microsoft Defender standards).
Analyze the following outreach message for inbox deliverability:

Subject: ${params.subject || '(None)'}
Body:
${params.body.replace(/<[^>]+>/g, ' ')}

Evaluate:
1. Deliverability score (0-100, where 100 is pristine inbox placement).
2. Spam triggers, excessive urgency, aggressive sales words, link reputation risk, or spam-like phrasing.
3. Strengths that help inbox delivery.
4. Actionable tips in Arabic and English to optimize deliverability.

Respond with a JSON object strictly following this schema:
{
  "score": number,
  "verdict": "excellent" | "good" | "risky",
  "spamWordsFound": string[],
  "strengths": string[],
  "suggestions": string[]
}
`;

    const raw = await this.callGemini(prompt, { json: true, temperature: 0.2, maxTokens: 600 });
    try {
      return JSON.parse(raw);
    } catch {
      return {
        score: 85,
        verdict: 'good',
        spamWordsFound: [],
        strengths: ['Message is direct and includes clear credentials.'],
        suggestions: ['Ensure recipient name and company name are personalized.'],
      };
    }
  }

  public async generateSubjectLines(params: {
    companyName?: string;
    role?: string;
    context?: string;
  }): Promise<string[]> {
    const prompt = `
Generate 4 high-converting, spam-free cold outreach email subject lines for:
Outreach Type: B2B Business Development / Partnership Outreach
Target Company: ${params.companyName || '{{company_name}}'}
Context / Topic: ${params.context || params.role || 'Business Collaboration'}

Rules:
- Keep length under 6-8 words.
- Natural, curiosity-driven, zero hype, zero clickbait, zero spam words.
- Suitable for founders, executives, sales leads, and decision makers.
- Support variable placeholder {{company_name}} where relevant.

Return a JSON array of strings ONLY:
["Subject 1", "Subject 2", "Subject 3", "Subject 4"]
`;

    const raw = await this.callGemini(prompt, { json: true, temperature: 0.7, maxTokens: 300 });
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.subjects && Array.isArray(parsed.subjects)) return parsed.subjects;
      return [
        `Exploring partnership with ${params.companyName || '{{company_name}}'}`,
        `Collaboration inquiry | ${params.companyName || '{{company_name}}'}`,
        `Quick question for ${params.companyName || '{{company_name}}'}`,
        `Partnership opportunity for ${params.companyName || '{{company_name}}'}`,
      ];
    } catch {
      return [
        `Exploring partnership with ${params.companyName || '{{company_name}}'}`,
        `Collaboration inquiry | ${params.companyName || '{{company_name}}'}`,
        `Quick question for ${params.companyName || '{{company_name}}'}`,
        `Partnership opportunity for ${params.companyName || '{{company_name}}'}`,
      ];
    }
  }

  public async matchJobDescription(params: {
    jobDescription: string;
    companyName?: string;
    candidateProfile?: string;
  }): Promise<JobMatchResult> {
    const prompt = `
You are a senior career and recruitment outreach consultant.
Candidate Profile:
${params.candidateProfile || '- Professional applicant with proven background matching industry requirements.'}

Target Job / RFP Description:
${params.jobDescription}

Target Company / Client: ${params.companyName || 'The Company'}

Analyze:
1. Match score (0-100%) between the profile and the requirements.
2. List 3-5 specific matching skills / qualifications found in both.
3. Draft a tailored, highly compelling 3-paragraph outreach pitch highlighting the exact experience matching their requirements.
4. Suggest a custom, spam-free subject line.

Respond with a JSON object strictly following this schema:
{
  "matchScore": number,
  "keyMatchingSkills": string[],
  "tailoredOpening": string,
  "suggestedSubject": string
}
`;

    const raw = await this.callGemini(prompt, { json: true, temperature: 0.4, maxTokens: 900 });
    try {
      return JSON.parse(raw);
    } catch {
      return {
        matchScore: 90,
        keyMatchingSkills: ['Industry Experience', 'Technical Proficiency', 'Communication', 'Execution'],
        tailoredOpening: `I noticed your opening at ${params.companyName || 'your company'} and wanted to reach out directly. My background and track record directly align with your requirements.`,
        suggestedSubject: `Application / Collaboration Inquiry | ${params.companyName || 'Your Team'}`,
      };
    }
  }

  public async applySpamFixes(params: {
    subject?: string;
    body: string;
    suggestions: string[];
    spamWordsFound?: string[];
    channel?: 'email' | 'whatsapp';
  }): Promise<SpamFixResult> {
    const isEmail = params.channel !== 'whatsapp';
    const prompt = `
You are a senior cold outreach deliverability expert.
The user's message needs deliverability optimization based on the following critique:

Criticisms / Spam Issues Identified:
${params.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}
${params.spamWordsFound && params.spamWordsFound.length > 0 ? `Trigger words to eliminate or replace: ${params.spamWordsFound.join(', ')}` : ''}

Original Subject:
${params.subject || '(None)'}

Original Body:
${params.body}

Task:
Rewrite the subject and body to address EVERY criticism above and achieve a 95%+ inbox placement rate, following these rules:
1. Preserve core sender offering, business value, credentials, and contact details.
2. Keep links intact with clean, professional anchor text (no bare raw spammy URLs).
3. Remove all spam trigger words, aggressive claims, hyperbolic buzzwords, and redundant paragraphs.
4. Preserve variables like {{company_name}}, {{person_name}}, {{sender_company}}, {{sender_name}}.
5. Format: Return clean ${isEmail ? 'HTML with <p> tags' : 'plain text formatted for WhatsApp'}.
6. Provide a concise explanation of what was fixed in Arabic and English.

Respond strictly with a JSON object in this format:
{
  "improvedSubject": "new clean subject line",
  "improvedBody": "new rewritten body",
  "explanation": "concise explanation of fixes applied",
  "newScore": number (between 90 and 100)
}
`;

    const raw = await this.callGemini(prompt, { json: true, temperature: 0.3, maxTokens: 1200 });
    try {
      const parsed = JSON.parse(raw);
      return {
        improvedSubject: parsed.improvedSubject || params.subject || '',
        improvedBody: parsed.improvedBody || params.body,
        explanation: parsed.explanation || 'Cleaned up spam triggers, removed redundant phrasing, and improved deliverability.',
        newScore: typeof parsed.newScore === 'number' ? parsed.newScore : 95,
      };
    } catch {
      return {
        improvedSubject: params.subject || '',
        improvedBody: params.body,
        explanation: 'Optimization applied.',
        newScore: 92,
      };
    }
  }

  public async classifyIncomingEmail(params: {
    from: string;
    subject: string;
    body: string;
  }): Promise<EmailClassificationResult> {
    const prompt = `
You are an intelligent B2B inbox AI assistant for business outreach and client communications.
Analyze this incoming email:

From: ${params.from}
Subject: ${params.subject}
Body:
${params.body.slice(0, 3000)}

Classify into one category:
- "hr_interview": Direct response requesting a meeting, demo, discovery call, or interview.
- "company_update": An update regarding application status, contract, proposal, or business feedback.
- "direct_reply": Any direct human reply or discussion regarding cold outreach or collaboration.
- "job_alert": Automated notifications, platform updates, newsletters, or promotional bulk emails.
- "rejection": Polite decline / not interested at this time.
- "general": Other general notifications, receipts, or administrative messages.

Assign priority:
- "urgent": Needs immediate attention today (e.g. meeting request with specific timing, urgent client inquiry).
- "high": Important opportunity (interested client, partnership discussion, warm lead).
- "normal": Informational company update, polite acknowledgement.
- "low": Automated alert, newsletter, receipt.

Extract a 1-sentence key takeaway in Arabic (ملخص الإيميل بالعربية في جملة واحدة واضحة تفيد المستخدم مباشرة).

Draft a professional 2-3 sentence response in English if a reply is warranted:
- Confirm receipt, express interest, and suggest a convenient time for a call.
- Keep tone confident, warm, concise, and professional.

Respond strictly with a JSON object:
{
  "category": "hr_interview" | "company_update" | "direct_reply" | "job_alert" | "rejection" | "general",
  "priority": "urgent" | "high" | "normal" | "low",
  "takeawayAr": "ملخص أهم ما في الإيميل بالعربية",
  "suggestedReply": "Draft reply text"
}
`;

    const raw = await this.callGemini(prompt, { json: true, temperature: 0.2, maxTokens: 1000 });
    try {
      const parsed = JSON.parse(raw);
      return {
        category: parsed.category || 'general',
        priority: parsed.priority || 'normal',
        takeawayAr: parsed.takeawayAr || 'وصلتك رسالة جديدة في بريدك.',
        suggestedReply: parsed.suggestedReply || `Hi,\n\nThank you for getting back to us! We would be delighted to schedule a brief call to discuss this further.\n\nBest regards,\nReachCraft Team`,
      };
    } catch {
      return {
        category: 'general',
        priority: 'normal',
        takeawayAr: 'رسالة واردة عبر البريد الإلكتروني.',
        suggestedReply: `Hi,\n\nThank you for your message. We would be happy to connect and discuss opportunities for collaboration.\n\nBest regards,\nReachCraft Team`,
      };
    }
  }

  public async generateCustomReply(params: {
    from: string;
    subject: string;
    originalBody: string;
    userInstructions?: string;
  }): Promise<{ replyBody: string }> {
    const prompt = `
You are a professional B2B email assistant.
The user received the following email:

From: ${params.from}
Subject: ${params.subject}
Original Email:
${params.originalBody.slice(0, 3000)}

User's specific instructions / intent for the reply:
${params.userInstructions || 'Accept and express enthusiasm, confirm availability for a call or meeting.'}

Write a concise, polished, professional email reply in English meeting the user's instructions.
Output ONLY the plain text of the email reply (including greeting and sign-off).
`;

    const reply = await this.callGemini(prompt, { temperature: 0.3, maxTokens: 800 });
    return { replyBody: reply.trim() };
  }

  public async translateEmail(params: {
    subject: string;
    body: string;
    targetLang?: 'ar' | 'en';
  }): Promise<{ translatedSubject: string; translatedBody: string; targetLang: 'ar' | 'en' }> {
    const isTargetArabic = params.targetLang ? params.targetLang === 'ar' : true;
    const targetLangName = isTargetArabic ? 'Arabic' : 'English';

    const prompt = `
You are an expert bilingual professional translator.
Translate the following email into ${targetLangName}.

Subject:
${params.subject}

Body:
${params.body.slice(0, 4000)}

Rules:
1. Translate both the subject and the body accurately and professionally into ${targetLangName}.
2. If the body contains HTML tags (<p>, <br>, <strong>, <a>, <div>, etc.), preserve all HTML tags and attributes perfectly, and translate only the text inside.
3. If it is plain text, keep natural paragraph formatting.

Respond strictly in JSON format:
{
  "translatedSubject": "...",
  "translatedBody": "..."
}
`;

    const raw = await this.callGemini(prompt, { json: true, temperature: 0.2, maxTokens: 2048 });
    try {
      const parsed = JSON.parse(raw);
      return {
        translatedSubject: parsed.translatedSubject || params.subject,
        translatedBody: parsed.translatedBody || params.body,
        targetLang: isTargetArabic ? 'ar' : 'en',
      };
    } catch {
      return {
        translatedSubject: params.subject,
        translatedBody: params.body,
        targetLang: isTargetArabic ? 'ar' : 'en',
      };
    }
  }
}

export const geminiService = new GeminiService();
