import { useState } from 'react';
import { Link } from 'react-router';
import { orderReadyMessage, whatsAppLink } from '../../domain/messages';
import { byQueueNumber, minutesBetween, type Order, type OrderStatus } from '../../domain/orders';
import { CardButton, OrderCard, type BadgeTone } from './OrderCard';
import { useOrders } from './ordersContext';
import { BUSINESS_NAME } from './sampleOrders';
import { useNow } from './useNow';

type BoardTab = Extract<OrderStatus, 'confirmed' | 'preparing' | 'ready' | 'done'>;

const TABS: { value: BoardTab; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'done', label: 'Done' },
];

/** After this long in the queue, the "Waiting" badge turns warmer to draw attention. */
const LONG_WAIT_MINUTES = 5;

export function OrdersBoardScreen() {
  const { orders } = useOrders();
  const [tab, setTab] = useState<BoardTab>('confirmed');
  const now = useNow();

  const inStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status).sort(byQueueNumber);
  const preparing = inStatus('preparing');

  return (
    <div className="bg-canvas mx-auto flex min-h-full max-w-md flex-col">
      <header className="border-b border-stone-200 bg-white px-5 pt-4 pb-3">
        <p className="text-sm text-stone-500">{BUSINESS_NAME}</p>
        <h1 className="text-xl font-bold">Orders · Today</h1>
      </header>

      <nav
        role="tablist"
        aria-label="Order status"
        className="grid grid-cols-4 gap-2 border-b border-stone-200 bg-white px-3 py-3"
      >
        {TABS.map(({ value, label }) => {
          const selected = value === tab;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(value)}
              className={`h-10 rounded-xl border text-sm whitespace-nowrap ${
                selected
                  ? 'border-brand-600 bg-brand-600 font-bold text-white'
                  : 'border-stone-200 bg-white font-semibold text-stone-800 hover:border-stone-300'
              }`}
            >
              {label} · {inStatus(value).length}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 px-3 py-4">
        {tab === 'confirmed' && (
          <ConfirmedTab
            confirmed={inStatus('confirmed')}
            awaiting={inStatus('awaiting')}
            preparing={preparing}
            now={now}
          />
        )}
        {tab === 'preparing' && <PreparingTab orders={preparing} now={now} />}
        {tab === 'ready' && <ReadyTab orders={inStatus('ready')} now={now} />}
        {tab === 'done' && <DoneTab orders={inStatus('done').reverse()} now={now} />}
      </main>

      <div className="pointer-events-none sticky bottom-0 flex justify-end p-5">
        <Link
          to="/orders/new"
          aria-label="New order"
          className="bg-brand-600 hover:bg-brand-700 pointer-events-auto flex size-14 items-center justify-center rounded-full text-3xl text-white shadow-lg"
        >
          +
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
}: {
  confirmed: Order[];
  awaiting: Order[];
  preparing: Order[];
  now: number;
}) {
  const { advance } = useOrders();

  return (
    <>
      {confirmed.length > 0 && (
        <p className="bg-brand-100 text-brand-700 mb-3 rounded-xl px-3 py-2 text-sm">
          {plural(confirmed.length, 'order')} confirmed and waiting —{' '}
          {preparing.length > 0
            ? `kitchen is busy with ${queueList(preparing)}.`
            : 'kitchen is free.'}{' '}
          Tap “Start” when you’re ready to begin the next one.
        </p>
      )}

      <ul className="space-y-3">
        {confirmed.map((order, index) => {
          const waited = minutesBetween(order.statusChangedAt, now);
          return (
            <OrderCard
              key={order.id}
              order={order}
              badge={{
                label: `Waiting ${Math.max(1, waited)} min`,
                tone: waited >= LONG_WAIT_MINUTES ? 'brand' : 'muted',
              }}
              action={
                // The oldest order is the one to start next.
                <CardButton
                  tone={index === 0 ? 'primary' : 'secondary'}
                  onClick={() => advance(order.id)}
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

      {preparing.length > 0 && (
        <p className="mt-6 text-center text-sm text-stone-400">
          {plural(preparing.length, 'order')} actively being made · {queueList(preparing)}
        </p>
      )}
    </>
  );
}

/** A WhatsApp quote: tap it to record the customer's answer. */
function AwaitingCard({ order, now }: { order: Order; now: number }) {
  const { advance, cancel } = useOrders();
  const [open, setOpen] = useState(false);
  const quoted = minutesBetween(order.createdAt, now);

  return (
    <OrderCard
      order={order}
      look="pending"
      badge={{ label: 'Awaiting yes', tone: 'brand' }}
      detail={quoted === 0 ? 'quoted just now' : `quoted ${quoted} min ago`}
      showTotal={false}
      action={
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="h-11 px-2 text-sm font-semibold text-stone-500 hover:text-stone-800"
        >
          {open ? 'Close' : 'Reply?'}
        </button>
      }
    >
      {open && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <CardButton tone="brand" onClick={() => advance(order.id)}>
            They said yes
          </CardButton>
          <CardButton onClick={() => cancel(order.id)}>Cancel order</CardButton>
        </div>
      )}
    </OrderCard>
  );
}

function PreparingTab({ orders, now }: { orders: Order[]; now: number }) {
  const { advance } = useOrders();
  if (orders.length === 0) return <EmptyState>Nothing on the stove right now.</EmptyState>;

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const cooking = minutesBetween(order.statusChangedAt, now);
        const late = cooking > order.readyMinutes;
        return (
          <OrderCard
            key={order.id}
            order={order}
            badge={{
              label: late ? `Running late · ${cooking} min` : `Started ${cooking} min ago`,
              tone: late ? 'alert' : 'muted',
            }}
            action={
              <CardButton tone="primary" onClick={() => advance(order.id)}>
                Ready
              </CardButton>
            }
          />
        );
      })}
    </ul>
  );
}

function ReadyTab({ orders, now }: { orders: Order[]; now: number }) {
  const { advance } = useOrders();
  if (orders.length === 0) return <EmptyState>No orders waiting for pickup.</EmptyState>;

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const waiting = minutesBetween(order.statusChangedAt, now);
        const tone: BadgeTone = waiting >= LONG_WAIT_MINUTES ? 'brand' : 'muted';
        return (
          <OrderCard
            key={order.id}
            order={order}
            badge={{ label: `Ready ${waiting} min`, tone }}
            action={
              <CardButton tone="primary" onClick={() => advance(order.id)}>
                Collected
              </CardButton>
            }
          >
            {order.phone && (
              <a
                href={whatsAppLink(order.phone, orderReadyMessage(order))}
                target="_blank"
                rel="noreferrer"
                className="text-brand-700 mt-2 inline-block text-sm font-semibold hover:underline"
              >
                Text them it’s ready
              </a>
            )}
          </OrderCard>
        );
      })}
    </ul>
  );
}

function DoneTab({ orders, now }: { orders: Order[]; now: number }) {
  if (orders.length === 0) return <EmptyState>No collected orders yet today.</EmptyState>;

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          look="muted"
          badge={{
            label: `Collected ${minutesBetween(order.statusChangedAt, now)} min ago`,
            tone: 'muted',
          }}
        />
      ))}
    </ul>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="py-12 text-center text-stone-500">{children}</p>;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function queueList(orders: Order[]): string {
  return orders.map((o) => `#${o.queueNumber}`).join(', ');
}
