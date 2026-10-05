import { useState } from 'react';
import { Link } from 'react-router';
import { CloseIcon } from '../../components/icons';
import {
  estimateReadyMinutes,
  orderItemCount,
  orderTotalCents,
  selectedItems,
  setLineQuantity,
  type OrderChannel,
  type OrderLines,
} from '../../domain/orders';
import { ChannelPicker } from './ChannelPicker';
import { CustomerCard } from './CustomerCard';
import { contactProblem, type CustomerContact } from './customerContact';
import { MenuPicker } from './MenuPicker';
import { OrderConfirmed, type ConfirmedOrder } from './OrderConfirmed';
import { OrderFooter } from './OrderFooter';
import { SAMPLE_MENU } from './sampleMenu';

// Until orders are persisted, numbering starts here and counts up per session.
const FIRST_QUEUE_NUMBER = 17;

const EMPTY_CONTACT: CustomerContact = { name: '', phone: '' };

export function NewOrderScreen() {
  const menu = SAMPLE_MENU;
  const [queueNumber, setQueueNumber] = useState(FIRST_QUEUE_NUMBER);
  const [channel, setChannel] = useState<OrderChannel>('walk-in');
  const [contact, setContact] = useState<CustomerContact>(EMPTY_CONTACT);
  const [lines, setLines] = useState<OrderLines>({});
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);

  const selected = selectedItems(menu, lines).map(({ item, quantity }) => ({
    name: item.name,
    quantity,
  }));
  const itemCount = orderItemCount(lines);
  const totalCents = orderTotalCents(menu, lines);
  const readyMinutes = estimateReadyMinutes(menu, lines);
  const blocker =
    contactProblem(channel, contact) ?? (itemCount === 0 ? 'Add at least one item' : null);

  function confirm() {
    if (blocker) return;
    setConfirmed({
      channel,
      queueNumber,
      customerName: contact.name.trim() || undefined,
      phone: contact.phone.trim(),
      lines: selected,
      totalCents,
      readyMinutes,
    });
  }

  function startNextOrder() {
    setQueueNumber((n) => n + 1);
    setContact(EMPTY_CONTACT);
    setLines({});
    setConfirmed(null);
  }

  return (
    <div className="bg-canvas mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 grid grid-cols-[3rem_1fr_3rem] items-center border-b border-stone-200 bg-white px-3 py-4">
        <Link
          to="/"
          aria-label="Close"
          className="flex size-12 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100"
        >
          <CloseIcon width={26} height={26} />
        </Link>
        <h1 className="text-center text-xl font-bold">New order</h1>
      </header>

      {confirmed ? (
        <OrderConfirmed order={confirmed} onNewOrder={startNextOrder} />
      ) : (
        <>
          <main className="flex-1 space-y-6 px-5 py-5">
            <ChannelPicker value={channel} onChange={setChannel} />
            <CustomerCard
              key={channel}
              channel={channel}
              queueNumber={queueNumber}
              contact={contact}
              onChange={setContact}
            />
            <MenuPicker
              menu={menu}
              lines={lines}
              onQuantityChange={(id, qty) => setLines((prev) => setLineQuantity(prev, id, qty))}
            />
          </main>
          <OrderFooter
            channel={channel}
            itemCount={itemCount}
            lines={selected}
            totalCents={totalCents}
            readyMinutes={readyMinutes}
            blocker={blocker}
            onConfirm={confirm}
          />
        </>
      )}
    </div>
  );
}
