import type { Order, OrderLine, OrderPause, OrderStatus } from '../../domain/orders';

// Converting between the app's Order (times in ms) and Supabase rows (ISO times).
// See supabase/migrations for the tables.

export interface LineRow {
  id?: string;
  order_id: string;
  business_id: string;
  item_id: string | null;
  name: string;
  category: string;
  prep_minutes: number;
  quantity: number;
  price_cents: number;
}

export interface PauseRow {
  order_id: string;
  business_id: string;
  reason: string;
  paused_at: string;
  resumed_at: string | null;
}

export interface OrderRow {
  id: string;
  business_id: string;
  business_day: string;
  queue_number: number;
  channel: Order['channel'];
  payment_method: Order['paymentMethod'];
  customer_name: string | null;
  phone: string | null;
  special_request: string | null;
  total_cents: number;
  prep_minutes: number;
  ready_minutes: number;
  ready_by: string | null;
  status: OrderStatus;
  created_at: string;
  status_changed_at: string;
  started_at: string | null;
  ready_at: string | null;
  edited_while_cooking: boolean;
}

export type OrderWithChildren = OrderRow & { order_lines: LineRow[]; order_pauses: PauseRow[] };

/** Every column, plus the order's lines and pauses, in one request. */
export const ORDER_SELECT = '*, order_lines(*), order_pauses(*)';

const iso = (ms: number) => new Date(ms).toISOString();
const isoOrNull = (ms: number | undefined) => (ms === undefined ? null : iso(ms));
const ms = (value: string) => Date.parse(value);
const msOrUndefined = (value: string | null) => (value === null ? undefined : Date.parse(value));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "2026-11-23": the day in South Africa, which is when queue numbers restart. */
export function businessDayOf(at: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(at);
}

/** Lines in a stable order, so comparing two versions of an order isn't fooled by order. */
export function sortLines<T extends { category: string; name: string }>(lines: T[]): T[] {
  return [...lines].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}

export function rowToOrder(row: OrderWithChildren): Order {
  return {
    id: row.id,
    queueNumber: row.queue_number,
    businessDay: row.business_day,
    channel: row.channel,
    paymentMethod: row.payment_method,
    customerName: row.customer_name ?? undefined,
    phone: row.phone ?? undefined,
    specialRequest: row.special_request ?? undefined,
    lines: sortLines(row.order_lines).map((line): OrderLine => ({
      // Lines whose menu item was deleted keep their own id, so they still work in the app.
      itemId: line.item_id ?? line.id ?? line.name,
      name: line.name,
      category: line.category,
      prepMinutes: line.prep_minutes,
      quantity: line.quantity,
      priceCents: line.price_cents,
    })),
    totalCents: row.total_cents,
    prepMinutes: row.prep_minutes,
    readyMinutes: row.ready_minutes,
    readyBy: msOrUndefined(row.ready_by),
    status: row.status,
    createdAt: ms(row.created_at),
    statusChangedAt: ms(row.status_changed_at),
    startedAt: msOrUndefined(row.started_at),
    readyAt: msOrUndefined(row.ready_at),
    pauses: [...row.order_pauses]
      .sort((a, b) => ms(a.paused_at) - ms(b.paused_at))
      .map((pause): OrderPause => ({
        reason: pause.reason,
        pausedAt: ms(pause.paused_at),
        resumedAt: msOrUndefined(pause.resumed_at),
      })),
    editedWhileCooking: row.edited_while_cooking,
  };
}

export function orderToRow(order: Order, businessId: string): OrderRow {
  return {
    id: order.id,
    business_id: businessId,
    business_day: order.businessDay ?? businessDayOf(order.createdAt),
    queue_number: order.queueNumber,
    channel: order.channel,
    payment_method: order.paymentMethod,
    customer_name: order.customerName ?? null,
    phone: order.phone ?? null,
    special_request: order.specialRequest ?? null,
    total_cents: order.totalCents,
    prep_minutes: order.prepMinutes,
    ready_minutes: order.readyMinutes,
    ready_by: isoOrNull(order.readyBy),
    status: order.status,
    created_at: iso(order.createdAt),
    status_changed_at: iso(order.statusChangedAt),
    started_at: isoOrNull(order.startedAt),
    ready_at: isoOrNull(order.readyAt),
    edited_while_cooking: order.editedWhileCooking ?? false,
  };
}

export function lineRows(order: Order, businessId: string): LineRow[] {
  return order.lines.map((line) => ({
    order_id: order.id,
    business_id: businessId,
    // Only real menu items link back; template items (readable ids) are kept as a copy only.
    item_id: UUID.test(line.itemId) ? line.itemId : null,
    name: line.name,
    category: line.category,
    prep_minutes: line.prepMinutes,
    quantity: line.quantity,
    price_cents: line.priceCents,
  }));
}

export function pauseRow(order: Order, pause: OrderPause, businessId: string): PauseRow {
  return {
    order_id: order.id,
    business_id: businessId,
    reason: pause.reason,
    paused_at: iso(pause.pausedAt),
    resumed_at: isoOrNull(pause.resumedAt),
  };
}
