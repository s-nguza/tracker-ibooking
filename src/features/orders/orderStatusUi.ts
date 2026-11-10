import {
  currentPause,
  type Order,
  type OrderChannel,
  type OrderStatus,
  type PaymentMethod,
  type ReadyEstimate,
  type RepeatCustomer,
} from '../../domain/orders';

export type BadgeTone = 'muted' | 'warn' | 'info' | 'ok' | 'alert' | 'quote';

export const BADGE_TONES: Record<BadgeTone, string> = {
  muted: 'bg-track text-ink-soft',
  warn: 'bg-warn-100 text-warn-800',
  info: 'bg-brand-100 text-brand-300',
  ok: 'bg-ok-100 text-ok-800',
  alert: 'bg-red-500/15 text-red-300',
  quote: 'bg-purple-500/20 text-purple-300',
};

export const PAYMENT_BADGE: Record<PaymentMethod, { label: string; tone: BadgeTone }> = {
  cash: { label: 'Cash payment', tone: 'ok' },
  card: { label: 'Card payment', tone: 'info' },
};

export type BoardTab = Extract<OrderStatus, 'confirmed' | 'preparing' | 'ready' | 'done'>;

export const BOARD_TABS: { value: BoardTab; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'done', label: 'Done' },
];

export function isBoardTab(value: string | null): value is BoardTab {
  return BOARD_TABS.some((tab) => tab.value === value);
}

/** The board tab an order is listed under. Quotes sit under Confirmed; cancelled ones aren't shown. */
export function boardTabFor(status: OrderStatus): BoardTab {
  if (status === 'awaiting' || status === 'cancelled') return 'confirmed';
  return status;
}

/** Board URL that opens on the tab where this order lives. */
export function boardUrlFor(status: OrderStatus): string {
  const tab = boardTabFor(status);
  return tab === 'confirmed' ? '/orders' : `/orders?tab=${tab}`;
}

export const STATUS_BADGE: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  awaiting: { label: 'Awaiting yes', tone: 'quote' },
  confirmed: { label: 'Confirmed', tone: 'warn' },
  preparing: { label: 'Preparing', tone: 'info' },
  ready: { label: 'Ready', tone: 'ok' },
  done: { label: 'Collected', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'alert' },
};

/** The order's tag: its status, or Paused while it's being held up. */
export function orderBadge(order: Order): { label: string; tone: BadgeTone } {
  return currentPause(order) ? { label: 'Paused', tone: 'warn' } : STATUS_BADGE[order.status];
}

/** Quick picks on the pause sheet; staff can also type their own. */
export const PAUSE_REASONS = [
  'Ran out of ingredients',
  'Waiting for stock',
  'Power cut',
  'Customer asked to wait',
];

/** The steps in the progress bar on the order screen. */
export const PROGRESS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'done', label: 'Collected' },
];

/** "Confirmed 9 min ago", "Started 4 min ago"… for the order screen. */
export function statusTimeLabel(status: OrderStatus, minutes: number): string {
  const ago = minutes === 0 ? 'just now' : `${minutes} min ago`;
  switch (status) {
    case 'awaiting':
      return `Quoted ${ago}`;
    case 'confirmed':
      return `Confirmed ${ago}`;
    case 'preparing':
      return `Started ${ago}`;
    case 'ready':
      return `Ready ${ago}`;
    case 'done':
      return `Collected ${ago}`;
    case 'cancelled':
      return `Cancelled ${ago}`;
  }
}

const NO_NAME_TITLE: Record<OrderChannel, string> = {
  call: 'Phone customer',
  whatsapp: 'WhatsApp customer',
  'walk-in': 'Walk-in customer',
};

const CHANNEL_PHRASE: Record<OrderChannel, string> = {
  call: 'called in',
  whatsapp: 'messaged in',
  'walk-in': 'walked in',
};

export function customerTitle(order: Order): string {
  return order.customerName ?? NO_NAME_TITLE[order.channel];
}

/** Line under the customer's name: "082 345 6712 · called in". */
export function customerSubtitle(order: Order, phone: string | undefined): string {
  if (phone) return `${phone} · ${CHANNEL_PHRASE[order.channel]}`;
  const stillHere =
    order.channel === 'walk-in' && order.status !== 'done' && order.status !== 'cancelled';
  return `${stillHere ? 'Waiting in-store' : capitalize(CHANNEL_PHRASE[order.channel])} · no number`;
}

/** "TM" for "Thabo M."; empty when there's no name to take initials from. */
export function customerInitials(name: string | undefined): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

const PREFERENCE: Record<OrderChannel, string> = {
  call: 'prefers calling',
  whatsapp: 'prefers WhatsApp',
  'walk-in': 'usually walks in',
};

export function describeRepeatCustomer(customer: RepeatCustomer): string {
  return `Repeat customer · ${PREFERENCE[customer.preferredChannel]}`;
}

/** How the ready time was worked out, one line per category the order needs. */
export function describeEstimate(estimate: ReadyEstimate): string[] {
  return estimate.categories.map(({ category, prepMinutes, ordersAhead, waitMinutes }) => {
    const make = `${category}: ${prepMinutes} min to make`;
    if (ordersAhead === 0) return `${make} · free now`;
    const orders = ordersAhead === 1 ? '1 order' : `${ordersAhead} orders`;
    return `${make} + ${waitMinutes} min for ${orders} ahead`;
  });
}

/** "08:30": a moment today on the 24-hour clock, as used in South Africa. */
export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
