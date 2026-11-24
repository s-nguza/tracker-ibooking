import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  BackIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  PersonIcon,
  PhoneIcon,
  SpeakerIcon,
} from '../../components/icons';
import {
  BOTTOM_BAR,
  BUTTON_OUTLINE,
  BUTTON_PRIMARY,
  CARD,
  ROUND_BUTTON,
  SCREEN,
  SECTION_LABEL,
} from '../../components/styles';
import {
  orderConfirmationMessage,
  orderQuoteMessage,
  orderReadyMessage,
  orderUpdatedMessage,
  whatsAppLink,
} from '../../domain/messages';
import { formatCents } from '../../domain/money';
import {
  actualPrepMs,
  buildOrderLines,
  currentPause,
  editOrderItems,
  estimateReadyTime,
  formatElapsed,
  minutesBetween,
  minutesLate,
  minutesUntilReady,
  orderItemCount,
  orderTotalCents,
  setLineQuantity,
  toOrderLines,
  type Order,
  type OrderLines,
  type OrderStatus,
} from '../../domain/orders';
import { formatZaPhone, normalizeZaPhone } from '../../domain/phone';
import { copyText } from './copyText';
import { useKitchenCapacity } from '../menu/menuContext';
import { MenuPicker } from './MenuPicker';
import { useOrders } from './ordersContext';
import {
  BADGE_TONES,
  boardUrlFor,
  customerInitials,
  customerSubtitle,
  customerTitle,
  describeEstimate,
  orderBadge,
  PAYMENT_BADGE,
  PROGRESS_STEPS,
  statusTimeLabel,
} from './orderStatusUi';
import { OrderTags } from './OrderTags';
import { PauseDialog } from './PauseDialog';
import { PrepTimer } from './PrepTimer';
import { useBusinessName } from './useBusinessName';
import { SpecialRequestField, SpecialRequestNote } from './SpecialRequest';
import { useMenu } from './useMenu';
import { useNow } from './useNow';

/** The main button for each step; done and cancelled orders have none. */
const NEXT_STEP: Partial<Record<OrderStatus, string>> = {
  awaiting: 'They said yes — confirm',
  confirmed: 'Start preparing',
  preparing: 'Mark as ready',
  ready: 'Mark as collected',
};

/** The message that fits this step, or null once there's nothing left to say. */
function customerMessage(
  order: Order,
  businessName: string,
): { label: string; text: string } | null {
  switch (order.status) {
    case 'awaiting':
      return { label: 'Quote message', text: orderQuoteMessage(order) };
    case 'confirmed':
      return { label: 'Order message', text: orderConfirmationMessage(order) };
    case 'preparing':
    case 'ready':
      return { label: 'Ready message', text: orderReadyMessage(order, businessName) };
    default:
      return null;
  }
}

/** Everything about one order, plus whatever can be done with it at its current step. */
export function OrderDetailScreen() {
  const { orderId } = useParams();
  const { orders, loading } = useOrders();
  const order = orders.find((o) => o.id === orderId);
  const badge = order && orderBadge(order);

  return (
    <div className={SCREEN}>
      <header className="bg-night/85 sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 backdrop-blur">
        <Link
          to={order ? boardUrlFor(order.status) : '/orders'}
          aria-label="Back to orders"
          className={ROUND_BUTTON}
        >
          <BackIcon width={24} height={24} strokeWidth={2.25} />
        </Link>
        <h1 className="text-xl font-extrabold whitespace-nowrap">
          {order ? `Order #${order.queueNumber}` : 'Order'}
        </h1>
        {badge && (
          <span
            className={`justify-self-end rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap ${BADGE_TONES[badge.tone]}`}
          >
            {badge.label}
          </span>
        )}
      </header>

      {order ? (
        <OrderDetail key={order.id} order={order} />
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
          <p className="text-muted">
            {loading
              ? 'Loading the order…'
              : 'This order isn’t on today’s board. It may be from an earlier day.'}
          </p>
          <Link to="/orders" className={`${BUTTON_PRIMARY} max-w-60`}>
            Back to orders
          </Link>
        </main>
      )}
    </div>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const { advance, cancel, editItems, resume, setSpecialRequest } = useOrders();
  const businessName = useBusinessName();
  const navigate = useNavigate();
  const now = useNow();
  const menu = useMenu();
  const [editing, setEditing] = useState(false);
  const [justEdited, setJustEdited] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [pausing, setPausing] = useState(false);

  if (editing) {
    return (
      <EditItems
        order={order}
        onCancel={() => setEditing(false)}
        onSave={(lines, specialRequest) => {
          editItems(order.id, menu, lines);
          setSpecialRequest(order.id, specialRequest);
          setEditing(false);
          setJustEdited(true);
        }}
      />
    );
  }

  const isQuote = order.status === 'awaiting';
  const canCancel = order.status !== 'done' && order.status !== 'cancelled';
  const pause = currentPause(order);
  const pastPauses = (order.pauses ?? []).filter((p) => p.resumedAt !== undefined);
  const nextStep = pause ? 'Resume cooking' : NEXT_STEP[order.status];
  const canEdit = isQuote || order.status === 'confirmed' || order.status === 'preparing';
  const minutesLeft = minutesUntilReady(order, now);
  // A confirmed customer needs to hear about the change, not the usual message for this step.
  const message =
    justEdited && !isQuote && canEdit
      ? {
          label: 'Updated order message',
          text: orderUpdatedMessage({ ...order, readyMinutes: minutesLeft }),
        }
      : customerMessage(order, businessName);
  const late = minutesLate(order, now);
  const took = actualPrepMs(order);
  // Back to the tab the order was listed under, so the next one is right there.
  const boardUrl = boardUrlFor(order.status);

  function goToNextStep() {
    if (pause) {
      resume(order.id);
      return;
    }
    advance(order.id);
    setJustEdited(false);
    // After Start, stay here: the timer has just begun running on this screen.
    if (order.status !== 'confirmed') navigate(boardUrl);
  }

  function cancelOrder() {
    cancel(order.id);
    navigate(boardUrl);
  }

  return (
    <>
      <main className="flex-1 space-y-4 px-5 pt-1 pb-6">
        {order.status !== 'cancelled' && <ProgressSteps status={order.status} />}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted flex items-center gap-2 text-sm font-medium">
            <ClockIcon className="shrink-0" width={16} height={16} />
            {statusTimeLabel(order.status, minutesBetween(order.statusChangedAt, now))}
            {order.readyMinutes > 0 &&
              (order.status === 'confirmed' || order.status === 'preparing') &&
              ` · told about ${order.readyMinutes} min`}
          </p>
          {late !== null && (
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${BADGE_TONES.alert}`}>
              Late by {late} min
            </span>
          )}
        </div>

        {order.status === 'preparing' && (
          <section className={`${CARD} p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className={SECTION_LABEL}>Cooking time</h2>
                <p className={`text-4xl font-extrabold ${pause ? 'text-muted' : ''}`}>
                  <PrepTimer order={order} />
                </p>
                {order.prepMinutes > 0 && (
                  <p className="text-muted text-sm font-medium">
                    Usually about {order.prepMinutes} min
                  </p>
                )}
              </div>
              {!pause && (
                <button
                  type="button"
                  onClick={() => setPausing(true)}
                  className="border-line-strong hover:bg-canvas h-12 shrink-0 rounded-2xl border px-5 font-bold"
                >
                  Pause
                </button>
              )}
            </div>
            {pause && (
              <p className="bg-warn-100 text-warn-800 mt-3 rounded-2xl px-4 py-3 font-semibold">
                Paused for {minutesBetween(pause.pausedAt, now)} min: {pause.reason}
              </p>
            )}
          </section>
        )}

        {pastPauses.length > 0 && (
          <section className={`${CARD} p-5`}>
            <h2 className={SECTION_LABEL}>Earlier pauses</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {pastPauses.map((p) => (
                <li key={p.pausedAt}>
                  <span className="font-bold tabular-nums">
                    {formatElapsed(p.resumedAt! - p.pausedAt)}
                  </span>{' '}
                  · {p.reason}
                </li>
              ))}
            </ul>
          </section>
        )}

        {took !== null && (
          <p className="text-muted text-sm font-medium">
            Took {formatElapsed(took)} to make
            {order.prepMinutes > 0 && `, expected about ${order.prepMinutes} min`}
          </p>
        )}

        <CustomerSummary order={order} />

        {justEdited && (
          <p className="bg-warn-100 text-warn-800 rounded-2xl px-4 py-3 font-semibold">
            {isQuote
              ? 'Order updated. Resend the quote so they see the new total before saying yes.'
              : `Order updated. Total ${formatCents(order.totalCents)}${
                  minutesLeft > 0 ? `, ready in about ${minutesLeft} min` : ''
                }.${order.status === 'preparing' ? ' The timer kept running.' : ''}`}
          </p>
        )}

        <section className={`${CARD} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className={SECTION_LABEL}>Order</h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-brand-300 -my-2 h-10 px-2 font-bold hover:underline"
              >
                Edit order
              </button>
            )}
          </div>
          <div className="mt-2">
            <OrderTags order={order} />
          </div>
          {order.specialRequest && (
            <div className="mt-3">
              <SpecialRequestNote text={order.specialRequest} />
            </div>
          )}
          <ul className="divide-line mt-2 divide-y">
            {order.lines.map((line) => (
              <li key={line.itemId} className="flex items-center gap-3 py-2.5">
                <span className="bg-canvas flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                  {line.quantity}
                </span>
                <span className="min-w-0 flex-1 font-semibold">{line.name}</span>
                <span className="font-semibold">
                  {formatCents(line.priceCents * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-line-strong mt-1 flex items-center justify-between border-t border-dashed pt-3">
            <span className="text-muted text-lg font-semibold">Total</span>
            <span className="text-3xl font-extrabold">{formatCents(order.totalCents)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted font-semibold">Payment</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${BADGE_TONES[PAYMENT_BADGE[order.paymentMethod].tone]}`}
            >
              {PAYMENT_BADGE[order.paymentMethod].label}
            </span>
          </div>
        </section>

        {message &&
          (order.phone || isQuote ? (
            <section>
              <h2 className={SECTION_LABEL}>{message.label}</h2>
              <p className="bg-ok-50 mt-2 rounded-2xl p-4 whitespace-pre-line">{message.text}</p>
            </section>
          ) : (
            <p className="bg-brand-50 text-brand-300 flex gap-3 rounded-2xl p-4 font-semibold">
              <SpeakerIcon className="mt-0.5 shrink-0" />
              <span>
                No message to send. Call out “order #{order.queueNumber}” or point them to the
                board.
              </span>
            </p>
          ))}

        {canCancel &&
          (confirmingCancel ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-bold text-red-200">
                Cancel order #{order.queueNumber}? This can’t be undone.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  className="border-line-strong bg-surface h-12 rounded-2xl border font-bold"
                >
                  Keep order
                </button>
                <button
                  type="button"
                  onClick={cancelOrder}
                  className="h-12 rounded-2xl bg-red-600 font-bold text-white hover:bg-red-700"
                >
                  Yes, cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="h-11 w-full font-bold text-red-300 hover:underline"
            >
              Cancel order
            </button>
          ))}
      </main>

      {nextStep && (
        <footer className={`${BOTTOM_BAR} space-y-3`}>
          {message && (order.phone || isQuote) && (
            <MessageActions order={order} text={message.text} updated={justEdited} />
          )}
          <button type="button" onClick={goToNextStep} className={BUTTON_PRIMARY}>
            {nextStep}
          </button>
        </footer>
      )}

      {pausing && (
        <PauseDialog
          orderId={order.id}
          queueNumber={order.queueNumber}
          onClose={() => setPausing(false)}
        />
      )}
    </>
  );
}

function ProgressSteps({ status }: { status: OrderStatus }) {
  // A quote hasn't reached the first step yet.
  const current = PROGRESS_STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {PROGRESS_STEPS.map((step, index) => {
        const reached = index <= current;
        return (
          <li key={step.status} aria-current={index === current ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${reached ? 'bg-brand-600' : 'bg-line-strong'}`} />
            <p
              className={`mt-1.5 text-[13px] ${
                reached ? 'text-brand-300' : 'text-muted'
              } ${index === current ? 'font-extrabold' : 'font-semibold'}`}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function CustomerSummary({ order }: { order: Order }) {
  const { addPhone } = useOrders();
  const [adding, setAdding] = useState(false);
  const [number, setNumber] = useState('');

  const initials = customerInitials(order.customerName);
  const phone = order.phone && formatZaPhone(order.phone);
  const finished = order.status === 'done' || order.status === 'cancelled';
  const normalized = normalizeZaPhone(number);

  return (
    <section className={`${CARD} p-4`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-full font-extrabold ${
            initials ? 'bg-brand-100 text-brand-300' : 'bg-canvas text-muted'
          }`}
        >
          {initials || <PersonIcon width={26} height={26} />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold">{customerTitle(order)}</h2>
          <p className="text-muted text-sm">{customerSubtitle(order, phone)}</p>
        </div>
        {phone ? (
          <span className="bg-ok-100 text-ok-800 shrink-0 rounded-full px-2.5 py-1 text-[13px] font-bold">
            WhatsApp
          </span>
        ) : (
          !finished &&
          !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="border-line-strong hover:bg-canvas h-11 shrink-0 rounded-2xl border px-3 text-sm font-bold"
            >
              + Number
            </button>
          )
        )}
      </div>

      {adding && !phone && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (normalized) addPhone(order.id, normalized);
          }}
        >
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            aria-label="Customer phone number"
            placeholder="082 345 6712"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="border-line-strong focus:border-brand-600 h-12 min-w-0 flex-1 rounded-2xl border px-3 font-semibold outline-none"
          />
          <button
            type="submit"
            disabled={!normalized}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-track disabled:text-muted h-12 shrink-0 rounded-2xl px-5 font-bold text-white disabled:cursor-not-allowed"
          >
            Save
          </button>
        </form>
      )}
    </section>
  );
}

/** Send on WhatsApp, copy the text, and call: the row above the main button. */
function MessageActions({
  order,
  text,
  updated,
}: {
  order: Order;
  text: string;
  updated: boolean;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    setCopyState((await copyText(text)) ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 2000);
  }

  const iconButton =
    'border-line-strong hover:bg-canvas flex h-14 shrink-0 items-center justify-center rounded-2xl border px-4';

  return (
    <div>
      <div className="flex gap-2">
        {order.phone && (
          <a
            href={whatsAppLink(order.phone, text)}
            target="_blank"
            rel="noreferrer"
            className="bg-ok-700 hover:bg-ok-600 flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl font-bold text-white"
          >
            <ChatIcon className="shrink-0" />
            {updated
              ? order.status === 'awaiting'
                ? 'Send updated quote'
                : 'Send updated order'
              : 'Send on WhatsApp'}
          </a>
        )}
        <button
          type="button"
          onClick={copy}
          aria-label={copyState === 'copied' ? 'Copied' : 'Copy message'}
          className={`${iconButton} ${order.phone ? '' : 'flex-1 gap-2 font-bold'}`}
        >
          {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
          {!order.phone && (copyState === 'copied' ? 'Copied' : 'Copy message')}
        </button>
        {order.phone && (
          <a href={`tel:${order.phone}`} aria-label="Call customer" className={iconButton}>
            <PhoneIcon />
          </a>
        )}
      </div>
      {copyState === 'failed' && (
        <p className="mt-2 text-sm font-semibold text-red-300">
          Couldn’t copy. Select the message above instead.
        </p>
      )}
    </div>
  );
}

function EditItems({
  order,
  onCancel,
  onSave,
}: {
  order: Order;
  onCancel: () => void;
  onSave: (lines: OrderLines, specialRequest: string) => void;
}) {
  const menu = useMenu();
  const capacity = useKitchenCapacity();
  const { orders } = useOrders();
  const now = useNow();
  const [lines, setLines] = useState<OrderLines>(() => toOrderLines(order.lines));
  const [specialRequest, setSpecialRequest] = useState(order.specialRequest ?? '');
  const empty = orderItemCount(lines) === 0;
  // Run the real edit, so the time shown here is the time the order will get on save.
  const minutes = minutesUntilReady(editOrderItems(order, menu, lines, orders, capacity, now), now);
  // The line-by-line working only applies to quotes, which join the back of the queue.
  const breakdown =
    order.status === 'awaiting'
      ? describeEstimate(estimateReadyTime(buildOrderLines(menu, lines), orders, capacity, now))
      : [];

  return (
    <>
      <main className="flex-1 space-y-5 px-5 pt-1 pb-6">
        <MenuPicker
          menu={menu}
          lines={lines}
          onQuantityChange={(id, qty) => setLines((prev) => setLineQuantity(prev, id, qty))}
        />
        <SpecialRequestField value={specialRequest} onChange={setSpecialRequest} />
      </main>
      <footer className={BOTTOM_BAR}>
        <div className="flex items-center justify-between gap-4">
          <div className="text-muted min-w-0">
            {empty ? (
              'Add at least one item'
            ) : minutes === 0 ? (
              'Nothing to cook'
            ) : (
              <>
                <p className="text-ink font-semibold">Ready in about {minutes} min</p>
                {breakdown.map((line) => (
                  <p key={line} className="text-sm">
                    {line}
                  </p>
                ))}
              </>
            )}
          </div>
          <p className="text-3xl font-extrabold whitespace-nowrap">
            {formatCents(orderTotalCents(menu, lines))}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className={BUTTON_OUTLINE}>
            Discard
          </button>
          <button
            type="button"
            disabled={empty}
            onClick={() => onSave(lines, specialRequest)}
            className={BUTTON_PRIMARY}
          >
            Save changes
          </button>
        </div>
      </footer>
    </>
  );
}
