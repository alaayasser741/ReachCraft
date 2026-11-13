import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePdfBuffer, parseRawText } from '../src/services/parser/pdfParser.js';
import { normalizePhoneNumber } from '../src/services/parser/phoneNormalizer.js';
import { extractEmails } from '../src/services/parser/emailNormalizer.js';
import { parseContactPerson } from '../src/services/parser/contactPersonParser.js';

describe('PDF Parser Engine - Acceptance Criteria & Unit Tests', () => {
  const fixturePath = path.resolve(__dirname, '../fixtures/sample_exhibition_contacts.pdf');

  it('Parses Egyptian mobile vs landline and fax correctly', () => {
    // Egyptian Landline
    const landline = normalizePhoneNumber('+20 (2) 38284500', 'Phone', 'EG');
    expect(landline.isValid).toBe(true);
    expect(landline.isMobile).toBe(false);
    expect(landline.isLandline).toBe(true);
    expect(landline.isWhatsAppCandidate).toBe(false);

    // Egyptian Mobile with leading 010
    const mobile = normalizePhoneNumber('01055064366', 'Phone / WhatsApp', 'EG');
    expect(mobile.isValid).toBe(true);
    expect(mobile.e164).toBe('+201055064366');
    expect(mobile.isMobile).toBe(true);
    expect(mobile.isWhatsAppCandidate).toBe(true);

    // Fax must never be WhatsApp
    const fax = normalizePhoneNumber('+20 (2) 38327435', 'Fax', 'EG');
    expect(fax.isValid).toBe(true);
    expect(fax.isWhatsAppCandidate).toBe(false);
  });

  it('Parses contact person name and title pattern', () => {
    const p1 = parseContactPerson('Fatima Zahra Ghaidi (Field Marketing Manager NWA & NEA)');
    expect(p1.personName).toBe('Fatima Zahra Ghaidi');
    expect(p1.jobTitle).toBe('Field Marketing Manager NWA & NEA');

    const p2 = parseContactPerson('Abdullah Samy (Lead Generation Specialist)');
    expect(p2.personName).toBe('Abdullah Samy');
    expect(p2.jobTitle).toBe('Lead Generation Specialist');

    const p3 = parseContactPerson('Mohamed Dena');
    expect(p3.personName).toBe('Mohamed Dena');
    expect(p3.jobTitle).toBeNull();
  });

  it('Extracts multiple emails and cleans punctuation', () => {
    const raw = 'info@newedge-eg.com / abdullah@newedge-eg.com';
    const extracted = extractEmails(raw);
    expect(extracted.length).toBe(2);
    expect(extracted[0].email).toBe('info@newedge-eg.com');
    expect(extracted[1].email).toBe('abdullah@newedge-eg.com');
  });

  it('Parses sample exhibition contacts PDF fixture and meets all acceptance criteria', async () => {
    expect(fs.existsSync(fixturePath)).toBe(true);
    const pdfBuffer = fs.readFileSync(fixturePath);

    const result = await parsePdfBuffer(pdfBuffer, 'sample_exhibition_contacts.pdf');

    // 1. Total companies count is ~70 (in sample it is exactly 71)
    expect(result.totalCompanies).toBeGreaterThanOrEqual(68);
    expect(result.totalCompanies).toBeLessThanOrEqual(75);
    console.log(`Parsed total companies: ${result.totalCompanies}`);
    console.log(`Contacts with email: ${result.contactsWithEmail}`);
    console.log(`Contacts with WhatsApp: ${result.contactsWithWhatsApp}`);
    console.log(`Companies with no direct contact: ${result.companiesNoDirectContact}`);

    // 2. Headings without space handled (40.Microsoft HR)
    const msft = result.companies.find((c) => c.name.toLowerCase().includes('microsoft'));
    expect(msft).toBeDefined();
    expect(msft?.headingNumber).toBe(40);

    // 3. Duplicate number 40 detected
    expect(result.duplicateNumbers).toContain(40);

    // 4. Missing numbers detected (29 and 34)
    expect(result.missingNumbers).toContain(29);
    expect(result.missingNumbers).toContain(34);

    // 5. Suspected typo flagged for Wireless Dynamics (Wireless-Dynamcis.com)
    const wireless = result.companies.find((c) => c.name.toLowerCase().includes('wireless dynamics'));
    expect(wireless).toBeDefined();
    expect(wireless?.anomalies.some((a) => a.toLowerCase().includes('typo'))).toBe(true);

    // 6. Companies with only LinkedIn / partner booths (e.g. UK Aid, UN Women) marked no direct contact
    const ukAid = result.companies.find((c) => c.name.toLowerCase().includes('uk aid'));
    expect(ukAid).toBeDefined();
    expect(ukAid?.status).toBe('no_direct_contact');
    expect(ukAid?.hasDirectContact).toBe(false);

    // 7. Company 72 (Berlitz with inline URL) parsed cleanly
    const berlitz = result.companies.find((c) => c.name.toLowerCase().includes('berlitz'));
    expect(berlitz).toBeDefined();
    expect(berlitz?.name).toBe('Berlitz');
    expect(berlitz?.links.some((l) => l.url.includes('linkedin.com/company/berlitz'))).toBe(true);
  });
});
