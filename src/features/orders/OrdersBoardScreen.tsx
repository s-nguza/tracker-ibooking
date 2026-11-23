import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ClockIcon, PlusIcon } from '../../components/icons';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';
import { SCREEN, SEGMENT_TRACK, segmentClass } from '../../components/styles';
import {
  actualPrepMs,
  byPriority,
  byQueueNumber,
  cookedCategories,
  currentPause,
  formatElapsed,
  fullCategories,
  kitchenStatus,
  minutesBetween,
  minutesLate,
  minutesToStart,
  mustStartBy,
  type CategoryStatus,
  type Order,
  type OrderStatus,
} from '../../domain/orders';
import { useKitchenCapacity } from '../menu/menuContext';
import { CapacityTiles } from './CapacityTiles';
import { CardButton, OrderCard } from './OrderCard';
import { PauseDialog } from './PauseDialog';
import { useOrders } from './ordersContext';
import {
  BOARD_TABS,
  formatClock,
  isBoardTab,
  STATUS_BADGE,
  type BadgeTone,
  type BoardTab,
} from './orderStatusUi';
import { PrepTimer } from './PrepTimer';
import { useBusinessName } from './useBusinessName';
import { useAuth } from '../auth/authContext';
import { useMenu } from './useMenu';
import { useNow } from './useNow';

/** After this long in the queue, the time pill turns amber to draw attention. */
const LONG_WAIT_MINUTES = 5;

function waitTone(minutes: number): BadgeTone {
  return minutes >= LONG_WAIT_MINUTES ? 'warn' : 'muted';
}

/** A late order's pill says so; being late matters more than how long it has been waiting. */
function timeBadge(order: Order, now: number, onTime: { label: string; tone: BadgeTone }) {
  const late = minutesLate(order, now);
  return late === null ? onTime : { label: `Late · ${late} min`, tone: 'alert' as const };
}

export function OrdersBoardScreen() {
  const { orders } = useOrders();
  // The tab lives in the URL so returning from an order lands on the same tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: BoardTab = isBoardTab(tabParam) ? tabParam : 'confirmed';
  const setTab = (next: BoardTab) =>
    setSearchParams(next === 'confirmed' ? {} : { tab: next }, { replace: true });
  const now = useNow();

  const inStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status).sort(byQueueNumber);
  const preparing = inStatus('preparing');
  // Still in the kitchen's hands: waiting to start or cooking.
  const inProgress = inStatus('confirmed').length + preparing.length;
  const menu = useMenu();
  const capacity = useKitchenCapacity();
  const stations = kitchenStatus(cookedCategories(menu), preparing, capacity);
  const businessName = useBusinessName();
  const { state: auth, logOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={SCREEN}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <Logo className="w-36 min-[380px]:w-44" />
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/menu"
            className="border-line-strong bg-surface hover:bg-track flex h-11 items-center rounded-full border px-4 font-bold"
          >
            Menu
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <header className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <p className="text-muted flex flex-wrap items-baseline gap-x-2 font-medium">
            <span className="min-w-0 truncate">{businessName}</span>
            {auth.status === 'ready' && (
              <button
                type="button"
                onClick={async () => {
                  await logOut();
                  navigate('/', { replace: true });
                }}
                className="text-brand-300 text-sm font-bold hover:underline"
              >
                Log out
              </button>
            )}
          </p>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
            Today’s orders
          </h1>
        </div>
        <p className="border-line-strong bg-surface flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold">
          <span className="bg-ok-600 size-2 rounded-full" aria-hidden="true" />
          {inProgress} in progress
        </p>
      </header>

      <div className="px-5 pt-4">
        <CapacityTiles stations={stations} />
      </div>

      <div className="px-5 pt-4">
        <nav role="tablist" aria-label="Order status" className={SEGMENT_TRACK}>
          {BOARD_TABS.map(({ value, label }) => {
            const selected = value === tab;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(value)}
                className={`h-11 flex-auto rounded-xl px-0.5 text-xs whitespace-nowrap min-[360px]:px-1 min-[360px]:text-[13px] ${segmentClass(selected)}`}
              >
                {label} · {inStatus(value).length}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 px-5 py-3">
        {tab === 'confirmed' && (
          <ConfirmedTab
            confirmed={inStatus('confirmed')}
            awaiting={inStatus('awaiting')}
            preparing={preparing}
            stations={stations}
            now={now}
            onStarted={() => setTab('preparing')}
          />
        )}
        {tab === 'preparing' && <PreparingTab orders={preparing} now={now} />}
        {tab === 'ready' && <ReadyTab orders={inStatus('ready')} now={now} />}
        {tab === 'done' && <DoneTab orders={inStatus('done').reverse()} now={now} />}
      </main>

      <div className="pointer-events-none sticky bottom-0 z-10 flex justify-end p-5">
        <Link
          to="/orders/new"
          aria-label="New order"
          className="bg-brand-600 hover:bg-brand-700 shadow-fab pointer-events-auto flex size-16 items-center justify-center rounded-full text-white"
        >
          <PlusIcon width={30} height={30} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

function ConfirmedTab({
  confirmed,
  awaiting,
  preparing,
  stations,
  now,
  onStarted,
}: {
  confirmed: Order[];
  awaiting: Order[];
  preparing: Order[];
  stations: readonly CategoryStatus[];
  now: number;
  /** Called after Start, so the screen can move to where the order's timer is running. */
  onStarted: () => void;
}) {
  const { advance } = useOrders();
  const cooking = preparing.filter((o) => !currentPause(o));
  const paused = preparing.filter((o) => currentPause(o));
  const waitingFor = (order: Order) => fullCategories(order, stations);

  /** Late beats everything; then whether its category is full; then when it must start. */
  function startBadge(order: Order): { label: string; tone: BadgeTone } {
    const blockedBy = waitingFor(order);
    if (blockedBy.length > 0) {
      return timeBadge(order, now, { label: `Waiting for ${blockedBy.join(', ')}`, tone: 'muted' });
    }
    return timeBadge(
      order,
      now,
      minutesToStart(order, now) === 0
        ? { label: 'Start now', tone: 'warn' }
        : { label: `Start by ${formatClock(mustStartBy(order))}`, tone: 'muted' },
    );
  }

  return (
    <>
      {confirmed.length > 0 && (
        <p className="bg-warn-100 text-warn-800 border-warn-800/25 mb-3 flex gap-3 rounded-2xl border px-4 py-3 text-[15px] font-semibold">
          <ClockIcon className="mt-0.5 shrink-0" width={20} height={20} />
          <span>
            Sorted by when each order must start. Longer orders rise to the top so everything is
            ready on time.
          </span>
        </p>
      )}

      <ul className="space-y-3">
        {byPriority(confirmed, now, (o) => waitingFor(o).length > 0).map((order, index) => {
          const waited = minutesBetween(order.statusChangedAt, now);
          return (
            <OrderCard
              key={order.id}
              order={order}
              badge={startBadge(order)}
              extraTags={[`Waiting ${Math.max(1, waited)} min`]}
              action={
                // The top priority is the one to start next.
                <CardButton
                  tone={index === 0 ? 'primary' : 'secondary'}
                  onClick={() => {
                    advance(order.id);
                    onStarted();
                  }}
                >
                  Start
                </CardButton>
              }
            />
          );
        })}
        {awaiting.map((order) => (
          <AwaitingCard key={order.id} order={order} now={now} />
        ))}
      </ul>

      {confirmed.length === 0 && awaiting.length === 0 && (
        <EmptyState>No orders waiting. Tap + when a customer orders.</EmptyState>
      )}

      {cooking.length > 0 && (
        <p className="text-muted mt-5 text-center font-medium">
          {plural(cooking.length, 'order')} being made · {queueList(cooking)}
        </p>
      )}
      {paused.length > 0 && (
        <p className="mt-1 text-center font-medium text-amber-300">
          {paused.length} paused · {queueList(paused)}
        </p>
      )}
    </>
  );
}

/** A quote waiting for the customer's yes. Tap it to resend, confirm, edit or cancel. */
function AwaitingCard({ order, now }: { order: Order; now: number }) {
  const quoted = minutesBetween(order.statusChangedAt, now);

  return (
    <OrderCard
      order={order}
      look="pending"
      badge={STATUS_BADGE.awaiting}
      detail={quoted === 0 ? 'quoted just now' : `quoted ${quoted} min ago`}
    />
  );
}

function PreparingTab({ orders, now }: { orders: Order[]; now: number }) {
  const { advance, resume } = useOrders();
  const [pausing, setPausing] = useState<Order | null>(null);
  if (orders.length === 0) return <EmptyState>Nothing on the stove right now.</EmptyState>;

  return (
    <>
      <ul className="space-y-3">
        {byPriority(orders, now).map((order) => {
          const late = minutesLate(order, now);
          const pause = currentPause(order);
          return (
            <OrderCard
              key={order.id}
              order={order}
              badge={
                pause
                  ? { label: 'Paused', tone: 'warn' }
                  : { label: <PrepTimer order={order} />, tone: 'info' }
              }
              note={
                pause && (
                  <>
                    {pause.reason} · stopped at <PrepTimer order={order} />
                  </>
                )
              }
              alert={late === null ? undefined : `Late · ${late} min`}
              action={
                pause ? (
                  <CardButton tone="primary" onClick={() => resume(order.id)}>
                    Resume
                  </CardButton>
                ) : (
                  <>
                    <CardButton onClick={() => setPausing(order)}>Pause</CardButton>
                    <CardButton tone="primary" onClick={() => advance(order.id)}>
                      Ready
                    </CardButton>
                  </>
                )
              }
            />
          );
        })}
      </ul>
      {pausing && (
        <PauseDialog
          orderId={pausing.id}
          queueNumber={pausing.queueNumber}
          onClose={() => setPausing(null)}
        />
      )}
    </>
  );
}

function ReadyTab({ orders, now }: { orders: Order[]; now: number }) {
  const { advance } = useOrders();
  if (orders.length === 0) return <EmptyState>No orders waiting for pickup.</EmptyState>;

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const waiting = minutesBetween(order.statusChangedAt, now);
        return (
          <OrderCard
            key={order.id}
            order={order}
            badge={{ label: `${Math.max(1, waiting)} min`, tone: waitTone(waiting) }}
            showPayment
            action={
              <CardButton tone="primary" onClick={() => advance(order.id)}>
                Collected
              </CardButton>
            }
          />
        );
      })}
    </ul>
  );
}

function DoneTab({ orders, now }: { orders: Order[]; now: number }) {
  if (orders.length === 0) return <EmptyState>No collected orders yet today.</EmptyState>;

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const took = actualPrepMs(order);
        return (
          <OrderCard
            key={order.id}
            order={order}
            look="muted"
            badge={{
              label: `${minutesBetween(order.statusChangedAt, now)} min ago`,
              tone: 'muted',
            }}
            detail={took === null ? undefined : `took ${formatElapsed(took)}`}
          />
        );
      })}
    </ul>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="text-muted py-12 text-center">{children}</p>;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function queueList(orders: Order[]): string {
  return orders.map((o) => `#${o.queueNumber}`).join(', ');
}
