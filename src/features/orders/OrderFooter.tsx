import { ClockIcon } from '../../components/icons';
import { describeLines } from '../../domain/messages';
import { formatCents, type Cents } from '../../domain/money';
import type { OrderChannel } from '../../domain/orders';

const READY_TIME_PROMPT: Record<OrderChannel, string> = {
  call: 'Tell the caller',
  whatsapp: 'Let them know',
  'walk-in': 'Tell the customer',
};

interface OrderFooterProps {
  channel: OrderChannel;
  itemCount: number;
  lines: { name: string; quantity: number }[];
  totalCents: Cents;
  readyMinutes: number;
  /** Why the order can't be confirmed yet, or null when it can. */
  blocker: string | null;
  onConfirm: () => void;
}

export function OrderFooter({
  channel,
  itemCount,
  lines,
  totalCents,
  readyMinutes,
  blocker,
  onConfirm,
}: OrderFooterProps) {
  return (
    <footer className="sticky bottom-0 border-t border-stone-200 bg-white px-5 pt-5 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1 text-stone-600">
          <p className="truncate">
            {itemCount === 0
              ? 'No items yet'
              : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${describeLines(lines)}`}
          </p>
          {readyMinutes > 0 && (
            <p className="flex items-center gap-2">
              <ClockIcon className="shrink-0" />
              {READY_TIME_PROMPT[channel]}: ready in about {readyMinutes} min
            </p>
          )}
        </div>
        <p className="text-2xl font-bold whitespace-nowrap">{formatCents(totalCents)}</p>
      </div>

      {blocker && <p className="text-brand-700 mt-3 text-sm font-medium">{blocker}</p>}

      <button
        type="button"
        onClick={onConfirm}
        disabled={blocker !== null}
        className="bg-brand-600 hover:bg-brand-700 mt-4 h-14 w-full rounded-2xl text-lg font-bold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        Confirm order
      </button>
    </footer>
  );
}
