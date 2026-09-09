/**
 * Payment platform auto-detection and column mapping.
 * Detects PayPal, Venmo, and Zelle CSV exports and maps their columns
 * to Flourish's gift/contact fields.
 */

export type PlatformType = 'paypal' | 'venmo' | 'zelle' | 'generic';

export interface PlatformDetectionResult {
  platform: PlatformType;
  confidence: number;
  suggestedMapping: Record<string, string>;
  paymentMethod: string;
  filterFn?: (row: Record<string, string>) => boolean;
}

// PayPal export column signatures
const PAYPAL_SIGNATURES = [
  'gross', 'fee', 'net', 'transaction id', 'from email address',
  'paypal reference id', 'invoice id',
];

// Venmo export column signatures
const VENMO_SIGNATURES = [
  'datetime', 'note', 'from', 'to', 'amount (total)',
  'amount (fee)', 'funding source',
];

// Zelle indicators (varies by bank, look for keyword)
const ZELLE_SIGNATURES = ['zelle'];

/**
 * Count how many signature columns match the given headers
 */
function countMatches(headers: string[], signatures: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  return signatures.filter((sig) =>
    normalized.some((h) => h.includes(sig))
  ).length;
}

/**
 * Auto-detect which payment platform a CSV came from based on column headers.
 */
export function detectPlatform(headers: string[]): PlatformDetectionResult {
  const normalized = headers.map((h) => h.toLowerCase().trim());

  // Check PayPal
  const paypalMatches = countMatches(headers, PAYPAL_SIGNATURES);
  if (paypalMatches >= 3) {
    return {
      platform: 'paypal',
      confidence: Math.min(1, paypalMatches / 5),
      suggestedMapping: buildPayPalMapping(normalized, headers),
      paymentMethod: 'paypal',
      filterFn: (row) => {
        const statusCol = findHeader(normalized, headers, ['status']);
        if (!statusCol) return true;
        return row[statusCol]?.toLowerCase() === 'completed';
      },
    };
  }

  // Check Venmo
  const venmoMatches = countMatches(headers, VENMO_SIGNATURES);
  if (venmoMatches >= 3) {
    return {
      platform: 'venmo',
      confidence: Math.min(1, venmoMatches / 5),
      suggestedMapping: buildVenmoMapping(normalized, headers),
      paymentMethod: 'venmo',
      filterFn: (row) => {
        const statusCol = findHeader(normalized, headers, ['status']);
        if (!statusCol) return true;
        const status = row[statusCol]?.toLowerCase();
        return status === 'complete' || status === 'completed';
      },
    };
  }

  // Check Zelle (look for "zelle" in any header or as part of header name)
  const zelleMatches = countMatches(headers, ZELLE_SIGNATURES);
  const hasZelleInHeaders = normalized.some((h) => h.includes('zelle'));
  if (zelleMatches > 0 || hasZelleInHeaders) {
    return {
      platform: 'zelle',
      confidence: 0.6,
      suggestedMapping: buildZelleMapping(normalized, headers),
      paymentMethod: 'zelle',
    };
  }

  return {
    platform: 'generic',
    confidence: 0,
    suggestedMapping: {},
    paymentMethod: 'other',
  };
}

/**
 * Find the original header that matches one of the patterns
 */
function findHeader(
  normalized: string[],
  originals: string[],
  patterns: string[],
): string | null {
  for (const pattern of patterns) {
    const idx = normalized.findIndex((h) => h.includes(pattern));
    if (idx !== -1) return originals[idx];
  }
  return null;
}

function buildPayPalMapping(
  normalized: string[],
  originals: string[],
): Record<string, string> {
  const mapping: Record<string, string> = {};

  // Name → full_name (PayPal has "Name" as single field)
  const nameCol = findHeader(normalized, originals, ['name']);
  if (nameCol) {
    mapping.full_name = nameCol;
  }

  // Email
  const emailCol = findHeader(normalized, originals, [
    'from email address', 'email',
  ]);
  if (emailCol) mapping.email = emailCol;

  // Amount (use Gross, not Net)
  const grossCol = findHeader(normalized, originals, ['gross']);
  if (grossCol) mapping.amount = grossCol;

  // Date
  const dateCol = findHeader(normalized, originals, ['date']);
  if (dateCol) mapping.gift_date = dateCol;

  // Notes
  const notesCol = findHeader(normalized, originals, [
    'note', 'item title', 'subject',
  ]);
  if (notesCol) mapping.notes = notesCol;

  return mapping;
}

function buildVenmoMapping(
  normalized: string[],
  originals: string[],
): Record<string, string> {
  const mapping: Record<string, string> = {};

  // From → contact name
  const fromCol = findHeader(normalized, originals, ['from']);
  if (fromCol) {
    mapping.full_name = fromCol;
  }

  // Amount
  const amountCol = findHeader(normalized, originals, [
    'amount (total)', 'amount',
  ]);
  if (amountCol) mapping.amount = amountCol;

  // Date
  const dateCol = findHeader(normalized, originals, ['datetime', 'date']);
  if (dateCol) mapping.gift_date = dateCol;

  // Note → notes/campaign
  const noteCol = findHeader(normalized, originals, ['note']);
  if (noteCol) mapping.notes = noteCol;

  return mapping;
}

function buildZelleMapping(
  normalized: string[],
  originals: string[],
): Record<string, string> {
  const mapping: Record<string, string> = {};

  // Sender/name
  const senderCol = findHeader(normalized, originals, [
    'sender', 'from', 'name',
  ]);
  if (senderCol) {
    mapping.full_name = senderCol;
  }

  // Amount
  const amountCol = findHeader(normalized, originals, ['amount']);
  if (amountCol) mapping.amount = amountCol;

  // Date
  const dateCol = findHeader(normalized, originals, ['date', 'transaction date']);
  if (dateCol) mapping.gift_date = dateCol;

  // Memo
  const memoCol = findHeader(normalized, originals, ['memo', 'note', 'description']);
  if (memoCol) mapping.notes = memoCol;

  return mapping;
}

/**
 * Get a user-friendly label for the detected platform
 */
export function getPlatformLabel(platform: PlatformType): string {
  switch (platform) {
    case 'paypal': return 'PayPal';
    case 'venmo': return 'Venmo';
    case 'zelle': return 'Zelle';
    default: return 'Unknown';
  }
}
