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

/**
 * Order lifecycle:
 *   awaiting  → quoted to the customer (e.g. on WhatsApp), waiting for their "yes"
 *   confirmed → customer committed, waiting for the kitchen to start
 *   preparing → being made
 *   ready     → waiting for pickup
 *   done      → collected
 * Any order that is not done can be cancelled.
 */
export type OrderStatus = 'awaiting' | 'confirmed' | 'preparing' | 'ready' | 'done' | 'cancelled';

export interface OrderLine {
  itemId: string;
  name: string;
  quantity: number;
  priceCents: Cents;
}

export interface Order {
  id: string;
  queueNumber: number;
  channel: OrderChannel;
  customerName?: string;
  /** E.164, when the customer gave a number. */
  phone?: string;
  /** Name and price are copied at order time so later menu changes don't rewrite history. */
  lines: OrderLine[];
  totalCents: Cents;
  readyMinutes: number;
  status: OrderStatus;
  createdAt: number;
  /** When the order entered its current status; drives "Waiting 9 min". */
  statusChangedAt: number;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  awaiting: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'done',
};

/** Moves the order one step along its lifecycle. Done and cancelled orders are unchanged. */
export function advanceOrder(order: Order, now: number): Order {
  const next = NEXT_STATUS[order.status];
  return next ? { ...order, status: next, statusChangedAt: now } : order;
}

export function cancelOrder(order: Order, now: number): Order {
  if (order.status === 'done' || order.status === 'cancelled') return order;
  return { ...order, status: 'cancelled', statusChangedAt: now };
}

export function buildOrderLines(menu: readonly MenuItem[], lines: OrderLines): OrderLine[] {
  return selectedItems(menu, lines).map(({ item, quantity }) => ({
    itemId: item.id,
    name: item.name,
    quantity,
    priceCents: item.priceCents,
  }));
}

/** Oldest first, so the queue is served in order. */
export function byQueueNumber(a: Order, b: Order): number {
  return a.queueNumber - b.queueNumber;
}

export function nextQueueNumber(orders: readonly Order[], firstNumber = 1): number {
  return orders.reduce((max, order) => Math.max(max, order.queueNumber + 1), firstNumber);
}

/** Whole minutes between two timestamps, never negative. */
export function minutesBetween(from: number, to: number): number {
  return Math.max(0, Math.floor((to - from) / 60_000));
}

/** Who to call out: their name, or the channel when we don't have one. */
export function orderDisplayName(order: Pick<Order, 'customerName' | 'channel'>): string {
  if (order.customerName) return order.customerName;
  return { call: 'Caller', whatsapp: 'WhatsApp', 'walk-in': 'Walk-in' }[order.channel];
}

/**
 * WhatsApp orders start as a quote: the customer still has to reply "yes".
 * Calls and walk-ins have already committed by the time we enter them.
 */
export function initialStatus(channel: OrderChannel): OrderStatus {
  return channel === 'whatsapp' ? 'awaiting' : 'confirmed';
}
