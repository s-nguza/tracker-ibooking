import type { Cents } from './money';

/** How the order reached the business. */
export type OrderChannel = 'call' | 'whatsapp' | 'walk-in';

export type MenuCategory = 'meals' | 'drinks' | 'extras';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  priceCents: Cents;
  prepMinutes: number;
  soldOut?: boolean;
}

/** Quantity per menu item id. Items with quantity 0 are removed. */
export type OrderLines = Readonly<Record<string, number>>;

export type FieldRule = 'required' | 'optional';

export interface ContactRules {
  name: FieldRule;
  phone: FieldRule;
}

/**
 * What we need to know about the customer for each channel:
 * - call: a name to shout out when they arrive; number is handy for call-backs
 * - whatsapp: the number is how we reply, so it is required
 * - walk-in: they are standing there, so the queue number is enough
 */
export const CONTACT_RULES: Record<OrderChannel, ContactRules> = {
  call: { name: 'required', phone: 'optional' },
  whatsapp: { name: 'optional', phone: 'required' },
  'walk-in': { name: 'optional', phone: 'optional' },
};

/** Extra minutes added on top of the slowest item for packing and handover. */
const HANDOVER_BUFFER_MINUTES = 5;

export function setLineQuantity(lines: OrderLines, itemId: string, quantity: number): OrderLines {
  const next = { ...lines };
  if (quantity > 0) next[itemId] = quantity;
  else delete next[itemId];
  return next;
}

export function selectedItems(menu: readonly MenuItem[], lines: OrderLines) {
  return menu
    .filter((item) => (lines[item.id] ?? 0) > 0)
    .map((item) => ({ item, quantity: lines[item.id]! }));
}

export function orderItemCount(lines: OrderLines): number {
  return Object.values(lines).reduce((sum, qty) => sum + qty, 0);
}

export function orderTotalCents(menu: readonly MenuItem[], lines: OrderLines): Cents {
  return selectedItems(menu, lines).reduce(
    (sum, { item, quantity }) => sum + item.priceCents * quantity,
    0,
  );
}

/**
 * Rough ready time to tell the customer: items are cooked in parallel, so it is
 * the slowest item plus a handover buffer, rounded up to the next 5 minutes.
 * Returns 0 for an empty order.
 */
export function estimateReadyMinutes(menu: readonly MenuItem[], lines: OrderLines): number {
  const selected = selectedItems(menu, lines);
  if (selected.length === 0) return 0;

  const slowest = Math.max(...selected.map(({ item }) => item.prepMinutes));
  return Math.ceil((slowest + HANDOVER_BUFFER_MINUTES) / 5) * 5;
}
