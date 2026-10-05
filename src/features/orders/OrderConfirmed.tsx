import { CheckIcon } from '../../components/icons';
import {
  describeLines,
  orderConfirmationMessage,
  whatsAppLink,
  type OrderConfirmationDetails,
} from '../../domain/messages';
import { formatCents } from '../../domain/money';
import type { OrderChannel } from '../../domain/orders';
import { normalizeZaPhone } from '../../domain/phone';

export interface ConfirmedOrder extends OrderConfirmationDetails {
  channel: OrderChannel;
  phone: string;
}

interface OrderConfirmedProps {
  order: ConfirmedOrder;
  onNewOrder: () => void;
}

/** What to do next depends on how the order came in. */
export function OrderConfirmed({ order, onNewOrder }: OrderConfirmedProps) {
  const phone = normalizeZaPhone(order.phone);
  const who = order.customerName || `#${order.queueNumber}`;

  return (
    <div className="flex flex-1 flex-col items-center px-5 py-10 text-center">
      <div className="bg-brand-100 text-brand-600 flex size-16 items-center justify-center rounded-full">
        <CheckIcon width={32} height={32} strokeWidth={2.5} />
      </div>
      <h2 className="mt-4 text-2xl font-bold">Order #{order.queueNumber} confirmed</h2>
      <p className="mt-1 text-stone-600">
        {describeLines(order.lines)} · {formatCents(order.totalCents)}
      </p>

      <div className="mt-6 w-full rounded-2xl border border-stone-200 bg-white p-4 text-left">
        {order.channel === 'walk-in' && (
          <p>
            Give them number <strong>#{order.queueNumber}</strong> and call it out in about{' '}
            {order.readyMinutes} min.
          </p>
        )}
        {order.channel === 'call' && (
          <p>
            Tell <strong>{who}</strong> it will be ready in about {order.readyMinutes} min.
          </p>
        )}
        {order.channel === 'whatsapp' && (
          <p>
            Send <strong>{who}</strong> the confirmation so they know when to come.
          </p>
        )}

        {phone && order.channel === 'whatsapp' && (
          <a
            href={whatsAppLink(phone, orderConfirmationMessage(order))}
            target="_blank"
            rel="noreferrer"
            className="bg-brand-600 hover:bg-brand-700 mt-4 flex h-12 items-center justify-center rounded-xl font-semibold text-white"
          >
            Send on WhatsApp
          </a>
        )}
        {phone && order.channel !== 'whatsapp' && (
          <a
            href={whatsAppLink(phone, orderConfirmationMessage(order))}
            target="_blank"
            rel="noreferrer"
            className="border-brand-600 text-brand-700 hover:bg-brand-50 mt-4 flex h-12 items-center justify-center rounded-xl border font-semibold"
          >
            Text them on WhatsApp
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={onNewOrder}
        className="mt-auto h-14 w-full rounded-2xl bg-stone-900 text-lg font-bold text-white hover:bg-stone-800"
      >
        Next order
      </button>
    </div>
  );
}
