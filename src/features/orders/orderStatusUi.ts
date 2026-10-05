import type { OrderChannel, OrderStatus } from '../../domain/orders';

export type BadgeTone = 'muted' | 'brand' | 'alert';

export const BADGE_TONES: Record<BadgeTone, string> = {
  muted: 'bg-stone-100 text-stone-500',
  brand: 'bg-brand-100 text-brand-700',
  alert: 'bg-red-100 text-red-700',
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
  return tab === 'confirmed' ? '/' : `/?tab=${tab}`;
}

export const STATUS_BADGE: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  awaiting: { label: 'Awaiting yes', tone: 'brand' },
  confirmed: { label: 'Waiting to start', tone: 'brand' },
  preparing: { label: 'Preparing', tone: 'muted' },
  ready: { label: 'Ready for pickup', tone: 'brand' },
  done: { label: 'Collected', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'alert' },
};

/** "Waiting 9 min", "Started 4 min ago"… for the detail screen. */
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
      return `Ready since ${ago}`;
    case 'done':
      return `Collected ${ago}`;
    case 'cancelled':
      return `Cancelled ${ago}`;
  }
}

export const CHANNEL_LABEL: Record<OrderChannel, string> = {
  call: 'Phone order',
  whatsapp: 'WhatsApp order',
  'walk-in': 'Walk-in order',
};
