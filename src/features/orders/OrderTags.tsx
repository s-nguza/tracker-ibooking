import type { ReactNode } from 'react';
import { isLongOrder, orderCategories, type Order } from '../../domain/orders';
import { BADGE_TONES, type BadgeTone } from './orderStatusUi';

/** At a glance: what kind of food this is and how long it takes. Long orders stand out. */
export function OrderTags({ order, extraTags = [] }: { order: Order; extraTags?: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {orderCategories(order).map((category) => (
        <Tag key={category} tone="muted">
          {category}
        </Tag>
      ))}
      {order.prepMinutes > 0 && (
        <Tag tone={isLongOrder(order) ? 'warn' : 'muted'}>
          {isLongOrder(order) ? 'Long' : 'Quick'} · {order.prepMinutes} min
        </Tag>
      )}
      {extraTags.map((tag) => (
        <Tag key={tag} tone="muted">
          {tag}
        </Tag>
      ))}
    </div>
  );
}

function Tag({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}
