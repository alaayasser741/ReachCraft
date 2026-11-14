import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from project root or server directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  ADMIN_EMAIL: z.string().email().default('alaayasser2018@gmail.com'),
  ADMIN_PASSWORD: z.string().min(6).default('alaa7415@@'),
  JWT_SECRET: z.string().min(16).default('super_secret_jwt_key_at_least_32_characters_long_for_security_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  DATABASE_PATH: z.string().default('./data/outreach.db'),

  EMAIL_PROVIDER: z.enum(['gmail', 'brevo', 'smtp']).default('gmail'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.coerce.boolean().default(true),
  SMTP_USER: z.string().default('verify.reachcraft@gmail.com'),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM_NAME: z.string().default('ReachCraft'),
  SMTP_FROM_EMAIL: z.string().default('verify.reachcraft@gmail.com'),
  EMAIL_DAILY_CAP: z.coerce.number().default(100),
  EMAIL_MIN_INTERVAL_SEC: z.coerce.number().default(20),
  EMAIL_MAX_INTERVAL_SEC: z.coerce.number().default(35),

  WHATSAPP_PROVIDER: z.enum(['click-to-chat', 'session', 'cloud']).default('click-to-chat'),
  WHATSAPP_DAILY_CAP: z.coerce.number().default(30),
  WHATSAPP_MIN_INTERVAL_SEC: z.coerce.number().default(30),
  WHATSAPP_MAX_INTERVAL_SEC: z.coerce.number().default(90),
  WHATSAPP_WARMUP_MODE: z.coerce.boolean().default(true),

  UNSUBSCRIBE_BASE_URL: z.string().default('http://localhost:5000/unsubscribe'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().min(32).default('feb16bf61fd8a0d0bf7584224cf29552f539df6ad764f1e14826e417955fdf68'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
