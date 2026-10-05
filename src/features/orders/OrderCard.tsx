import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRightIcon } from '../../components/icons';
import { describeLines } from '../../domain/messages';
import { formatCents } from '../../domain/money';
import { orderDisplayName, type Order } from '../../domain/orders';
import { BADGE_TONES, type BadgeTone } from './orderStatusUi';

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
  /** Button beside the card (Start, Ready…). Kept outside the link so both stay tappable. */
  action?: ReactNode;
  /** Extra content under the card, also outside the link. */
  children?: ReactNode;
}

/** An order on the board. Tapping it opens the order's detail screen. */
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
    <li className={`rounded-2xl ${CARD_STYLES[look]}`}>
      <div className="flex items-start">
        <Link
          to={`/orders/${order.id}`}
          className="min-w-0 flex-1 rounded-2xl p-4 hover:bg-stone-50/60"
        >
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
        </Link>
        <div className="shrink-0 py-4 pr-4">
          {action ?? <ChevronRightIcon className="mt-1 text-stone-400" />}
        </div>
      </div>
      {children && <div className="-mt-2 px-4 pb-4">{children}</div>}
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
