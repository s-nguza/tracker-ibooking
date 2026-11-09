import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertIcon, PlusIcon } from '../../components/icons';
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
  type Order,
  type OrderStatus,
} from '../../domain/orders';
import { CategoryStatusRow } from './CategoryStatusRow';
import { KITCHEN_CAPACITY } from './kitchenCapacity';
import { CardButton, OrderCard } from './OrderCard';
import { PauseDialog } from './PauseDialog';
import { useOrders } from './ordersContext';
import {
  BOARD_TABS,
  isBoardTab,
  STATUS_BADGE,
  type BadgeTone,
  type BoardTab,
} from './orderStatusUi';
import { PrepTimer } from './PrepTimer';
import { BUSINESS_NAME } from './sampleOrders';
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
  const activeCount = inStatus('confirmed').length + preparing.length + inStatus('ready').length;

  return (
    <div className={SCREEN}>
      <header className="flex items-start justify-between gap-3 px-5 pt-6">
        <div className="min-w-0">
          <p className="text-muted font-medium">{BUSINESS_NAME}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Today’s orders</h1>
        </div>
        <p className="shadow-card flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 font-bold">
          <span className="bg-ok-600 size-2.5 rounded-full" aria-hidden="true" />
          {activeCount} active
        </p>
      </header>

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
  now,
  onStarted,
}: {
  confirmed: Order[];
  awaiting: Order[];
  preparing: Order[];
  now: number;
  /** Called after Start, so the screen can move to where the order's timer is running. */
  onStarted: () => void;
}) {
  const { advance } = useOrders();
  const cooking = preparing.filter((o) => !currentPause(o));
  const paused = preparing.filter((o) => currentPause(o));
  const menu = useMenu();
  const stations = kitchenStatus(cookedCategories(menu), preparing, KITCHEN_CAPACITY);
  const full = stations.filter((station) => station.full);
  const waitingFor = (order: Order) => fullCategories(order, stations);

  return (
    <>
      {confirmed.length > 0 && (
        <p className="bg-warn-100 text-warn-800 mb-3 flex gap-3 rounded-2xl px-4 py-3 font-semibold">
          <AlertIcon className="mt-0.5 shrink-0" width={22} height={22} strokeWidth={2} />
          <span>
            {full.length > 0
              ? `${full.map((s) => `${s.category} busy with ${queueList(s.cooking)}`).join(', ')}. Other categories have room.`
              : 'Every category has room.'}{' '}
            Tap Start when you’re ready for the next one.
          </span>
        </p>
      )}
      <CategoryStatusRow stations={stations} />

      <ul className="space-y-3">
        {byPriority(confirmed, now, (o) => waitingFor(o).length > 0).map((order, index) => {
          const waited = minutesBetween(order.statusChangedAt, now);
          const startIn = minutesToStart(order, now);
          const blockedBy = waitingFor(order);
          return (
            <OrderCard
              key={order.id}
              order={order}
              badge={timeBadge(order, now, {
                label: `${Math.max(1, waited)} min`,
                tone: waitTone(waited),
              })}
              priority={{
                label: `Priority ${index + 1} · ${
                  blockedBy.length > 0
                    ? `waiting for ${blockedBy.join(', ')}`
                    : startIn === 0
                      ? 'start now'
                      : `start within ${startIn} min`
                }`,
                urgent: blockedBy.length === 0 && startIn === 0,
              }}
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
        <p className="text-warn-800 mt-1 text-center font-medium">
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
