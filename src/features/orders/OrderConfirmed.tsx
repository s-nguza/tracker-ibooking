import { Link } from 'react-router';
import { CheckIcon } from '../../components/icons';
import {
  describeLines,
  orderConfirmationMessage,
  orderQuoteMessage,
  whatsAppLink,
} from '../../domain/messages';
import { formatCents } from '../../domain/money';
import { orderDisplayName, type Order } from '../../domain/orders';

interface OrderConfirmedProps {
  order: Order;
  onNewOrder: () => void;
}

/** What to do next depends on how the order came in. */
export function OrderConfirmed({ order, onNewOrder }: OrderConfirmedProps) {
  const isQuote = order.status === 'awaiting';
  const who = orderDisplayName(order);

  return (
    <div className="flex flex-1 flex-col items-center px-5 py-10 text-center">
      <div className="bg-brand-100 text-brand-600 flex size-16 items-center justify-center rounded-full">
        <CheckIcon width={32} height={32} strokeWidth={2.5} />
      </div>
      <h2 className="mt-4 text-2xl font-bold">
        {isQuote ? `Quote #${order.queueNumber} saved` : `Order #${order.queueNumber} confirmed`}
      </h2>
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
            Send <strong>{who}</strong> the quote. When they reply YES, tap the order on the board
            and mark it confirmed.
          </p>
        )}

        {order.phone && (
          <a
            href={whatsAppLink(
              order.phone,
              isQuote ? orderQuoteMessage(order) : orderConfirmationMessage(order),
            )}
            target="_blank"
            rel="noreferrer"
            className={`mt-4 flex h-12 items-center justify-center rounded-xl font-semibold ${
              isQuote
                ? 'bg-brand-600 hover:bg-brand-700 text-white'
                : 'border-brand-600 text-brand-700 hover:bg-brand-50 border'
            }`}
          >
            {isQuote ? 'Send quote on WhatsApp' : 'Text them on WhatsApp'}
          </a>
        )}
      </div>

      <div className="mt-auto grid w-full grid-cols-2 gap-3 pt-8">
        <Link
          to="/"
          className="flex h-14 items-center justify-center rounded-2xl border border-stone-300 bg-white text-lg font-bold text-stone-800 hover:bg-stone-50"
        >
          View orders
        </Link>
        <button
          type="button"
          onClick={onNewOrder}
          className="h-14 rounded-2xl bg-stone-900 text-lg font-bold text-white hover:bg-stone-800"
        >
          Next order
        </button>
      </div>
    </div>
  );
}
