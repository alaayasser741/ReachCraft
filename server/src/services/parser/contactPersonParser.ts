export interface ParsedPerson {
  personName: string;
  jobTitle: string | null;
}

export function parseContactPerson(raw: string): ParsedPerson {
  if (!raw) {
    return { personName: '', jobTitle: null };
  }

  const cleaned = raw.trim();

  // Pattern: "Name (Job Title)"
  const parenMatch = cleaned.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    return {
      personName: parenMatch[1].trim(),
      jobTitle: parenMatch[2].trim(),
    };
  }

  // Pattern: "Name - Job Title"
  const dashMatch = cleaned.match(/^([^-]+)\s*-\s*(.+)$/);
  if (dashMatch) {
    return {
      personName: dashMatch[1].trim(),
      jobTitle: dashMatch[2].trim(),
    };
  }

  return {
    personName: cleaned,
    jobTitle: null,
  };
}
