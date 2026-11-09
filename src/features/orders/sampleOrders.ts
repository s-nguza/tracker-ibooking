import {
  orderPrepMinutes,
  readyByTime,
  toOrderLines,
  type Order,
  type OrderChannel,
  type OrderLine,
  type OrderStatus,
} from '../../domain/orders';
import { SAMPLE_MENU } from './sampleMenu';

// Placeholder business and orders until the backend exists, so the board
// has something realistic to show on first load.
export const BUSINESS_NAME = 'Mama Rosie’s Kitchen';

const MINUTE = 60_000;

function line(itemId: string, quantity: number): OrderLine {
  const item = SAMPLE_MENU.find((i) => i.id === itemId);
  if (!item) throw new Error(`Unknown sample menu item: ${itemId}`);
  return {
    itemId,
    name: item.name,
    category: item.category,
    prepMinutes: item.prepMinutes,
    quantity,
    priceCents: item.priceCents,
  };
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
    paymentMethod: queueNumber % 2 === 0 ? 'card' : 'cash',
    customerName,
    lines,
    totalCents,
    prepMinutes: orderPrepMinutes(SAMPLE_MENU, toOrderLines(lines)),
    readyMinutes: 15,
    readyBy: readyByTime(statusChangedAt, 15),
    status,
    createdAt: statusChangedAt - 10 * MINUTE,
    statusChangedAt,
    startedAt: status === 'preparing' ? statusChangedAt : undefined,
  };
}

/** Thabo has ordered before, so typing this number on the new-order screen recognises them. */
const THABO_PHONE = '+27823456712';

export function createSampleOrders(now: number): Order[] {
  return [
    sample(now, 8, 'walk-in', undefined, [line('kota', 1)], 'done', 95),
    {
      ...sample(now, 9, 'whatsapp', 'Thabo M.', [line('vetkoek-mince', 2)], 'done', 80),
      phone: THABO_PHONE,
    },
    sample(now, 10, 'walk-in', 'Ayanda', [line('kota', 1), line('coke-330ml', 1)], 'done', 64),
    {
      ...sample(now, 11, 'whatsapp', 'Thabo M.', [line('kota', 3)], 'done', 48),
      phone: THABO_PHONE,
    },
    sample(
      now,
      12,
      'walk-in',
      undefined,
      [line('vetkoek-mince', 1), line('fruit-juice-330ml', 1)],
      'done',
      30,
    ),
    sample(now, 13, 'call', 'Lebo', [line('kota', 1), line('chips-small', 1)], 'ready', 2),
    {
      ...sample(
        now,
        14,
        'call',
        'Thabo M.',
        [line('kota', 1), line('coke-330ml', 1)],
        'preparing',
        4,
      ),
      phone: THABO_PHONE,
      // Already past its ready time, so the board has a late order to show.
      readyBy: now - 3 * MINUTE,
    },
    sample(now, 15, 'call', 'Nomvula K.', [line('vetkoek-mince', 2)], 'confirmed', 9),
    sample(now, 16, 'walk-in', undefined, [line('vetkoek-mince', 1)], 'cancelled', 6),
    sample(now, 17, 'walk-in', undefined, [line('kota', 2)], 'confirmed', 1),
    {
      ...sample(now, 18, 'whatsapp', 'Sipho D.', [line('kota', 2)], 'awaiting', 0),
      phone: '+27821234567',
    },
  ];
}
