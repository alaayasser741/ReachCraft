import { ParsedLink } from './types.js';

const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]()]+/gi;

export function extractAndClassifyUrls(text: string, labelContext: string = ''): ParsedLink[] {
  if (!text) return [];

  const matches = text.match(URL_REGEX) || [];
  const links: ParsedLink[] = [];
  const seen = new Set<string>();

  const lowerLabel = labelContext.toLowerCase();

  for (let match of matches) {
    // Clean trailing punctuation
    match = match.replace(/[.,;:)]+$/, '');

    let normalizedUrl = match;
    if (match.startsWith('www.')) {
      normalizedUrl = `https://${match}`;
    }

    if (seen.has(normalizedUrl.toLowerCase())) continue;
    seen.add(normalizedUrl.toLowerCase());

    const lowerUrl = normalizedUrl.toLowerCase();
    let type: ParsedLink['type'] = 'website';

    if (lowerUrl.includes('linkedin.com')) {
      type = 'linkedin';
    } else if (lowerUrl.includes('instagram.com')) {
      type = 'instagram';
    } else if (lowerUrl.includes('facebook.com')) {
      type = 'facebook';
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      type = 'x';
    } else if (
      lowerUrl.includes('qr.') ||
      lowerUrl.includes('forms.gle') ||
      lowerUrl.includes('forms.cloud.microsoft') ||
      lowerLabel.includes('qr')
    ) {
      type = 'qr_link';
    } else if (lowerUrl.includes('career') || lowerLabel.includes('career')) {
      type = 'careers';
    } else if (lowerLabel.includes('linkedin')) {
      type = 'linkedin';
    }

    links.push({
      type,
      url: normalizedUrl,
    });
  }

  return links;
}
