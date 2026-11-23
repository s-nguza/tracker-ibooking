import { useState, type ReactNode } from 'react';
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
import { isSupabaseConfigured } from '../../lib/supabase';
import { useKitchenCapacity } from '../menu/menuContext';
import { OrdersContext, type NewOrder, type OrdersStore } from './ordersContext';
import { createSampleOrders } from './sampleOrders';

/**
 * Holds today's orders in memory. Everything is lost on refresh until the
 * backend is chosen (Phase 1); this is the one place that will change then.
 */
export function OrdersProvider({ children }: { children: ReactNode }) {
  // Sample orders only in the offline demo; a real business starts with an empty board.
  const [orders, setOrders] = useState<Order[]>(() =>
    isSupabaseConfigured ? [] : createSampleOrders(Date.now()),
  );
  const capacity = useKitchenCapacity();

  /** `change` also gets today's full list, for anything that depends on the queue. */
  function update(
    orderId: string,
    change: (order: Order, now: number, orders: readonly Order[]) => Order,
  ) {
    const now = Date.now();
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? change(order, now, prev) : order)),
    );
  }

  const store: OrdersStore = {
    orders,
    nextQueueNumber: nextQueueNumber(orders),
    addOrder(newOrder: NewOrder, options) {
      const now = Date.now();
      const order: Order = {
        ...newOrder,
        id: crypto.randomUUID(),
        queueNumber: nextQueueNumber(orders),
        status: options?.asQuote ? 'awaiting' : 'confirmed',
        readyBy: options?.asQuote ? undefined : readyByTime(now, newOrder.readyMinutes),
        createdAt: now,
        statusChangedAt: now,
      };
      setOrders((prev) => [...prev, order]);
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
      update(orderId, (order) => ({ ...order, specialRequest: text.trim() || undefined })),
    addPhone: (orderId, phone) => update(orderId, (order) => ({ ...order, phone })),
  };

  return <OrdersContext value={store}>{children}</OrdersContext>;
}
