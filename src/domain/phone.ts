// South African mobile/landline numbers, as typed at the counter.

/**
 * Normalises a South African phone number to E.164 (+27XXXXXXXXX).
 * Accepts "082 123 4567", "0821234567", "27821234567" and "+27 82 123 4567".
 * Returns null when the input is not a valid number.
 */
export function normalizeZaPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return null;

  if (digits.length === 10 && digits.startsWith('0')) return `+27${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('27')) return `+${digits}`;
  return null;
}
