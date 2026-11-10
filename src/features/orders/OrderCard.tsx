import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CARD } from '../../components/styles';
import { describeLines } from '../../domain/messages';
import { formatCents } from '../../domain/money';
import { orderDisplayName, type Order } from '../../domain/orders';
import { BADGE_TONES, PAYMENT_BADGE, type BadgeTone } from './orderStatusUi';
import { OrderTags } from './OrderTags';
import { SpecialRequestNote } from './SpecialRequest';

interface OrderCardProps {
  order: Order;
  badge: { label: ReactNode; tone: BadgeTone };
  /** A red tag under the items, for when the pill is already showing something else. */
  alert?: string;
  /** A line under the items, e.g. why the order is paused. */
  note?: ReactNode;
  /** Extra grey tags after the categories, e.g. "Waiting 9 min". */
  extraTags?: string[];
  /** Muted cards are out of the kitchen's hands; pending ones are quotes, dashed and without a total. */
  look?: 'active' | 'pending' | 'muted';
  /** Shown after the item list, e.g. "quoted just now". */
  detail?: string;
  /** Shows how they'll pay under the total, for orders about to be collected. */
  showPayment?: boolean;
  /** Button on the card (Start, Ready…). Sits above the card's link so both stay tappable. */
  action?: ReactNode;
}

/** An order on the board. Tapping anywhere but its button opens the order. */
export function OrderCard({
  order,
  badge,
  alert,
  note,
  extraTags,
  look = 'active',
  detail,
  showPayment = false,
  action,
}: OrderCardProps) {
  const pending = look === 'pending';

  return (
    <li
      className={`relative p-4 ${
        pending ? 'border-line-strong rounded-3xl border border-dashed' : CARD
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${
            look === 'active' ? 'bg-warn-100 text-warn-800' : 'bg-track text-muted'
          }`}
        >
          #{order.queueNumber}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold">
            {/* The ::after stretches the link over the whole card. */}
            <Link
              to={`/orders/${order.id}`}
              className="focus-visible:after:outline-brand-600 after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:outline-2"
            >
              {orderDisplayName(order)}
            </Link>
          </h3>
          <p className="text-muted text-sm">
            {describeLines(order.lines)}
            {detail && ` · ${detail}`}
          </p>
          {note && <p className="text-warn-800 text-sm font-semibold">{note}</p>}
          {alert && (
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold ${BADGE_TONES.alert}`}
            >
              {alert}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${BADGE_TONES[badge.tone]}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-3">
        <OrderTags order={order} extraTags={extraTags} />
      </div>

      {order.specialRequest && look !== 'muted' && (
        <div className="mt-3">
          <SpecialRequestNote text={order.specialRequest} />
        </div>
      )}

      {!pending && (
        <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
          <div>
            <p className="text-xl font-extrabold">{formatCents(order.totalCents)}</p>
            {showPayment && (
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold whitespace-nowrap ${BADGE_TONES[PAYMENT_BADGE[order.paymentMethod].tone]}`}
              >
                {PAYMENT_BADGE[order.paymentMethod].label}
              </span>
            )}
          </div>
          {action && <div className="relative z-1 flex flex-wrap justify-end gap-2">{action}</div>}
        </div>
      )}
    </li>
  );
}

const BUTTON_STYLES = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-canvas',
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
      className={`h-12 rounded-2xl px-3 font-bold min-[360px]:px-6 ${BUTTON_STYLES[tone]}`}
    >
      {children}
    </button>
  );
}
