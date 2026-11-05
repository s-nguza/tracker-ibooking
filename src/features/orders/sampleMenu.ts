import type { MenuItem } from '../../domain/orders';
import kasiMenu from './kasi-menu.json';

/** "Vetkoek & mince" becomes "vetkoek-mince". */
function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// The menu for now, until the menu feature and backend exist. To change it, edit kasi-menu.json.
export const SAMPLE_MENU: MenuItem[] = [...kasiMenu.menu_items]
  .sort((a, b) => a.sort_order - b.sort_order)
  .map((item) => ({
    id: toId(item.name),
    name: item.name,
    category: item.category,
    priceCents: item.price_cents,
    prepMinutes: item.prep_minutes,
    soldOut: !item.is_available,
  }));
