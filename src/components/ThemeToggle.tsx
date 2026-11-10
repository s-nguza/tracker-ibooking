import { useState } from 'react';
import { MoonIcon, SunIcon } from './icons';
import { applyTheme, currentTheme, type Theme } from './theme';

/** Round button that flips between dark and light mode. It shows the mode it switches to. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      aria-label={label}
      title={label}
      className="border-line-strong bg-surface hover:bg-track flex size-11 shrink-0 items-center justify-center rounded-full border"
    >
      {next === 'light' ? (
        <SunIcon width={20} height={20} strokeWidth={2} />
      ) : (
        <MoonIcon width={20} height={20} strokeWidth={2} />
      )}
    </button>
  );
}
