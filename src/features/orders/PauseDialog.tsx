import { useEffect, useRef, useState } from 'react';
import { BUTTON_OUTLINE, BUTTON_PRIMARY } from '../../components/styles';
import { PAUSE_REASONS } from './orderStatusUi';
import { useOrders } from './ordersContext';

/** Bottom sheet that pauses an order. It can't be confirmed without a reason. */
export function PauseDialog({
  orderId,
  queueNumber,
  onClose,
}: {
  orderId: string;
  queueNumber: number;
  onClose: () => void;
}) {
  const { pause } = useOrders();
  const [reason, setReason] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="pause-title"
      className="text-ink backdrop:bg-ink/50 mx-auto mt-auto mb-0 w-full max-w-md rounded-t-4xl bg-white p-5"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason.trim()) return;
          pause(orderId, reason);
          onClose();
        }}
      >
        <h2 id="pause-title" className="text-xl font-extrabold">
          Pause order #{queueNumber}?
        </h2>
        <p className="text-muted mt-1">The timer stops until you resume it. Why is it paused?</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PAUSE_REASONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={reason === option}
              onClick={() => setReason(option)}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold ${
                reason === option
                  ? 'bg-ink text-white'
                  : 'border-line-strong hover:bg-canvas border bg-white'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-muted text-sm font-medium">Reason</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Pick one above or type your own"
            className="border-line-strong focus:border-brand-600 mt-1 h-12 w-full rounded-2xl border px-3 font-semibold outline-none"
          />
        </label>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className={BUTTON_OUTLINE}>
            Keep cooking
          </button>
          <button type="submit" disabled={!reason.trim()} className={BUTTON_PRIMARY}>
            Pause order
          </button>
        </div>
      </form>
    </dialog>
  );
}
