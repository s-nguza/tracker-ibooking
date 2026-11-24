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
  type PaymentMethod,
} from '../../domain/orders';
import { normalizeZaPhone } from '../../domain/phone';
import { ChannelPicker } from './ChannelPicker';
import { copyText } from './copyText';
import { CustomerCard } from './CustomerCard';
import { contactProblem, type CustomerContact } from './customerContact';
import { useKitchenCapacity } from '../menu/menuContext';
import { MenuPicker } from './MenuPicker';
import { OrderConfirmed } from './OrderConfirmed';
import { OrderFooter } from './OrderFooter';
import { useOrders } from './ordersContext';
import { describeRepeatCustomer } from './orderStatusUi';
import { PaymentPicker } from './PaymentPicker';
import { SpecialRequestField } from './SpecialRequest';
import { useMenu } from './useMenu';
import { useNow } from './useNow';

const EMPTY_CONTACT: CustomerContact = { name: '', phone: '' };

export function NewOrderScreen() {
  const menu = useMenu();
  const capacity = useKitchenCapacity();
  const { orders, nextQueueNumber, addOrder } = useOrders();
  const now = useNow();
  const [channel, setChannel] = useState<OrderChannel>('call');
  const [contact, setContact] = useState<CustomerContact>(EMPTY_CONTACT);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [lines, setLines] = useState<OrderLines>({});
  const [specialRequest, setSpecialRequest] = useState('');
  const [confirmed, setConfirmed] = useState<Order | null>(null);
  const [quoteCopied, setQuoteCopied] = useState<boolean | null>(null);

  const selected = buildOrderLines(menu, lines);
  const itemCount = orderItemCount(lines);
  const totalCents = orderTotalCents(menu, lines);
  const prepMinutes = orderPrepMinutes(menu, lines);
  const estimate = estimateReadyTime(selected, orders, capacity, now);
  const blocker =
    contactProblem(channel, contact) ??
    (paymentMethod === null
      ? 'Choose cash or card'
      : itemCount === 0
        ? 'Add at least one item'
        : null);

  const phone = normalizeZaPhone(contact.phone);
  const repeatCustomer = phone ? findRepeatCustomer(orders, phone) : null;

  /** Recognising a number fills in the name, unless one was already typed. */
  function changeContact(next: CustomerContact) {
    const nextPhone = next.phone !== contact.phone ? normalizeZaPhone(next.phone) : null;
    const known = nextPhone ? findRepeatCustomer(orders, nextPhone) : null;
    setContact(known?.name && !next.name.trim() ? { ...next, name: known.name } : next);
  }

  function saveOrder(method: PaymentMethod, asQuote: boolean): Order {
    const order = addOrder(
      {
        channel,
        paymentMethod: method,
        specialRequest: specialRequest.trim() || undefined,
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
    if (blocker || !paymentMethod) return;
    saveOrder(paymentMethod, false);
  }

  async function copyQuote() {
    if (blocker || !paymentMethod) return;
    const order = saveOrder(paymentMethod, true);
    setQuoteCopied(await copyText(orderQuoteMessage(order)));
  }

  function startNextOrder() {
    setContact(EMPTY_CONTACT);
    setPaymentMethod(null);
    setLines({});
    setSpecialRequest('');
    setConfirmed(null);
    setQuoteCopied(null);
  }

  return (
    <div className={SCREEN}>
      <header className="bg-night/85 sticky top-0 z-10 grid grid-cols-[3rem_1fr_3rem] items-center px-4 py-3 backdrop-blur">
        <Link to="/orders" aria-label="Close" className={ROUND_BUTTON}>
          <CloseIcon width={22} height={22} />
        </Link>
        <h1 className="text-center text-xl font-extrabold">New order</h1>
      </header>

      {confirmed ? (
        <OrderConfirmed
          // The saved copy, in case another phone took this queue number and it moved on.
          order={orders.find((o) => o.id === confirmed.id) ?? confirmed}
          quoteCopied={quoteCopied}
          onNewOrder={startNextOrder}
        />
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
                <p className="bg-brand-50 text-brand-300 mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold">
                  <CheckIcon className="shrink-0" width={16} height={16} strokeWidth={2.5} />
                  {describeRepeatCustomer(repeatCustomer)}
                </p>
              )}
            </div>
            <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />
            <MenuPicker
              menu={menu}
              lines={lines}
              onQuantityChange={(id, qty) => setLines((prev) => setLineQuantity(prev, id, qty))}
            />
            <SpecialRequestField value={specialRequest} onChange={setSpecialRequest} />
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
