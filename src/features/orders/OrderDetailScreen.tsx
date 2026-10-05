import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { BackIcon, ClockIcon } from '../../components/icons';
import {
  orderConfirmationMessage,
  orderQuoteMessage,
  orderReadyMessage,
  whatsAppLink,
} from '../../domain/messages';
import { formatCents } from '../../domain/money';
import {
  estimateReadyMinutes,
  minutesBetween,
  orderDisplayName,
  orderItemCount,
  orderTotalCents,
  setLineQuantity,
  toOrderLines,
  type Order,
  type OrderLines,
  type OrderStatus,
} from '../../domain/orders';
import { formatZaPhone } from '../../domain/phone';
import { MenuPicker } from './MenuPicker';
import { useOrders } from './ordersContext';
import {
  BADGE_TONES,
  boardUrlFor,
  CHANNEL_LABEL,
  STATUS_BADGE,
  statusTimeLabel,
} from './orderStatusUi';
import { SAMPLE_MENU } from './sampleMenu';
import { useNow } from './useNow';

/** The main button for each step; done and cancelled orders have none. */
const NEXT_STEP: Partial<Record<OrderStatus, string>> = {
  awaiting: 'They said yes — confirm',
  confirmed: 'Start preparing',
  preparing: 'Mark ready',
  ready: 'Collected',
};

/** Everything about one order, plus whatever can be done with it at its current step. */
export function OrderDetailScreen() {
  const { orderId } = useParams();
  const { orders } = useOrders();
  const order = orders.find((o) => o.id === orderId);

  return (
    <div className="bg-canvas mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 grid grid-cols-[3rem_1fr_3rem] items-center border-b border-stone-200 bg-white px-3 py-4">
        <Link
          to={order ? boardUrlFor(order.status) : '/'}
          aria-label="Back to orders"
          className="flex size-12 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100"
        >
          <BackIcon width={26} height={26} />
        </Link>
        <h1 className="text-center text-xl font-bold">
          {order ? `${CHANNEL_LABEL[order.channel]} #${order.queueNumber}` : 'Order'}
        </h1>
      </header>

      {order ? (
        <OrderDetail key={order.id} order={order} />
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
          <p className="text-stone-600">
            This order doesn’t exist any more. Orders reset when the page is refreshed.
          </p>
          <Link
            to="/"
            className="flex h-12 items-center rounded-2xl bg-stone-900 px-6 font-bold text-white"
          >
            Back to orders
          </Link>
        </main>
      )}
    </div>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const { advance, cancel, editItems } = useOrders();
  const navigate = useNavigate();
  const now = useNow();
  const [editing, setEditing] = useState(false);
  const [justEdited, setJustEdited] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (editing) {
    return (
      <EditItems
        order={order}
        onCancel={() => setEditing(false)}
        onSave={(lines) => {
          editItems(order.id, SAMPLE_MENU, lines);
          setEditing(false);
          setJustEdited(true);
        }}
      />
    );
  }

  const isQuote = order.status === 'awaiting';
  const canCancel = order.status !== 'done' && order.status !== 'cancelled';
  const nextStep = NEXT_STEP[order.status];
  const badge = STATUS_BADGE[order.status];
  // Back to the tab the order was listed under, so the next one is right there.
  const boardUrl = boardUrlFor(order.status);

  function goToNextStep() {
    advance(order.id);
    navigate(boardUrl);
  }

  function cancelOrder() {
    cancel(order.id);
    navigate(boardUrl);
  }

  return (
    <main className="flex-1 space-y-4 px-5 py-5">
      <section
        className={`rounded-2xl bg-white p-4 ${
          isQuote ? 'border-brand-300 border border-dashed' : 'border border-stone-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">{orderDisplayName(order)}</h2>
            {order.phone && (
              <a href={`tel:${order.phone}`} className="text-brand-700 hover:underline">
                {formatZaPhone(order.phone)}
              </a>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${BADGE_TONES[badge.tone]}`}
          >
            {badge.label}
          </span>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-stone-600">
          <ClockIcon className="shrink-0" width={16} height={16} />
          {statusTimeLabel(order.status, minutesBetween(order.statusChangedAt, now))}
        </p>
      </section>

      {justEdited && (
        <p className="bg-brand-100 text-brand-700 rounded-xl px-3 py-2 text-sm">
          Items updated. Resend the quote so they see the new total before saying yes.
        </p>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-widest text-stone-500 uppercase">Items</h2>
          {isQuote && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-brand-700 -my-2 h-10 px-2 font-semibold hover:underline"
            >
              Edit items
            </button>
          )}
        </div>
        <ul className="mt-2 divide-y divide-stone-100">
          {order.lines.map((line) => (
            <li key={line.itemId} className="flex justify-between gap-4 py-2">
              <span>
                {line.name} <span className="text-stone-500">×{line.quantity}</span>
              </span>
              <span>{formatCents(line.priceCents * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatCents(order.totalCents)}</span>
        </div>
        {(isQuote || order.status === 'confirmed' || order.status === 'preparing') && (
          <p className="mt-1 text-sm text-stone-600">
            {isQuote
              ? `Ready about ${order.readyMinutes} min after they confirm.`
              : `Customer was told about ${order.readyMinutes} min.`}
          </p>
        )}
      </section>

      <div className="space-y-3 pt-2">
        {nextStep && (
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-brand-600 hover:bg-brand-700 h-14 w-full rounded-2xl text-lg font-bold text-white"
          >
            {nextStep}
          </button>
        )}

        <MessageButton order={order} highlight={justEdited} />

        {canCancel &&
          (confirmingCancel ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-800">
                Cancel order #{order.queueNumber}? This can’t be undone.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  className="h-11 rounded-xl border border-stone-300 bg-white font-bold text-stone-800"
                >
                  Keep order
                </button>
                <button
                  type="button"
                  onClick={cancelOrder}
                  className="h-11 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
                >
                  Yes, cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="h-12 w-full font-semibold text-red-700 hover:underline"
            >
              Cancel order
            </button>
          ))}
      </div>
    </main>
  );
}

/** The WhatsApp message that fits this step: the quote, the confirmation, or "it's ready". */
function MessageButton({ order, highlight }: { order: Order; highlight: boolean }) {
  if (!order.phone) return null;

  let label: string;
  let message: string;
  switch (order.status) {
    case 'awaiting':
      label = highlight ? 'Send updated quote' : 'Resend quote on WhatsApp';
      message = orderQuoteMessage(order);
      break;
    case 'confirmed':
    case 'preparing':
      label = 'Text them the order';
      message = orderConfirmationMessage(order);
      break;
    case 'ready':
      label = 'Text them it’s ready';
      message = orderReadyMessage(order);
      break;
    default:
      return null;
  }

  return (
    <a
      href={whatsAppLink(order.phone, message)}
      target="_blank"
      rel="noreferrer"
      className={`flex h-14 w-full items-center justify-center rounded-2xl text-lg font-bold ${
        highlight
          ? 'bg-stone-900 text-white hover:bg-stone-800'
          : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
      }`}
    >
      {label}
    </a>
  );
}

function EditItems({
  order,
  onCancel,
  onSave,
}: {
  order: Order;
  onCancel: () => void;
  onSave: (lines: OrderLines) => void;
}) {
  const menu = SAMPLE_MENU;
  const [lines, setLines] = useState<OrderLines>(() => toOrderLines(order.lines));
  const empty = orderItemCount(lines) === 0;

  return (
    <>
      <main className="flex-1 px-5 py-5">
        <MenuPicker
          menu={menu}
          lines={lines}
          onQuantityChange={(id, qty) => setLines((prev) => setLineQuantity(prev, id, qty))}
        />
      </main>
      <footer className="sticky bottom-0 border-t border-stone-200 bg-white px-5 pt-4 pb-6">
        <div className="flex items-baseline justify-between">
          <p className="text-stone-600">
            {empty
              ? 'Add at least one item'
              : `Ready in about ${estimateReadyMinutes(menu, lines)} min`}
          </p>
          <p className="text-2xl font-bold">{formatCents(orderTotalCents(menu, lines))}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-14 rounded-2xl border border-stone-300 bg-white text-lg font-bold text-stone-800"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={empty}
            onClick={() => onSave(lines)}
            className="bg-brand-600 hover:bg-brand-700 h-14 rounded-2xl text-lg font-bold text-white disabled:bg-stone-300"
          >
            Save items
          </button>
        </div>
      </footer>
    </>
  );
}
