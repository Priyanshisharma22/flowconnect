/**
 * Tally XML Response Parsers
 * Parses raw XML from TallyPrime into clean JSON objects
 */

// ─── Ledger Parser ────────────────────────────────────────────────────────────

export function parseLedgers(xml) {
  const ledgers = [];
  const regex = /<LEDGER\s+NAME="([^"]*)"[^>]*>([\s\S]*?)<\/LEDGER>/gi;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const name    = decodeEntities(match[1]);
    const body    = match[2];
    const parent  = extractTag(body, 'PARENT');
    const closing = extractTag(body, 'CLOSINGBALANCE');
    const opening = extractTag(body, 'OPENINGBALANCE');

    ledgers.push({
      name,
      group:           decodeEntities(parent || ''),
      closing_balance: parseAmount(closing),
      opening_balance: parseAmount(opening),
    });
  }

  return ledgers;
}

// ─── Voucher Parser ───────────────────────────────────────────────────────────

export function parseVouchers(xml) {
  const vouchers = [];
  const regex = /<VOUCHER\s[^>]*>([\s\S]*?)<\/VOUCHER>/gi;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const body = match[1];
    vouchers.push({
      date:        formatDate(extractTag(body, 'DATE')),
      type:        decodeEntities(extractTag(body, 'VOUCHERTYPENAME') || ''),
      number:      extractTag(body, 'VOUCHERNUMBER') || '',
      party:       decodeEntities(extractTag(body, 'PARTYLEDGERNAME') || ''),
      narration:   decodeEntities(extractTag(body, 'NARRATION') || ''),
      amount:      parseAmount(extractTag(body, 'AMOUNT')),
    });
  }

  return vouchers;
}

// ─── Balance Sheet Parser ─────────────────────────────────────────────────────

export function parseBalanceSheet(xml) {
  // Basic extraction — enhance once you have real Tally response format
  return {
    raw_preview: xml.substring(0, 500),
    note: 'Full parsing available once live Tally response format is confirmed',
  };
}

// ─── P&L Parser ───────────────────────────────────────────────────────────────

export function parseProfitLoss(xml) {
  return {
    raw_preview: xml.substring(0, 500),
    note: 'Full parsing available once live Tally response format is confirmed',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
  return match ? match[1].trim() : null;
}

function parseAmount(str) {
  if (!str) return 0;
  // Tally amounts: positive = Dr, negative = Cr
  const cleaned = str.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

function formatDate(tallyDate) {
  if (!tallyDate || tallyDate.length !== 8) return tallyDate || '';
  return `${tallyDate.slice(0,4)}-${tallyDate.slice(4,6)}-${tallyDate.slice(6,8)}`;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}