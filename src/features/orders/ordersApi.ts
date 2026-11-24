import type { Order } from '../../domain/orders';
import { supabase } from '../../lib/supabase';
import {
  lineRows,
  ORDER_SELECT,
  orderToRow,
  pauseRow,
  rowToOrder,
  sortLines,
  type OrderWithChildren,
} from './orderRows';

// Orders in Supabase. Each function returns an error message, or null on success.

const OPEN_STATUSES = '(awaiting,confirmed,preparing,ready)';

/** Today's orders, plus any from earlier days that still aren't finished. */
export async function fetchOrders(
  businessId: string,
  today: string,
): Promise<{ orders: Order[] } | { error: string }> {
  if (!supabase) return { orders: [] };
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('business_id', businessId)
    .or(`business_day.eq.${today},status.in.${OPEN_STATUSES}`)
    .order('business_day')
    .order('queue_number');
  if (error) return { error: error.message };
  return { orders: (data as OrderWithChildren[]).map(rowToOrder) };
}

/**
 * Saves a new order with its lines. If another phone took the same queue number a
 * moment earlier, the order moves to the next free number. Returns the number used.
 */
export async function insertOrder(
  order: Order,
  businessId: string,
): Promise<{ queueNumber: number } | { error: string }> {
  if (!supabase) return { queueNumber: order.queueNumber };
  let row = orderToRow(order, businessId);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase.from('orders').insert(row);
    if (!error) break;
    // 23505: unique queue number for the day already used.
    if (error.code !== '23505') return { error: error.message };
    const { data, error: lookupError } = await supabase
      .from('orders')
      .select('queue_number')
      .eq('business_id', businessId)
      .eq('business_day', row.business_day)
      .order('queue_number', { ascending: false })
      .limit(1);
    if (lookupError) return { error: lookupError.message };
    row = { ...row, queue_number: (data?.[0]?.queue_number ?? 0) + 1 };
    if (attempt === 4) return { error: 'Couldn’t find a free queue number. Try again.' };
  }

  const lines = lineRows(order, businessId);
  if (lines.length > 0) {
    const { error } = await supabase.from('order_lines').insert(lines);
    if (error) return { error: error.message };
  }
  return { queueNumber: row.queue_number };
}

/** Saves what changed between two versions of the same order. */
export async function saveOrderChanges(
  prev: Order,
  next: Order,
  businessId: string,
): Promise<string | null> {
  if (!supabase) return null;

  // Rewriting business_id and created_at with the same values is harmless.
  const { id, ...fields } = orderToRow(next, businessId);
  const update = await supabase.from('orders').update(fields).eq('id', id);
  if (update.error) return update.error.message;

  const comparable = (order: Order) => JSON.stringify(sortLines(lineRows(order, businessId)));
  if (comparable(prev) !== comparable(next)) {
    const removed = await supabase.from('order_lines').delete().eq('order_id', id);
    if (removed.error) return removed.error.message;
    const lines = lineRows(next, businessId);
    if (lines.length > 0) {
      const added = await supabase.from('order_lines').insert(lines);
      if (added.error) return added.error.message;
    }
  }

  const before = new Map((prev.pauses ?? []).map((p) => [p.pausedAt, p]));
  for (const pause of next.pauses ?? []) {
    const old = before.get(pause.pausedAt);
    const row = pauseRow(next, pause, businessId);
    if (!old) {
      const { error } = await supabase.from('order_pauses').insert(row);
      if (error) return error.message;
    } else if (old.resumedAt !== pause.resumedAt) {
      const { error } = await supabase
        .from('order_pauses')
        .update({ resumed_at: row.resumed_at })
        .eq('order_id', id)
        .eq('paused_at', row.paused_at);
      if (error) return error.message;
    }
  }
  return null;
}
