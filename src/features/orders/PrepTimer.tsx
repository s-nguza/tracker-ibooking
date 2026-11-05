import { cookingMs, formatElapsed, type Order } from '../../domain/orders';
import { useNow } from './useNow';

/**
 * Live count-up of the time spent cooking; it holds still while the order is
 * paused. It's its own component so only the timer re-renders every second.
 * Worked out from timestamps, so it stays right if the phone sleeps or the
 * screen is left and reopened.
 */
export function PrepTimer({ order }: { order: Order }) {
  const now = useNow(1000);
  return (
    <span role="timer" className="tabular-nums">
      {formatElapsed(cookingMs(order, now))}
    </span>
  );
}
