import { useMemo } from 'react';
import { withLearnedPrepTimes } from '../../domain/orders';
import { useOrders } from './ordersContext';
import { SAMPLE_MENU } from './sampleMenu';

/** The menu to order from, with prep times updated from how long orders really took. */
export function useMenu() {
  const { orders } = useOrders();
  return useMemo(() => withLearnedPrepTimes(SAMPLE_MENU, orders), [orders]);
}
