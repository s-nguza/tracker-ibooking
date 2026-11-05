import { useState } from 'react';
import { Link } from 'react-router';
import { CheckIcon, CloseIcon } from '../../components/icons';
import { ROUND_BUTTON, SCREEN } from '../../components/styles';
import { orderQuoteMessage } from '../../domain/messages';
import {
  buildOrderLines,
  estimateReadyTime,
  findRepeatCustomer,
  orderItemCount,
  orderPrepMinutes,
  orderTotalCents,
  setLineQuantity,
  type Order,
  type OrderChannel,
  type OrderLines,
} from '../../domain/orders';
import { normalizeZaPhone } from '../../domain/phone';
import { ChannelPicker } from './ChannelPicker';
import { copyText } from './copyText';
import { CustomerCard } from './CustomerCard';
import { contactProblem, type CustomerContact } from './customerContact';
import { MenuPicker } from './MenuPicker';
import { OrderConfirmed } from './OrderConfirmed';
import { OrderFooter } from './OrderFooter';
import { useOrders } from './ordersContext';
import { describeRepeatCustomer } from './orderStatusUi';
import { useMenu } from './useMenu';
import { useNow } from './useNow';

const EMPTY_CONTACT: CustomerContact = { name: '', phone: '' };

export function NewOrderScreen() {
  const menu = useMenu();
  const { orders, nextQueueNumber, addOrder } = useOrders();
  const now = useNow();
  const [channel, setChannel] = useState<OrderChannel>('call');
  const [contact, setContact] = useState<CustomerContact>(EMPTY_CONTACT);
  const [lines, setLines] = useState<OrderLines>({});
  const [confirmed, setConfirmed] = useState<Order | null>(null);
  const [quoteCopied, setQuoteCopied] = useState<boolean | null>(null);

  const selected = buildOrderLines(menu, lines);
  const itemCount = orderItemCount(lines);
  const totalCents = orderTotalCents(menu, lines);
  const prepMinutes = orderPrepMinutes(menu, lines);
  const estimate = estimateReadyTime(prepMinutes, orders, now);
  const blocker =
    contactProblem(channel, contact) ?? (itemCount === 0 ? 'Add at least one item' : null);

  const phone = normalizeZaPhone(contact.phone);
  const repeatCustomer = phone ? findRepeatCustomer(orders, phone) : null;

  /** Recognising a number fills in the name, unless one was already typed. */
  function changeContact(next: CustomerContact) {
    const nextPhone = next.phone !== contact.phone ? normalizeZaPhone(next.phone) : null;
    const known = nextPhone ? findRepeatCustomer(orders, nextPhone) : null;
    setContact(known?.name && !next.name.trim() ? { ...next, name: known.name } : next);
  }

  function saveOrder(asQuote: boolean): Order {
    const order = addOrder(
      {
        channel,
        customerName: contact.name.trim() || undefined,
        phone: phone ?? undefined,
        lines: selected,
        totalCents,
        prepMinutes,
        readyMinutes: estimate.totalMinutes,
      },
      { asQuote },
    );
    setConfirmed(order);
    return order;
  }

  function confirm() {
    if (blocker) return;
    saveOrder(false);
  }

  async function copyQuote() {
    if (blocker) return;
    const order = saveOrder(true);
    setQuoteCopied(await copyText(orderQuoteMessage(order)));
  }

  function startNextOrder() {
    setContact(EMPTY_CONTACT);
    setLines({});
    setConfirmed(null);
    setQuoteCopied(null);
  }

  return (
    <div className={SCREEN}>
      <header className="bg-canvas sticky top-0 z-10 grid grid-cols-[3rem_1fr_3rem] items-center px-4 py-3">
        <Link to="/" aria-label="Close" className={ROUND_BUTTON}>
          <CloseIcon width={22} height={22} />
        </Link>
        <h1 className="text-center text-xl font-extrabold">New order</h1>
      </header>

      {confirmed ? (
        <OrderConfirmed order={confirmed} quoteCopied={quoteCopied} onNewOrder={startNextOrder} />
      ) : (
        <>
          <main className="flex-1 space-y-5 px-5 pt-1 pb-6">
            <ChannelPicker value={channel} onChange={setChannel} />
            <div>
              <CustomerCard
                key={channel}
                channel={channel}
                queueNumber={nextQueueNumber}
                contact={contact}
                onChange={changeContact}
              />
              {repeatCustomer && (
                <p className="bg-brand-50 text-brand-700 mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold">
                  <CheckIcon className="shrink-0" width={16} height={16} strokeWidth={2.5} />
                  {describeRepeatCustomer(repeatCustomer)}
                </p>
              )}
            </div>
            <MenuPicker
              menu={menu}
              lines={lines}
              onQuantityChange={(id, qty) => setLines((prev) => setLineQuantity(prev, id, qty))}
            />
          </main>
          <OrderFooter
            itemCount={itemCount}
            lines={selected}
            totalCents={totalCents}
            estimate={estimate}
            blocker={blocker}
            onConfirm={confirm}
            onCopyQuote={channel === 'walk-in' ? undefined : copyQuote}
          />
        </>
      )}
    </div>
  );
}
