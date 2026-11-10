import { useState } from 'react';
import { MinusIcon, PlusIcon } from '../../components/icons';
import { CARD, SECTION_LABEL } from '../../components/styles';
import { formatCents } from '../../domain/money';
import type { MenuItem, OrderLines } from '../../domain/orders';

interface MenuPickerProps {
  menu: readonly MenuItem[];
  lines: OrderLines;
  onQuantityChange: (itemId: string, quantity: number) => void;
}

export function MenuPicker({ menu, lines, onQuantityChange }: MenuPickerProps) {
  // Categories come from the menu, in the order they first appear.
  const categories = [...new Set(menu.map((item) => item.category))];
  const [category, setCategory] = useState(categories[0]);
  const items = menu.filter((item) => item.category === category);

  return (
    <section>
      <h2 className={SECTION_LABEL}>Add items</h2>
      <div role="tablist" className="mt-2 flex flex-wrap gap-2">
        {categories.map((value) => {
          const selected = value === category;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setCategory(value)}
              className={`h-11 rounded-full px-4 text-[15px] font-bold whitespace-nowrap ${
                selected
                  ? 'bg-brand-600 text-white'
                  : 'border-line-strong text-muted hover:text-ink border'
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>

      <ul role="tabpanel" className={`${CARD} divide-line mt-3 divide-y px-5`}>
        {items.map((item) => (
          <MenuRow
            key={item.id}
            item={item}
            quantity={lines[item.id] ?? 0}
            onQuantityChange={(qty) => onQuantityChange(item.id, qty)}
          />
        ))}
      </ul>
    </section>
  );
}

function MenuRow({
  item,
  quantity,
  onQuantityChange,
}: {
  item: MenuItem;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  if (item.soldOut) {
    return (
      <li className="flex items-center justify-between gap-4 py-4">
        <p className="text-muted/70 text-lg font-bold">{item.name}</p>
        <p className="shrink-0 text-sm font-semibold text-red-300">Sold out today</p>
      </li>
    );
  }

  const details = [formatCents(item.priceCents)];
  if (item.prepMinutes > 0) details.push(`${item.prepMinutes} min`);

  return (
    <li className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-lg font-bold">{item.name}</p>
        <p className="text-muted">{details.join(' · ')}</p>
      </div>
      {quantity === 0 ? (
        <button
          type="button"
          aria-label={`Add ${item.name}`}
          onClick={() => onQuantityChange(1)}
          className="bg-brand-100 text-brand-300 hover:bg-brand-50 flex size-11 shrink-0 items-center justify-center rounded-full"
        >
          <PlusIcon strokeWidth={2.5} />
        </button>
      ) : (
        <div className="bg-brand-50 flex shrink-0 items-center gap-2 rounded-full p-1">
          <button
            type="button"
            aria-label={`Remove one ${item.name}`}
            onClick={() => onQuantityChange(quantity - 1)}
            className="text-brand-300 bg-surface flex size-9 items-center justify-center rounded-full"
          >
            <MinusIcon strokeWidth={2.5} />
          </button>
          <span className="text-brand-300 w-5 text-center text-lg font-bold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={`Add one more ${item.name}`}
            onClick={() => onQuantityChange(quantity + 1)}
            className="bg-brand-600 hover:bg-brand-700 flex size-9 items-center justify-center rounded-full text-white"
          >
            <PlusIcon strokeWidth={2.5} />
          </button>
        </div>
      )}
    </li>
  );
}
