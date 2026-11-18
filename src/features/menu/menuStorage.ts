import type { Menu } from '../../domain/menu';

// The menu is saved in this browser until there's a backend. It survives a
// refresh, but not clearing site data, and isn't shared between devices.

const STORAGE_KEY = 'tracker-ibooking-menu';

export function loadMenu(): Menu | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const menu: unknown = JSON.parse(raw);
    return isMenu(menu) ? menu : null;
  } catch {
    return null;
  }
}

/** False when the browser wouldn't save it (private browsing, storage full). */
export function storeMenu(menu: Menu): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(menu));
    return true;
  } catch {
    return false;
  }
}

/** A light check that what's stored still has the shape the app expects. */
function isMenu(value: unknown): value is Menu {
  if (typeof value !== 'object' || value === null) return false;
  const { categories, items } = value as Partial<Menu>;
  return (
    Array.isArray(categories) &&
    Array.isArray(items) &&
    categories.every(
      (c) =>
        typeof c?.id === 'string' && typeof c.name === 'string' && typeof c.capacity === 'number',
    ) &&
    items.every(
      (i) =>
        typeof i?.id === 'string' &&
        typeof i.categoryId === 'string' &&
        typeof i.name === 'string' &&
        typeof i.priceCents === 'number' &&
        typeof i.prepMinutes === 'number' &&
        typeof i.soldOut === 'boolean',
    )
  );
}
