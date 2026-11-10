// Light or dark mode for the whole app. Dark is the default; the choice is remembered
// on this device only.

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'tracker-ibooking-theme';
/** Browser bar colour for each theme, matching the page background. */
const THEME_COLOR: Record<Theme, string> = { dark: '#0b0f1a', light: '#f3f4f7' };

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    // Storage can be blocked (private browsing); fall back to the default.
    return 'dark';
  }
}

/** Switches the colours (see index.css) and remembers the choice. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not remembered, but still applied for this visit.
  }
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}
