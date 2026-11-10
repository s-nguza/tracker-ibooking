// Class names shared across screens, so the look stays consistent in one place.

export const SCREEN = 'mx-auto flex min-h-full w-full max-w-md flex-col';
export const CARD = 'rounded-3xl border border-line bg-surface shadow-card';
export const SECTION_LABEL = 'text-sm font-bold tracking-wider text-muted uppercase';
export const ROUND_BUTTON =
  'flex size-12 items-center justify-center rounded-full border border-line-strong bg-canvas text-ink hover:bg-track';
export const BOTTOM_BAR = 'sticky bottom-0 z-10 rounded-t-4xl bg-surface px-5 pt-5 pb-6 shadow-bar';

const BUTTON = 'flex h-14 w-full items-center justify-center rounded-2xl text-lg font-bold';
export const BUTTON_PRIMARY = `${BUTTON} bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-track disabled:text-muted`;
export const BUTTON_OUTLINE = `${BUTTON} border border-line-strong text-ink hover:bg-canvas`;

export const SEGMENT_TRACK = 'flex gap-1 rounded-2xl bg-track p-1';

export function segmentClass(selected: boolean): string {
  return selected
    ? 'bg-brand-600 font-bold text-white shadow-sm'
    : 'font-semibold text-muted hover:text-ink';
}
