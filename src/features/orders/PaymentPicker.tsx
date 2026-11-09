import { SECTION_LABEL, SEGMENT_TRACK, segmentClass } from '../../components/styles';
import type { PaymentMethod } from '../../domain/orders';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
];

interface PaymentPickerProps {
  /** Null until staff choose, so nobody collects on a default they never asked about. */
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentPicker({ value, onChange }: PaymentPickerProps) {
  return (
    <div>
      <h2 id="payment-label" className={SECTION_LABEL}>
        How will they pay?
      </h2>
      <div role="radiogroup" aria-labelledby="payment-label" className={`${SEGMENT_TRACK} mt-2`}>
        {METHODS.map(({ value: method, label }) => {
          const selected = method === value;
          return (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(method)}
              className={`h-11 flex-1 rounded-xl text-[15px] ${segmentClass(selected)}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
