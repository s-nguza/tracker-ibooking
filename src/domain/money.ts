// Pure business logic lives in src/domain: no React, no backend SDK, no DOM,
// so it can be reused unchanged by a future native app.

/** All money is stored as integer cents. */
export type Cents = number;

const AMOUNT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats as "R35.00". Built by hand because Intl's currency styles add a space after the R. */
export function formatCents(cents: Cents): string {
  return `R${AMOUNT.format(cents / 100)}`;
}
