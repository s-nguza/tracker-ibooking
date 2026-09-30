// Pure business logic lives in src/domain: no React, no Firebase, no DOM,
// so it can be reused unchanged by a future native app.

/** All money is stored as integer cents. */
export type Cents = number;

export function formatCents(cents: Cents, currency = 'ZAR', locale = 'en-ZA'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
