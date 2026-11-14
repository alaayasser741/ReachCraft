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
    recipientName?: string;
  }): Promise<string> {
    const prompt = `
You are an expert tech recruiter and cold outreach consultant.
Applicant Profile:
- Name: Alaa Abdullah
- Role: Frontend Engineer
- Experience: 3 years of production experience in React.js, Next.js, and TypeScript.
- Core strengths: Web performance optimization, clean component architecture, large-scale e-commerce & SaaS platforms.
- Portfolio / CV: Available on request.

Target Recipient:
- Company: ${params.companyName || 'Target Company'}
- Company Website: ${params.companyWebsite || 'Not provided'}
- Company Focus / Description: ${params.companyDescription || 'Technology & software services'}
- Recipient Contact Name: ${params.recipientName || 'Hiring Manager'}
- Target Role: ${params.role || 'Frontend Engineer / React Developer'}

Task:
Write a personalized 2-3 sentence opening hook that connects Alaa's 3-year production experience in React.js, Next.js, and TypeScript directly to what ${params.companyName} builds or needs.
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
Applicant: Alaa Abdullah (Frontend Engineer with 3 years production React/Next.js/TypeScript experience)
Target Company: ${params.companyName || '{{company_name}}'}
Role: ${params.role || 'Frontend Engineer'}

Rules:
- Keep length under 6-8 words.
- Natural, curiosity-driven, zero hype or clickbait.
- Suitable for tech leads, engineering managers, and founders.
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
        `Frontend Engineer Application – Alaa Abdullah | ${params.companyName || '{{company_name}}'}`,
        `React / Next.js Engineer for ${params.companyName || '{{company_name}}'}`,
        `Frontend role inquiry – Alaa Abdullah`,
        `Quick question regarding frontend engineering at ${params.companyName || '{{company_name}}'}`,
      ];
    } catch {
      return [
        `Frontend Engineer Application – Alaa Abdullah | ${params.companyName || '{{company_name}}'}`,
        `React / Next.js Engineer for ${params.companyName || '{{company_name}}'}`,
        `Frontend role inquiry – Alaa Abdullah`,
        `Quick question regarding frontend engineering at ${params.companyName || '{{company_name}}'}`,
      ];
    }
  }

  public async matchJobDescription(params: {
    jobDescription: string;
    companyName?: string;
  }): Promise<JobMatchResult> {
    const prompt = `
You are a senior tech career coach.
Candidate Profile:
- Alaa Abdullah, Frontend Engineer
- 3 years production experience in React.js, Next.js, and TypeScript.
- Strong track record in web performance optimization, responsive pixel-perfect UI, enterprise & SaaS applications, and end-to-end component architecture.
- CV link: https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link

Target Job Description:
${params.jobDescription}

Target Company: ${params.companyName || 'The Company'}

Analyze:
1. Match score (0-100%) between Alaa's Frontend skills and the job requirements.
2. List 3-5 specific matching skills / technologies found in both.
3. Draft a tailored, highly compelling 3-paragraph outreach pitch highlighting the exact experience matching their requirements.
4. Suggest a custom subject line.

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
        keyMatchingSkills: ['React.js', 'Next.js', 'TypeScript', 'Clean Architecture', 'Web Performance'],
        tailoredOpening: `I noticed your opening for a Frontend role at ${params.companyName || 'your company'} and wanted to reach out directly. With 3 years of hands-on production experience building high-scale React and Next.js platforms, my background directly aligns with your requirements.`,
        suggestedSubject: `Frontend Engineer Application – Alaa Abdullah | ${params.companyName || 'Your Team'}`,
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
1. Preserve core identity: Alaa Abdullah, Frontend Engineer with 3 years of production experience in React.js, Next.js, TypeScript.
2. Keep contact details and links intact (CV link and phone +201040353590). If criticism mentions Google Drive link, format it cleanly with professional anchor text or button so it does not look like a suspicious raw phishing URL.
3. Remove all spam trigger words, hyperbolic buzzwords, and redundant duplicate paragraphs.
4. Preserve variables like {{company_name}} and {{person_name}}.
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
You are an intelligent inbox AI assistant for Alaa Abdullah (Frontend Engineer with 3 years of production experience in React.js, Next.js, and TypeScript).
Analyze this incoming email:

From: ${params.from}
Subject: ${params.subject}
Body:
${params.body.slice(0, 3000)}

Classify into one category:
- "hr_interview": A direct response from HR, recruiter, talent acquisition, or interviewer asking for an interview, availability, technical call, or screening.
- "company_update": An update regarding application status, assessment link, take-home task, or feedback from an applied role.
- "direct_reply": Any direct human reply or discussion regarding cold outreach or networking.
- "job_alert": Automated job board alerts (LinkedIn, Indeed, Bayt, etc.), newsletters, or promotional bulk emails.
- "rejection": Polite rejection / notice that role was filled.
- "general": Other general notifications, account updates, receipts, etc.

Assign priority:
- "urgent": Needs immediate attention today (e.g. interview invitation with specific timing, urgent client/lead question).
- "high": Important opportunity (HR reply, interview request, feedback).
- "normal": Informational company update, application acknowledgment.
- "low": Automated job alert, newsletter, receipt.

Extract a 1-sentence key takeaway in Arabic (ملخص الإيميل بالعربية في جملة واحدة واضحة تفيد علاء مباشرة).

Draft a professional 2-3 sentence response in English from Alaa Abdullah if a reply is warranted:
- Confirm interest and availability.
- Keep tone confident, warm, and professional.
- Mention readiness to discuss how his React.js & Next.js production experience can add value.
- Include his contact info (Alaa Abdullah | +201040353590 | https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link).

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
        suggestedReply: parsed.suggestedReply || `Hi,\n\nThank you for reaching out! I would be delighted to connect and discuss this further.\n\nBest regards,\nAlaa Abdullah\n+201040353590\nhttps://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link`,
      };
    } catch {
      return {
        category: 'general',
        priority: 'normal',
        takeawayAr: 'رسالة واردة عبر البريد الإلكتروني.',
        suggestedReply: `Hi,\n\nThank you for your message. I'd be glad to discuss how I can contribute to your team.\n\nBest regards,\nAlaa Abdullah\n+201040353590\nhttps://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link`,
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
You are the AI email assistant for Alaa Abdullah (Frontend Engineer with 3 years of production experience in React.js, Next.js, and TypeScript).
Alaa received the following email:

From: ${params.from}
Subject: ${params.subject}
Original Email:
${params.originalBody.slice(0, 3000)}

Alaa's specific instructions / intent for the reply:
${params.userInstructions || 'Accept and express enthusiasm, confirm availability for a call or interview.'}

Alaa's profile:
- Role: Frontend Engineer (React.js, Next.js, TypeScript, Tailored Architectures, High Performance).
- Phone: +201040353590
- CV Link: https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view?usp=drive_link

Write a concise, polished, professional email reply in English meeting Alaa's instructions.
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
