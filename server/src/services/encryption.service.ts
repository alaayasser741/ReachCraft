import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';

// Derive a 32-byte key from ENCRYPTION_KEY
function getKey(): Buffer {
  return crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Never stores plain secrets in the database.
 */
export function encryptSecret(plainText: string): EncryptedData {
  if (!plainText) {
    return { ciphertext: '', iv: '', tag: '' };
  }

  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypt AES-256-GCM ciphertext back to plaintext.
 * Throws if auth tag verification fails (data tampering).
 */
export function decryptSecret(ciphertext: string, ivHex: string, tagHex: string): string {
  if (!ciphertext || !ivHex || !tagHex) {
    return '';
  }

  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(tag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
