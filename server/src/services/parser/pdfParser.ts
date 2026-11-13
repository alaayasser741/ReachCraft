// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import {
  ParsedCompany,
  ParsedContact,
  ParsedLink,
  ParseResult,
} from './types.js';
import { normalizePhoneNumber, splitPhoneString } from './phoneNormalizer.js';
import { extractEmails } from './emailNormalizer.js';
import { extractAndClassifyUrls } from './urlClassifier.js';
import { parseContactPerson } from './contactPersonParser.js';
import {
  detectCompanyAnomalies,
  detectSequenceAnomalies,
} from './anomalyDetector.js';

export async function parsePdfBuffer(
  buffer: Buffer,
  filename: string = 'document.pdf'
): Promise<ParseResult> {
  const pdfData = await pdfParse(buffer);
  return parseRawText(pdfData.text, filename);
}

export function parseRawText(rawText: string, filename: string = 'document.pdf'): ParseResult {
  // Step 1: Strip repeating page headers and footers
  const cleanedText = stripHeadersAndFooters(rawText);

  // Step 2: Split text into company blocks
  const rawBlocks = splitIntoCompanyBlocks(cleanedText);

  const parsedCompanies: ParsedCompany[] = [];
  const globalSeenEmails = new Set<string>();
  const globalSeenMobiles = new Set<string>();

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const company = parseCompanyBlock(block, i, globalSeenEmails, globalSeenMobiles);
    parsedCompanies.push(company);
  }

  // Step 3: Sequence anomalies (duplicate numbers, missing numbers)
  const { duplicateNumbers, missingNumbers } = detectSequenceAnomalies(parsedCompanies);

  // Step 4: Company-level anomalies and status assignment
  let contactsWithEmail = 0;
  let contactsWithWhatsApp = 0;
  let totalContacts = 0;
  let companiesNoDirectContact = 0;
  let totalAnomalies = 0;

  for (const company of parsedCompanies) {
    const anomalies = detectCompanyAnomalies(company, duplicateNumbers);
    company.anomalies = anomalies;
    totalAnomalies += anomalies.length;

    if (!company.hasDirectContact) {
      company.status = 'no_direct_contact';
      companiesNoDirectContact++;
    } else if (anomalies.length > 0) {
      company.status = 'warning';
    } else {
      company.status = 'valid';
    }

    totalContacts += company.contacts.length;
    for (const c of company.contacts) {
      if (c.email && c.isValidEmail) contactsWithEmail++;
      if (c.whatsappNumber && c.isValidWhatsApp) contactsWithWhatsApp++;
    }
  }

  return {
    filename,
    totalCompanies: parsedCompanies.length,
    totalContacts,
    contactsWithEmail,
    contactsWithWhatsApp,
    companiesNoDirectContact,
    totalAnomalies,
    companies: parsedCompanies,
    missingNumbers,
    duplicateNumbers,
  };
}

function stripHeadersAndFooters(text: string): string {
  // Matches repeating blocks like:
  // Data collected by / yossef hassan & Adham Khaled Mohammed Bakr & Abdurahman Shams Cairo ICT 2026
  let cleaned = text.replace(
    /Data\s+collected\s+by\s*\/[\s\S]*?(?:Cairo\s+ICT\s+2026|Abdurahman\s+Shams|Mohammed\s+Bakr\s+&\s+Abdurahman\s+Shams)/gi,
    '\n'
  );

  // Strip standalone "Cairo ICT 2026", "Part 2", page numbering
  cleaned = cleaned.replace(/\bCairo\s+ICT\s+2026\b/gi, '');
  cleaned = cleaned.replace(/^\s*Part\s+\d+\s*$/gim, '');
  cleaned = cleaned.replace(/^\s*Page\s+\d+\s*(?:of\s*\d+)?\s*$/gim, '');

  return cleaned;
}

interface RawCompanyBlock {
  headingNumber: number | null;
  headingText: string;
  body: string;
}

function splitIntoCompanyBlocks(text: string): RawCompanyBlock[] {
  const lines = text.split('\n');
  const blocks: RawCompanyBlock[] = [];

  let currentHeadingNumber: number | null = null;
  let currentHeadingText = '';
  let currentBodyLines: string[] = [];

  // Heading regex: matches "1. ECC Solutions" or "40.Microsoft HR" or "72. Berlitz: https://..."
  const headingRegex = /^\s*(\d+)\.\s*(\S.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headingRegex);

    if (match) {
      if (currentHeadingNumber !== null || currentHeadingText !== '') {
        blocks.push({
          headingNumber: currentHeadingNumber,
          headingText: currentHeadingText,
          body: currentBodyLines.join('\n'),
        });
      }

      currentHeadingNumber = parseInt(match[1], 10);
      currentHeadingText = match[2].trim();
      currentBodyLines = [];
    } else {
      currentBodyLines.push(line);
    }
  }

  // Push last block
  if (currentHeadingNumber !== null || currentHeadingText !== '') {
    blocks.push({
      headingNumber: currentHeadingNumber,
      headingText: currentHeadingText,
      body: currentBodyLines.join('\n'),
    });
  }

  return blocks;
}

function parseCompanyBlock(
  block: RawCompanyBlock,
  blockIndex: number,
  globalSeenEmails: Set<string>,
  globalSeenMobiles: Set<string>
): ParsedCompany {
  let companyName = block.headingText;
  const links: ParsedLink[] = [];

  // Special case: Heading contains inline URL like "72. Berlitz: https://www.linkedin.com/company/berlitz"
  if (companyName.includes('http://') || companyName.includes('https://') || companyName.includes('www.')) {
    const parts = companyName.split(/[:\s]+https?:\/\/|:\s+/);
    if (parts.length >= 2) {
      companyName = parts[0].trim();
      const extractedUrls = extractAndClassifyUrls(block.headingText, 'Heading URL');
      links.push(...extractedUrls);
    }
  }

  // Clean company name
  companyName = companyName.replace(/[:.]+$/, '').trim();

  // Stitch lines inside body: lines not starting with bullet (•, -, *) or new label are continuations
  const stitchedLines: string[] = [];
  const rawLines = block.body.split('\n');

  for (let j = 0; j < rawLines.length; j++) {
    const trimmed = rawLines[j].trim();
    if (!trimmed) continue;

    const isBulletOrLabel =
      /^[•\-\*]/.test(trimmed) ||
      /^[A-Za-z0-9\s()&/-]+:/.test(trimmed);

    if (isBulletOrLabel || stitchedLines.length === 0) {
      stitchedLines.push(trimmed);
    } else {
      // Continuation line (e.g. wrapped URL, wrapped email, or wrapped address)
      const lastIdx = stitchedLines.length - 1;
      // If continuation is part of a URL (no spaces, contains domain chars)
      if (
        (stitchedLines[lastIdx].includes('http') || stitchedLines[lastIdx].includes('www')) &&
        !trimmed.includes(' ')
      ) {
        stitchedLines[lastIdx] += trimmed;
      } else {
        stitchedLines[lastIdx] += ' ' + trimmed;
      }
    }
  }

  let website: string | null = null;
  let description: string | null = null;
  let address: string | null = null;

  const rawEmails: string[] = [];
  const rawPhones: Array<{ raw: string; label: string }> = [];
  const rawPersons: Array<{ name: string; title: string | null }> = [];

  for (const line of stitchedLines) {
    const cleanedLine = line.replace(/^[•\-\*]\s*/, '').trim();
    const colonIdx = cleanedLine.indexOf(':');

    if (colonIdx === -1) {
      // Unlabeled line: check for URLs, emails, or fallback description
      const foundUrls = extractAndClassifyUrls(cleanedLine);
      if (foundUrls.length > 0) links.push(...foundUrls);

      const foundEmails = extractEmails(cleanedLine);
      if (foundEmails.length > 0) rawEmails.push(...foundEmails.map((e) => e.email));

      continue;
    }

    const label = cleanedLine.slice(0, colonIdx).trim();
    const value = cleanedLine.slice(colonIdx + 1).trim();
    const lowerLabel = label.toLowerCase();

    // 1. URLs & Links
    const extractedUrls = extractAndClassifyUrls(value, label);
    if (extractedUrls.length > 0) {
      for (const link of extractedUrls) {
        if (link.type === 'website' && !website) {
          website = link.url;
        }
        links.push(link);
      }
    }

    // 2. Emails
    if (
      lowerLabel.includes('email') ||
      lowerLabel.includes('hr email') ||
      lowerLabel.includes('e-mail')
    ) {
      const emailsFound = extractEmails(value);
      for (const e of emailsFound) {
        rawEmails.push(e.email);
      }
    }

    // 3. Phones
    if (
      lowerLabel.includes('phone') ||
      lowerLabel.includes('mobile') ||
      lowerLabel.includes('whatsapp') ||
      lowerLabel.includes('landline') ||
      lowerLabel.includes('fax')
    ) {
      const parts = splitPhoneString(value);
      for (const p of parts) {
        rawPhones.push({ raw: p, label });
      }
    }

    // 4. Contact Person / vCard
    if (lowerLabel.includes('contact person') || lowerLabel.includes('vcard')) {
      const parsedPerson = parseContactPerson(value);
      if (parsedPerson.personName) {
        rawPersons.push({
          name: parsedPerson.personName,
          title: parsedPerson.jobTitle,
        });
      }
    }

    // 5. Website
    if (lowerLabel === 'website' || lowerLabel === 'website / qr' || lowerLabel === 'website (via qr)') {
      if (!website && extractedUrls.length > 0) {
        website = extractedUrls[0].url;
      } else if (!website && value.length > 3) {
        website = value.startsWith('http') ? value : `https://${value}`;
      }
    }

    // 6. Address & Offices
    if (
      lowerLabel.includes('address') ||
      lowerLabel.includes('headquarters') ||
      lowerLabel.includes('office') ||
      lowerLabel.includes('branch')
    ) {
      if (!address) {
        address = value;
      } else {
        address += ` | ${label}: ${value}`;
      }
    }

    // 7. Description / Services / Specialization / Status
    if (
      lowerLabel.includes('description') ||
      lowerLabel.includes('specialization') ||
      lowerLabel.includes('services') ||
      lowerLabel.includes('products') ||
      lowerLabel.includes('status')
    ) {
      if (!description) {
        description = `${label}: ${value}`;
      } else {
        description += ` | ${label}: ${value}`;
      }
    }
  }

  // Normalize phones
  const normalizedPhones = rawPhones.map((rp) => normalizePhoneNumber(rp.raw, rp.label));
  const mobilePhones = normalizedPhones.filter((p) => p.isMobile && p.isValid);
  const landlinePhones = normalizedPhones.filter((p) => p.isLandline || (!p.isMobile && p.isValid));

  // Synthesize contact list
  const contacts: ParsedContact[] = [];
  const primaryPerson = rawPersons[0] || null;

  // Deduplicate emails within company
  const uniqueEmails = Array.from(new Set(rawEmails));
  const uniqueMobiles = Array.from(new Set(mobilePhones.map((p) => p.e164!)));

  if (uniqueEmails.length === 0 && uniqueMobiles.length === 0) {
    // If contact person exists or address exists without direct channels
    if (primaryPerson) {
      contacts.push({
        id: `c_${blockIndex}_0`,
        personName: primaryPerson.name,
        jobTitle: primaryPerson.title,
        email: null,
        phoneMobile: null,
        phoneLandline: landlinePhones[0]?.e164 || null,
        whatsappNumber: null,
        address,
        isValidEmail: false,
        isValidWhatsApp: false,
        optedOut: false,
        notes: null,
      });
    }
  } else {
    // Pair emails and mobiles
    const maxEntries = Math.max(uniqueEmails.length, uniqueMobiles.length, 1);

    for (let k = 0; k < maxEntries; k++) {
      const email = uniqueEmails[k] || (k === 0 ? null : uniqueEmails[0] || null);
      const mobile = uniqueMobiles[k] || (k === 0 ? null : uniqueMobiles[0] || null);

      // Check cross-company duplicates
      const isEmailDuplicate = email ? globalSeenEmails.has(email) : false;
      const isMobileDuplicate = mobile ? globalSeenMobiles.has(mobile) : false;

      if (email) globalSeenEmails.add(email);
      if (mobile) globalSeenMobiles.add(mobile);

      const person = rawPersons[k] || primaryPerson;

      contacts.push({
        id: `c_${blockIndex}_${k}`,
        personName: person?.name || null,
        jobTitle: person?.title || null,
        email,
        phoneMobile: mobile,
        phoneLandline: landlinePhones[0]?.e164 || null,
        whatsappNumber: mobile,
        address,
        isValidEmail: Boolean(email && !isEmailDuplicate),
        isValidWhatsApp: Boolean(mobile && !isMobileDuplicate),
        optedOut: false,
        notes: [
          isEmailDuplicate ? 'Duplicate email across companies' : null,
          isMobileDuplicate ? 'Duplicate mobile across companies' : null,
        ]
          .filter(Boolean)
          .join('; ') || null,
      });
    }
  }

  const hasDirectContact = contacts.some((c) => Boolean(c.email || c.phoneMobile));

  return {
    id: `comp_${blockIndex}`,
    headingNumber: block.headingNumber,
    name: companyName,
    website,
    description,
    address,
    contacts,
    links,
    hasDirectContact,
    anomalies: [],
    status: hasDirectContact ? 'valid' : 'no_direct_contact',
  };
}
