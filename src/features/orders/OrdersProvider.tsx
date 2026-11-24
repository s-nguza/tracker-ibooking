import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  advanceOrder,
  cancelOrder,
  confirmQuote,
  editOrderItems,
  nextQueueNumber,
  pauseOrder,
  readyByTime,
  resumeOrder,
  type Order,
} from '../../domain/orders';
import { listenForChanges } from '../../lib/live';
import { useAuth } from '../auth/authContext';
import { useKitchenCapacity } from '../menu/menuContext';
import { businessDayOf } from './orderRows';
import { fetchOrders, insertOrder, saveOrderChanges } from './ordersApi';
import { OrdersContext, type NewOrder, type OrdersStore } from './ordersContext';
import { createSampleOrders } from './sampleOrders';
import { useNow } from './useNow';

const NOT_SAVED =
  'Couldn’t save to the server. Check your internet connection; the board will catch up when it’s back.';

/**
 * Today's orders. Signed in, they live in Supabase: every change shows straight away,
 * is saved in the background, and reaches the business's other phones live. In the
 * offline demo they're sample orders kept in memory.
 */
export function OrdersProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const businessId = state.status === 'ready' ? state.business.id : null;
  const capacity = useKitchenCapacity();
  const now = useNow();

  const [orders, setOrdersState] = useState<Order[]>(() =>
    businessId ? [] : createSampleOrders(Date.now()),
  );
  const [loading, setLoading] = useState(businessId !== null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // The latest list, so changes made one after another each build on the last.
  const current = useRef(orders);
  const setOrders = (next: Order[]) => {
    current.current = next;
    setOrdersState(next);
  };
  // Writes go one at a time, in the order they were made.
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const pendingWrites = useRef(0);
  const reloadAfterWrites = useRef(false);

  const reload = useCallback(async () => {
    if (!businessId) return;
    // A reload mid-save could briefly undo what's on screen; wait for the saves instead.
    if (pendingWrites.current > 0) {
      reloadAfterWrites.current = true;
      return;
    }
    const result = await fetchOrders(businessId, businessDayOf(Date.now()));
    if (pendingWrites.current > 0) {
      reloadAfterWrites.current = true;
      return;
    }
    if ('error' in result) {
      setSyncError(`Couldn’t load today’s orders (${result.error}).`);
    } else {
      current.current = result.orders;
      setOrdersState(result.orders);
      setSyncError(null);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    // Started just after the effect, so the first load is like any later one.
    queueMicrotask(() => void reload());
    return listenForChanges('orders', businessId, ['orders', 'order_lines', 'order_pauses'], () => {
      void reload();
    });
  }, [businessId, reload]);

  /** Runs a save after the ones before it, then catches up with other phones if they changed things. */
  function write(save: () => Promise<string | null>) {
    if (!businessId) return;
    pendingWrites.current += 1;
    writes.current = writes.current.then(async () => {
      const error = await save();
      pendingWrites.current -= 1;
      if (error) setSyncError(`${NOT_SAVED} (${error})`);
      if (pendingWrites.current === 0 && (reloadAfterWrites.current || error)) {
        reloadAfterWrites.current = false;
        await reload();
      }
    });
  }

  /** `change` also gets the full list, for anything that depends on the queue. */
  function update(
    orderId: string,
    change: (order: Order, now: number, orders: readonly Order[]) => Order,
  ) {
    const all = current.current;
    const prev = all.find((o) => o.id === orderId);
    if (!prev) return;
    const next = change(prev, Date.now(), all);
    if (next === prev) return;
    setOrders(all.map((o) => (o.id === orderId ? next : o)));
    if (businessId) write(() => saveOrderChanges(prev, next, businessId));
  }

  const today = businessDayOf(now);
  const todays = orders.filter((o) => !o.businessDay || o.businessDay === today);

  const store: OrdersStore = {
    orders,
    loading,
    syncError,
    nextQueueNumber: nextQueueNumber(todays),
    addOrder(newOrder: NewOrder, options) {
      const now = Date.now();
      const day = businessDayOf(now);
      const order: Order = {
        ...newOrder,
        id: crypto.randomUUID(),
        businessDay: day,
        queueNumber: nextQueueNumber(
          current.current.filter((o) => !o.businessDay || o.businessDay === day),
        ),
        status: options?.asQuote ? 'awaiting' : 'confirmed',
        readyBy: options?.asQuote ? undefined : readyByTime(now, newOrder.readyMinutes),
        createdAt: now,
        statusChangedAt: now,
      };
      setOrders([...current.current, order]);
      if (businessId) {
        write(async () => {
          const result = await insertOrder(order, businessId);
          if ('error' in result) return result.error;
          // Another phone took this number first: show the one it really got.
          if (result.queueNumber !== order.queueNumber) {
            setOrders(
              current.current.map((o) =>
                o.id === order.id ? { ...o, queueNumber: result.queueNumber } : o,
              ),
            );
          }
          return null;
        });
      }
      return order;
    },
    advance: (orderId) =>
      update(orderId, (order, now, all) =>
        order.status === 'awaiting'
          ? confirmQuote(order, all, capacity, now)
          : advanceOrder(order, now),
      ),
    cancel: (orderId) => update(orderId, cancelOrder),
    pause: (orderId, reason) => update(orderId, (order, now) => pauseOrder(order, reason, now)),
    resume: (orderId) => update(orderId, resumeOrder),
    editItems: (orderId, menu, lines) =>
      update(orderId, (order, now, all) => editOrderItems(order, menu, lines, all, capacity, now)),
    setSpecialRequest: (orderId, text) =>
      update(orderId, (order) => {
        const specialRequest = text.trim() || undefined;
        return specialRequest === order.specialRequest ? order : { ...order, specialRequest };
      }),
    addPhone: (orderId, phone) => update(orderId, (order) => ({ ...order, phone })),
  };

  return <OrdersContext value={store}>{children}</OrdersContext>;
}
