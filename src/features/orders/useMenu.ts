import { useMemo } from 'react';
import { menuItems } from '../../domain/menu';
import { withLearnedPrepTimes } from '../../domain/orders';
import { useMenuStore } from '../menu/menuContext';
import { useOrders } from './ordersContext';

/** The menu to order from, with prep times updated from how long orders really took. */
export function useMenu() {
  const { orders } = useOrders();
  const { menu } = useMenuStore();
  return useMemo(() => withLearnedPrepTimes(menuItems(menu), orders), [menu, orders]);
}
