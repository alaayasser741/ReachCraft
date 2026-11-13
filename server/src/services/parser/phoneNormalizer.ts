import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js/max';

export interface NormalizedPhone {
  raw: string;
  e164: string | null;
  isMobile: boolean;
  isLandline: boolean;
  isWhatsAppCandidate: boolean;
  isValid: boolean;
  country: string | null;
  error?: string;
}

export function splitPhoneString(rawInput: string): string[] {
  if (!rawInput) return [];

  // Replace common separators like / or , or | but don't split + unless preceded by separator or space
  // Also handle patterns like +20 10... / 010...
  const parts = rawInput
    .split(/[/|,;]|\s+(?=\+?\d{2,4}\s*[(]?[1-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);

  return parts;
}

export function normalizePhoneNumber(
  rawNumber: string,
  labelContext: string = '',
  defaultCountry: CountryCode = 'EG'
): NormalizedPhone {
  const cleanRaw = rawNumber.trim();
  const lowerLabel = labelContext.toLowerCase();
  const isFax = lowerLabel.includes('fax');

  if (isFax) {
    // Faxes are landlines and must never be WhatsApp candidates
    const parsed = parsePhoneNumberFromString(cleanRaw, defaultCountry);
    return {
      raw: cleanRaw,
      e164: parsed?.isValid() ? parsed.format('E.164') : null,
      isMobile: false,
      isLandline: true,
      isWhatsAppCandidate: false,
      isValid: parsed ? parsed.isValid() : false,
      country: parsed?.country || null,
    };
  }

  // Pre-process Egyptian mobile numbers
  // 010, 011, 012, 015 with 11 digits
  let preprocessed = cleanRaw;
  const egMobileMatch = preprocessed.replace(/[\s\-().]/g, '').match(/^0(1[0125]\d{8})$/);
  if (egMobileMatch) {
    preprocessed = `+20${egMobileMatch[1]}`;
  }

  const parsed = parsePhoneNumberFromString(preprocessed, defaultCountry);

  if (!parsed || !parsed.isValid()) {
    // Attempt fallback for Egyptian numbers without +20 prefix
    const digitsOnly = cleanRaw.replace(/\D/g, '');
    if (digitsOnly.length === 11 && /^01[0125]/.test(digitsOnly)) {
      const e164 = `+20${digitsOnly.slice(1)}`;
      return {
        raw: cleanRaw,
        e164,
        isMobile: true,
        isLandline: false,
        isWhatsAppCandidate: true,
        isValid: true,
        country: 'EG',
      };
    }

    return {
      raw: cleanRaw,
      e164: null,
      isMobile: false,
      isLandline: false,
      isWhatsAppCandidate: false,
      isValid: false,
      country: null,
      error: 'Invalid phone number format',
    };
  }

  const phoneType = parsed.getType();
  const country = parsed.country || null;
  const e164 = parsed.format('E.164');

  // Classification: Mobile vs Landline
  // Egyptian mobiles start with +2010, +2011, +2012, +2015
  const isEgMobile = e164.startsWith('+2010') ||
    e164.startsWith('+2011') ||
    e164.startsWith('+2012') ||
    e164.startsWith('+2015');

  const isExplicitMobileLabel =
    lowerLabel.includes('mobile') ||
    lowerLabel.includes('whatsapp') ||
    lowerLabel.includes('phone / whatsapp');

  const isExplicitLandlineLabel =
    lowerLabel.includes('landline') ||
    lowerLabel.includes('fax') ||
    lowerLabel.includes('headquarters') ||
    lowerLabel.includes('office');

  const isMobile =
    phoneType === 'MOBILE' ||
    phoneType === 'FIXED_LINE_OR_MOBILE' ||
    isEgMobile ||
    (isExplicitMobileLabel && !isExplicitLandlineLabel);

  const isLandline = !isMobile && (phoneType === 'FIXED_LINE' || isExplicitLandlineLabel);
  const isWhatsAppCandidate = isMobile && !isFax;

  return {
    raw: cleanRaw,
    e164,
    isMobile,
    isLandline,
    isWhatsAppCandidate,
    isValid: true,
    country,
  };
}
