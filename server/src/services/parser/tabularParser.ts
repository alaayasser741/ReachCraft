import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ParsedCompany, ParsedContact, ParseResult } from './types.js';
import { normalizePhoneNumber } from './phoneNormalizer.js';
import { extractEmails } from './emailNormalizer.js';
import { extractAndClassifyUrls } from './urlClassifier.js';
import { parseContactPerson } from './contactPersonParser.js';

export function parseCsvBuffer(buffer: Buffer, filename: string): ParseResult {
  const content = buffer.toString('utf8');
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  return processTabularRows(parsed.data, filename);
}

export function parseXlsxBuffer(buffer: Buffer, filename: string): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  return processTabularRows(rows, filename);
}

function processTabularRows(rows: Array<Record<string, any>>, filename: string): ParseResult {
  const companies: ParsedCompany[] = [];
  const globalSeenEmails = new Set<string>();
  const globalSeenMobiles = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const keys = Object.keys(row);

    const findVal = (keywords: string[]): string => {
      for (const k of keys) {
        const lower = k.toLowerCase().trim();
        if (keywords.some((kw) => lower.includes(kw))) {
          const val = row[k];
          if (val !== undefined && val !== null) return String(val).trim();
        }
      }
      return '';
    };

    const companyName = findVal(['company', 'org', 'business', 'enterprise']) || `Company #${i + 1}`;
    const website = findVal(['web', 'url', 'site', 'domain']);
    const personRaw = findVal(['person', 'contact', 'name', 'full name', 'lead']);
    const title = findVal(['title', 'position', 'role', 'job']);
    const emailRaw = findVal(['email', 'mail', 'e-mail']);
    const phoneRaw = findVal(['phone', 'mobile', 'whatsapp', 'cell', 'tel']);
    const address = findVal(['address', 'city', 'location', 'country']);
    const desc = findVal(['desc', 'service', 'special', 'note', 'about']);

    const parsedPerson = personRaw ? parseContactPerson(personRaw) : { personName: '', jobTitle: null };
    const personName = parsedPerson.personName || null;
    const jobTitle = title || parsedPerson.jobTitle || null;

    const extractedEmails = extractEmails(emailRaw);
    const email = extractedEmails[0]?.email || null;

    const normalizedPhone = phoneRaw ? normalizePhoneNumber(phoneRaw) : null;
    const phoneMobile = normalizedPhone?.isMobile ? normalizedPhone.e164 : null;
    const phoneLandline = normalizedPhone && !normalizedPhone.isMobile ? normalizedPhone.e164 : null;

    const isDuplicateEmail = email ? globalSeenEmails.has(email) : false;
    const isDuplicateMobile = phoneMobile ? globalSeenMobiles.has(phoneMobile) : false;

    if (email) globalSeenEmails.add(email);
    if (phoneMobile) globalSeenMobiles.add(phoneMobile);

    const hasDirectContact = Boolean(email || phoneMobile);

    const contact: ParsedContact = {
      id: `c_tab_${i}`,
      personName,
      jobTitle,
      email,
      phoneMobile,
      phoneLandline,
      whatsappNumber: phoneMobile,
      address: address || null,
      isValidEmail: Boolean(email && !isDuplicateEmail),
      isValidWhatsApp: Boolean(phoneMobile && !isDuplicateMobile),
      optedOut: false,
      notes: null,
    };

    const links = extractAndClassifyUrls(website);

    companies.push({
      id: `comp_tab_${i}`,
      headingNumber: i + 1,
      name: companyName,
      website: website || null,
      description: desc || null,
      address: address || null,
      contacts: [contact],
      links,
      hasDirectContact,
      anomalies: hasDirectContact ? [] : ['No direct email or phone found'],
      status: hasDirectContact ? 'valid' : 'no_direct_contact',
    });
  }

  let contactsWithEmail = 0;
  let contactsWithWhatsApp = 0;
  let companiesNoDirectContact = 0;

  for (const c of companies) {
    if (!c.hasDirectContact) companiesNoDirectContact++;
    for (const ct of c.contacts) {
      if (ct.email && ct.isValidEmail) contactsWithEmail++;
      if (ct.whatsappNumber && ct.isValidWhatsApp) contactsWithWhatsApp++;
    }
  }

  return {
    filename,
    totalCompanies: companies.length,
    totalContacts: companies.length,
    contactsWithEmail,
    contactsWithWhatsApp,
    companiesNoDirectContact,
    totalAnomalies: companiesNoDirectContact,
    companies,
    missingNumbers: [],
    duplicateNumbers: [],
  };
}
