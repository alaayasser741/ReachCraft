export interface NormalizedEmail {
  raw: string;
  email: string;
  isValid: boolean;
  domain: string;
  error?: string;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function extractEmails(rawText: string): NormalizedEmail[] {
  if (!rawText) return [];

  // Match all potential emails
  const matches = rawText.match(EMAIL_REGEX) || [];
  const results: NormalizedEmail[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const cleaned = match.trim().toLowerCase().replace(/[.,;:/]+$/, '');
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);

    const parts = cleaned.split('@');
    const domain = parts[1] || '';

    // Validate structure: domain must contain dot and valid tld
    const isValid =
      parts.length === 2 &&
      parts[0].length > 0 &&
      domain.includes('.') &&
      domain.length >= 4 &&
      !domain.startsWith('.') &&
      !domain.endsWith('.');

    results.push({
      raw: match,
      email: cleaned,
      isValid,
      domain,
      error: isValid ? undefined : 'Malformed email address',
    });
  }

  return results;
}
