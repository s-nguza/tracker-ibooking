import { Link } from 'react-router';
import { CheckIcon } from '../../components/icons';
import { BUTTON_OUTLINE, BUTTON_PRIMARY, CARD } from '../../components/styles';
import {
  describeLines,
  orderConfirmationMessage,
  orderQuoteMessage,
  readyPhrase,
  whatsAppLink,
} from '../../domain/messages';
import { formatCents } from '../../domain/money';
import type { Order } from '../../domain/orders';

interface OrderConfirmedProps {
  order: Order;
  /** Whether copying the quote worked; null when nothing was copied. */
  quoteCopied: boolean | null;
  onNewOrder: () => void;
}

/** What to do next depends on how the order came in. */
export function OrderConfirmed({ order, quoteCopied, onNewOrder }: OrderConfirmedProps) {
  const isQuote = order.status === 'awaiting';
  const who = order.customerName ?? 'the customer';
  const ready = readyPhrase(order.readyMinutes);

  return (
    <div className="flex flex-1 flex-col items-center px-5 pt-6 pb-6 text-center">
      <div className="bg-brand-100 text-brand-300 flex size-16 items-center justify-center rounded-full">
        <CheckIcon width={32} height={32} strokeWidth={2.5} />
      </div>
      <h2 className="mt-4 text-2xl font-extrabold">
        {isQuote ? `Quote #${order.queueNumber} saved` : `Order #${order.queueNumber} confirmed`}
      </h2>
      <p className="text-muted mt-1">
        {describeLines(order.lines)} · {formatCents(order.totalCents)}
      </p>

      <div className={`${CARD} mt-6 w-full p-5 text-left`}>
        {isQuote ? (
          <>
            {quoteCopied === true && <p className="font-bold">Quote copied.</p>}
            {quoteCopied === false && (
              <p className="font-bold text-red-300">
                Couldn’t copy the quote. You can copy it from the order screen.
              </p>
            )}
            <p>
              Send it, then wait for <strong>{who}</strong> to say yes. Open the order on the board
              to confirm it.
            </p>
          </>
        ) : order.channel === 'walk-in' ? (
          <p>
            Give them number <strong>#{order.queueNumber}</strong> and call it out {ready}.
          </p>
        ) : (
          <p>
            Tell <strong>{who}</strong> it will be ready {ready}.
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
            className="bg-ok-700 hover:bg-ok-600 mt-4 flex h-12 items-center justify-center rounded-2xl font-bold text-white"
          >
            {isQuote ? 'Send quote on WhatsApp' : 'Send on WhatsApp'}
          </a>
        )}
      </div>

      <div className="mt-auto grid w-full grid-cols-2 gap-3 pt-8">
        <Link to="/orders" className={BUTTON_OUTLINE}>
          View orders
        </Link>
        <button type="button" onClick={onNewOrder} className={BUTTON_PRIMARY}>
          Next order
        </button>
      </div>
    </div>
  );
}
