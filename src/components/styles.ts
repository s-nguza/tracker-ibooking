// Class names shared across screens, so the look stays consistent in one place.

export const SCREEN = 'mx-auto flex min-h-full w-full max-w-md flex-col';
export const CARD = 'rounded-3xl bg-white shadow-card';
export const SECTION_LABEL = 'text-sm font-bold tracking-wider text-muted uppercase';
export const ROUND_BUTTON =
  'flex size-12 items-center justify-center rounded-full bg-white text-ink shadow-card hover:bg-track';
export const BOTTOM_BAR = 'sticky bottom-0 z-10 rounded-t-4xl bg-white px-5 pt-5 pb-6 shadow-bar';

const BUTTON = 'flex h-14 w-full items-center justify-center rounded-2xl text-lg font-bold';
export const BUTTON_PRIMARY = `${BUTTON} bg-ink text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-track disabled:text-muted`;
export const BUTTON_OUTLINE = `${BUTTON} border border-line-strong bg-white text-ink hover:bg-canvas`;

export const SEGMENT_TRACK = 'flex gap-1 rounded-2xl bg-track p-1';

export function segmentClass(selected: boolean): string {
  return selected
    ? 'bg-white font-bold text-ink shadow-sm'
    : 'font-semibold text-muted hover:text-ink';
}
