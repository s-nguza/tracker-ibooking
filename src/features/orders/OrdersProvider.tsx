import { useState, type ReactNode } from 'react';
import {
  advanceOrder,
  cancelOrder,
  initialStatus,
  nextQueueNumber,
  type Order,
} from '../../domain/orders';
import { OrdersContext, type NewOrder, type OrdersStore } from './ordersContext';
import { createSampleOrders } from './sampleOrders';

/**
 * Holds today's orders in memory. Everything is lost on refresh until the
 * backend is chosen (Phase 1); this is the one place that will change then.
 */
export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => createSampleOrders(Date.now()));

  function update(orderId: string, change: (order: Order, now: number) => Order) {
    const now = Date.now();
    setOrders((prev) => prev.map((order) => (order.id === orderId ? change(order, now) : order)));
  }

  const store: OrdersStore = {
    orders,
    nextQueueNumber: nextQueueNumber(orders),
    addOrder(newOrder: NewOrder) {
      const now = Date.now();
      const order: Order = {
        ...newOrder,
        id: crypto.randomUUID(),
        queueNumber: nextQueueNumber(orders),
        status: initialStatus(newOrder.channel),
        createdAt: now,
        statusChangedAt: now,
      };
      setOrders((prev) => [...prev, order]);
      return order;
    },
    advance: (orderId) => update(orderId, advanceOrder),
    cancel: (orderId) => update(orderId, cancelOrder),
  };

  return <OrdersContext value={store}>{children}</OrdersContext>;
}
