import type { ReactNode } from 'react';
import { describeLines } from '../../domain/messages';
import { formatCents } from '../../domain/money';
import { orderDisplayName, type Order } from '../../domain/orders';

export type BadgeTone = 'muted' | 'brand' | 'alert';

const BADGE_TONES: Record<BadgeTone, string> = {
  muted: 'bg-stone-100 text-stone-500',
  brand: 'bg-brand-100 text-brand-700',
  alert: 'bg-red-100 text-red-700',
};

const CARD_STYLES = {
  active: 'border border-stone-200 border-l-4 border-l-brand-300 bg-white',
  pending: 'border border-dashed border-brand-300 bg-white/60',
  muted: 'border border-stone-200 bg-white/60 text-stone-500',
};

interface OrderCardProps {
  order: Order;
  badge: { label: string; tone: BadgeTone };
  look?: keyof typeof CARD_STYLES;
  /** Shown after the item list, e.g. "quoted just now". */
  detail?: string;
  showTotal?: boolean;
  action?: ReactNode;
  children?: ReactNode;
}

export function OrderCard({
  order,
  badge,
  look = 'active',
  detail,
  showTotal = true,
  action,
  children,
}: OrderCardProps) {
  return (
    <li className={`rounded-2xl p-4 ${CARD_STYLES[look]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-bold">
              #{order.queueNumber} · {orderDisplayName(order)}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_TONES[badge.tone]}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {describeLines(order.lines)}
            {detail && ` · ${detail}`}
          </p>
          {showTotal && <p className="mt-2 font-bold">{formatCents(order.totalCents)}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </li>
  );
}

const BUTTON_STYLES = {
  primary: 'bg-stone-900 text-white hover:bg-stone-800',
  secondary: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50',
  brand: 'bg-brand-600 text-white hover:bg-brand-700',
};

export function CardButton({
  children,
  onClick,
  tone = 'secondary',
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: keyof typeof BUTTON_STYLES;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-xl px-4 text-sm font-bold ${BUTTON_STYLES[tone]}`}
    >
      {children}
    </button>
  );
}
