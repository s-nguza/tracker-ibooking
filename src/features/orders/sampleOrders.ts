import type { Order, OrderChannel, OrderLine, OrderStatus } from '../../domain/orders';
import { SAMPLE_MENU } from './sampleMenu';

// Placeholder business and orders until the backend exists, so the board
// has something realistic to show on first load.
export const BUSINESS_NAME = 'Mama Rosie’s Kitchen';

const MINUTE = 60_000;

function line(itemId: string, quantity: number): OrderLine {
  const item = SAMPLE_MENU.find((i) => i.id === itemId);
  if (!item) throw new Error(`Unknown sample menu item: ${itemId}`);
  return { itemId, name: item.name, quantity, priceCents: item.priceCents };
}

function sample(
  now: number,
  queueNumber: number,
  channel: OrderChannel,
  customerName: string | undefined,
  lines: OrderLine[],
  status: OrderStatus,
  minutesInStatus: number,
): Order {
  const totalCents = lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
  const statusChangedAt = now - minutesInStatus * MINUTE;
  return {
    id: `sample-${queueNumber}`,
    queueNumber,
    channel,
    customerName,
    lines,
    totalCents,
    readyMinutes: 15,
    status,
    createdAt: statusChangedAt - 10 * MINUTE,
    statusChangedAt,
  };
}

export function createSampleOrders(now: number): Order[] {
  return [
    sample(now, 8, 'walk-in', undefined, [line('kota', 1)], 'done', 95),
    sample(now, 9, 'call', 'Bongani', [line('vetkoek', 2)], 'done', 80),
    sample(now, 10, 'walk-in', 'Ayanda', [line('kota', 1), line('coke', 1)], 'done', 64),
    sample(now, 11, 'whatsapp', 'Karabo', [line('kota', 3)], 'done', 48),
    sample(now, 12, 'walk-in', undefined, [line('vetkoek', 1), line('juice', 1)], 'done', 30),
    sample(now, 13, 'call', 'Lebo', [line('kota', 1), line('chips', 1)], 'ready', 2),
    sample(now, 14, 'walk-in', 'Thandi M.', [line('kota', 1), line('coke', 1)], 'preparing', 4),
    sample(now, 15, 'call', 'Nomvula K.', [line('vetkoek', 2)], 'confirmed', 9),
    sample(now, 16, 'walk-in', undefined, [line('vetkoek', 1)], 'cancelled', 6),
    sample(now, 17, 'walk-in', undefined, [line('kota', 2)], 'confirmed', 1),
    sample(now, 18, 'whatsapp', 'Sipho D.', [line('kota', 2)], 'awaiting', 0),
  ];
}
