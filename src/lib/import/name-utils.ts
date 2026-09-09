const PREFIXES = new Set([
  'mr', 'mrs', 'ms', 'miss', 'dr', 'rev', 'prof',
  'sir', 'madam', 'fr', 'br', 'sr', 'hon',
]);

const SUFFIXES = new Set([
  'jr', 'sr', 'ii', 'iii', 'iv', 'v',
  'phd', 'md', 'esq', 'dds', 'rn', 'do',
  'cpa', 'jd', 'dvm',
]);

/** Split a full name string into first_name and last_name. */
export function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');

  if (!trimmed) {
    return { first_name: '', last_name: '' };
  }

  // Handle "Last, First" comma format
  if (trimmed.includes(',')) {
    const [lastPart, ...firstParts] = trimmed.split(',').map((s) => s.trim());
    const firstRaw = firstParts.join(' ').trim();
    const first = stripPrefixes(stripSuffixes(firstRaw));
    const last = stripPrefixes(stripSuffixes(lastPart));
    return {
      first_name: first || last,
      last_name: first ? last : '',
    };
  }

  const stripped = stripPrefixes(stripSuffixes(trimmed));
  const parts = stripped.split(' ');

  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' };
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' '),
  };
}

function stripPrefixes(name: string): string {
  const parts = name.split(' ');
  while (parts.length > 1) {
    const candidate = parts[0].replace(/\.$/, '').toLowerCase();
    if (PREFIXES.has(candidate)) {
      parts.shift();
    } else {
      break;
    }
  }
  return parts.join(' ');
}

function stripSuffixes(name: string): string {
  const parts = name.split(' ');
  while (parts.length > 1) {
    const candidate = parts[parts.length - 1].replace(/[.,]$/g, '').toLowerCase();
    if (SUFFIXES.has(candidate)) {
      parts.pop();
    } else {
      break;
    }
  }
  return parts.join(' ');
}
