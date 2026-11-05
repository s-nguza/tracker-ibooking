import type { ReactNode } from 'react';
import { isLongOrder, orderCategories, type Order } from '../../domain/orders';
import { BADGE_TONES, type BadgeTone } from './orderStatusUi';

/** At a glance: what kind of food this is, how long it takes, and where it sits in the queue. */
export function OrderTags({
  order,
  priority,
}: {
  order: Order;
  priority?: { label: string; urgent: boolean };
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {priority && <Tag tone={priority.urgent ? 'alert' : 'info'}>{priority.label}</Tag>}
      {orderCategories(order).map((category) => (
        <Tag key={category} tone="muted">
          {category}
        </Tag>
      ))}
      {order.prepMinutes > 0 && (
        <Tag tone={isLongOrder(order) ? 'warn' : 'ok'}>
          {isLongOrder(order) ? 'Long' : 'Quick'} · {order.prepMinutes} min
        </Tag>
      )}
    </div>
  );
}

function Tag({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}
