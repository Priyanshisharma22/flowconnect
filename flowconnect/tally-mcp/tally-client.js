/**
 * Tally XML HTTP Client
 * Set MOCK_MODE=false and TALLY_URL=http://localhost:9000 in .env for live mode
 */

import 'dotenv/config';

const TALLY_URL  = process.env.TALLY_URL  || 'http://localhost:9000';
const TIMEOUT_MS = parseInt(process.env.TALLY_TIMEOUT || '10000');
const MOCK_MODE  = process.env.MOCK_MODE !== 'false'; // default: true

export function isMockMode() {
  return MOCK_MODE;
}

export async function tallyRequest(xml) {
  const res = await fetch(TALLY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xml,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Tally HTTP error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();

  // Check for Tally-level errors
  if (text.includes('<LINEERROR>')) {
    const match = text.match(/<LINEERROR>(.*?)<\/LINEERROR>/);
    throw new Error(`Tally error: ${match ? match[1] : 'Unknown error'}`);
  }

  return text;
}