import { ClockIcon } from '../../components/icons';
import { BOTTOM_BAR, BUTTON_PRIMARY } from '../../components/styles';
import { describeLines } from '../../domain/messages';
import { formatCents, type Cents } from '../../domain/money';
import type { ReadyEstimate } from '../../domain/orders';
import { describeEstimate } from './orderStatusUi';

interface OrderFooterProps {
  itemCount: number;
  lines: { name: string; quantity: number }[];
  totalCents: Cents;
  estimate: ReadyEstimate;
  /** Why the order can't be confirmed yet, or null when it can. */
  blocker: string | null;
  onConfirm: () => void;
  /** Saves the order as a quote and copies the text. Left out when a quote makes no sense. */
  onCopyQuote?: () => void;
}

export function OrderFooter({
  itemCount,
  lines,
  totalCents,
  estimate,
  blocker,
  onConfirm,
  onCopyQuote,
}: OrderFooterProps) {
  return (
    <footer className={BOTTOM_BAR}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted min-w-0 truncate">
          {itemCount === 0
            ? 'No items yet'
            : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${describeLines(lines)}`}
        </p>
        <p className="text-3xl font-extrabold whitespace-nowrap">{formatCents(totalCents)}</p>
      </div>

      {itemCount > 0 && (
        <div className="mt-2">
          <p className="bg-canvas inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold">
            <ClockIcon className="shrink-0" width={18} height={18} />
            {estimate.totalMinutes > 0
              ? `Ready in about ${estimate.totalMinutes} min`
              : 'Nothing to cook: hand it over straight away'}
          </p>
          {describeEstimate(estimate).map((line) => (
            <p key={line} className="text-muted mt-1 text-sm">
              {line}
            </p>
          ))}
        </div>
      )}

      {blocker && <p className="text-warn-800 mt-2 text-sm font-semibold">{blocker}</p>}

      <button
        type="button"
        onClick={onConfirm}
        disabled={blocker !== null}
        className={`${BUTTON_PRIMARY} mt-3`}
      >
        Confirm order
      </button>
      {onCopyQuote && (
        <button
          type="button"
          onClick={onCopyQuote}
          disabled={blocker !== null}
          className="text-muted hover:text-ink mt-1 h-11 w-full font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy quote to send first
        </button>
      )}
    </footer>
  );
}
