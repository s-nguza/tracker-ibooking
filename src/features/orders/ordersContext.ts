import { createContext, useContext } from 'react';
import type { Order } from '../../domain/orders';

/** What the new-order screen supplies; the store fills in the number, status and times. */
export type NewOrder = Omit<
  Order,
  'id' | 'queueNumber' | 'status' | 'createdAt' | 'statusChangedAt'
>;

export interface OrdersStore {
  orders: readonly Order[];
  /** The number the next order will get. */
  nextQueueNumber: number;
  addOrder: (order: NewOrder) => Order;
  advance: (orderId: string) => void;
  cancel: (orderId: string) => void;
}

export const OrdersContext = createContext<OrdersStore | null>(null);

export function useOrders(): OrdersStore {
  const store = useContext(OrdersContext);
  if (!store) throw new Error('useOrders must be used inside <OrdersProvider>');
  return store;
}
