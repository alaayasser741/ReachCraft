import { ParsedCompany } from './types.js';

export interface AnomalyReport {
  duplicateNumbers: number[];
  missingNumbers: number[];
  flaggedCompaniesCount: number;
}

export function detectSequenceAnomalies(companies: ParsedCompany[]): {
  duplicateNumbers: number[];
  missingNumbers: number[];
} {
  const numberCounts = new Map<number, number>();
  const numbers: number[] = [];

  for (const c of companies) {
    if (c.headingNumber !== null) {
      numbers.push(c.headingNumber);
      numberCounts.set(c.headingNumber, (numberCounts.get(c.headingNumber) || 0) + 1);
    }
  }

  const duplicateNumbers: number[] = [];
  numberCounts.forEach((count, num) => {
    if (count > 1) {
      duplicateNumbers.push(num);
    }
  });

  const missingNumbers: number[] = [];
  if (numbers.length > 0) {
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const numberSet = new Set(numbers);

    for (let i = min; i <= max; i++) {
      if (!numberSet.has(i)) {
        missingNumbers.push(i);
      }
    }
  }

  return { duplicateNumbers, missingNumbers };
}

// Levenshtein distance to detect domain typos
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function detectCompanyAnomalies(
  company: ParsedCompany,
  duplicateNumbers: number[]
): string[] {
  const anomalies: string[] = [];

  // Check duplicate heading
  if (company.headingNumber && duplicateNumbers.includes(company.headingNumber)) {
    anomalies.push(`Duplicate heading number #${company.headingNumber}`);
  }

  // Check direct contact
  if (!company.hasDirectContact) {
    anomalies.push('No direct contact info (email/phone missing; social/QR only)');
  }

  // Check email vs website domain typos
  if (company.website && company.contacts.length > 0) {
    try {
      const siteHostname = company.website
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]
        .toLowerCase();

      for (const contact of company.contacts) {
        if (contact.email) {
          const emailDomain = contact.email.split('@')[1]?.toLowerCase();
          if (emailDomain && emailDomain !== siteHostname) {
            // Check if it's not a generic email provider (gmail, outlook, etc.)
            const isGeneric = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(
              emailDomain
            );

            if (!isGeneric) {
              const distance = levenshteinDistance(siteHostname, emailDomain);
              // High similarity (1 or 2 typos) between site domain and email domain
              if (distance > 0 && distance <= 3) {
                anomalies.push(
                  `Suspected typo in email domain: "${emailDomain}" vs website "${siteHostname}"`
                );
              }
            }
          }
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Check invalid contacts
  for (const contact of company.contacts) {
    if (contact.email && !contact.isValidEmail) {
      anomalies.push(`Invalid email syntax: "${contact.email}"`);
    }
    if (contact.phoneMobile && !contact.isValidWhatsApp) {
      anomalies.push(`Invalid mobile phone number: "${contact.phoneMobile}"`);
    }
  }

  return anomalies;
}
