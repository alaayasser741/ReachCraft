export interface ParsedLink {
  type: 'website' | 'linkedin' | 'instagram' | 'facebook' | 'x' | 'qr_link' | 'careers' | 'other';
  url: string;
}

export interface ParsedContact {
  id?: string;
  personName: string | null;
  jobTitle: string | null;
  email: string | null;
  phoneMobile: string | null;
  phoneLandline: string | null;
  whatsappNumber: string | null;
  address: string | null;
  isValidEmail: boolean;
  isValidWhatsApp: boolean;
  optedOut: boolean;
  notes: string | null;
}

export interface ParsedCompany {
  id?: string;
  headingNumber: number | null;
  name: string;
  website: string | null;
  description: string | null;
  address: string | null;
  contacts: ParsedContact[];
  links: ParsedLink[];
  hasDirectContact: boolean;
  anomalies: string[];
  status: 'valid' | 'warning' | 'no_direct_contact';
  isExcluded?: boolean;
}

export interface ParseResult {
  filename: string;
  totalCompanies: number;
  totalContacts: number;
  contactsWithEmail: number;
  contactsWithWhatsApp: number;
  companiesNoDirectContact: number;
  totalAnomalies: number;
  companies: ParsedCompany[];
  missingNumbers: number[];
  duplicateNumbers: number[];
}
