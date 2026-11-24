import { createContext, useContext } from 'react';
import type { MenuItem, Order, OrderLines } from '../../domain/orders';

/** What the new-order screen supplies; the store fills in the number, status and times. */
export type NewOrder = Omit<
  Order,
  'id' | 'queueNumber' | 'status' | 'createdAt' | 'statusChangedAt' | 'readyBy'
>;

export interface OrdersStore {
  orders: readonly Order[];
  /** True until today's orders have loaded from the server. */
  loading: boolean;
  /** Why the last change didn't reach the server, or null. */
  syncError: string | null;
  /** The number the next order will get. */
  nextQueueNumber: number;
  /** With `asQuote`, the order waits for the customer's yes instead of going straight to the queue. */
  addOrder: (order: NewOrder, options?: { asQuote?: boolean }) => Order;
  advance: (orderId: string) => void;
  cancel: (orderId: string) => void;
  pause: (orderId: string, reason: string) => void;
  resume: (orderId: string) => void;
  /** Changes the items on a quote, or on an order that is confirmed or being prepared. */
  editItems: (orderId: string, menu: readonly MenuItem[], lines: OrderLines) => void;
  /** Blank text removes the request. */
  setSpecialRequest: (orderId: string, text: string) => void;
  /** Adds a number to an order that doesn't have one, e.g. a walk-in who'd like a text. */
  addPhone: (orderId: string, e164Phone: string) => void;
}

export const OrdersContext = createContext<OrdersStore | null>(null);

export function useOrders(): OrdersStore {
  const store = useContext(OrdersContext);
  if (!store) throw new Error('useOrders must be used inside <OrdersProvider>');
  return store;
}
