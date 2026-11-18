import type { Menu } from '../../domain/menu';
import kasiMenu from './kasi-menu.json';

/** "Vetkoek & mince" becomes "vetkoek-mince". */
function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Ready-made menu for kota and kasi food businesses, so owners edit names and
 * prices instead of typing everything. Item ids are the slug of the name, which
 * the sample orders rely on. Every category starts able to cook one order at a time.
 */
export const KASI_MENU: Menu = (() => {
  const sorted = [...kasiMenu.menu_items].sort((a, b) => a.sort_order - b.sort_order);
  const names = [...new Set(sorted.map((item) => item.category))];
  return {
    categories: names.map((name) => ({ id: `category-${toId(name)}`, name, capacity: 1 })),
    items: sorted.map((item) => ({
      id: toId(item.name),
      categoryId: `category-${toId(item.category)}`,
      name: item.name,
      priceCents: item.price_cents,
      prepMinutes: item.prep_minutes,
      soldOut: !item.is_available,
    })),
  };
})();

export const EMPTY_MENU: Menu = { categories: [], items: [] };
