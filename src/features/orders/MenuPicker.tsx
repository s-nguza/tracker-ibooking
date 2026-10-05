import { useState } from 'react';
import { formatCents } from '../../domain/money';
import type { MenuCategory, MenuItem, OrderLines } from '../../domain/orders';

const CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: 'meals', label: 'Meals' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'extras', label: 'Extras' },
];

interface MenuPickerProps {
  menu: readonly MenuItem[];
  lines: OrderLines;
  onQuantityChange: (itemId: string, quantity: number) => void;
}

export function MenuPicker({ menu, lines, onQuantityChange }: MenuPickerProps) {
  const [category, setCategory] = useState<MenuCategory>('meals');
  const items = menu.filter((item) => item.category === category);

  return (
    <section>
      <h2 className="text-sm font-bold tracking-widest text-stone-500 uppercase">Add items</h2>
      <div role="tablist" className="mt-2 flex gap-6 border-b border-stone-200">
        {CATEGORIES.map(({ value, label }) => {
          const selected = value === category;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setCategory(value)}
              className={`-mb-px border-b-2 py-2 text-lg ${
                selected
                  ? 'border-brand-600 text-brand-600 font-semibold'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ul role="tabpanel" className="divide-y divide-stone-200">
        {items.map((item) => (
          <MenuRow
            key={item.id}
            item={item}
            quantity={lines[item.id] ?? 0}
            onQuantityChange={(qty) => onQuantityChange(item.id, qty)}
          />
        ))}
        {items.length === 0 && <li className="py-6 text-stone-500">Nothing here yet.</li>}
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
      <li className="py-4">
        <p className="text-lg text-stone-400">{item.name}</p>
        <p className="text-brand-600">Sold out today</p>
      </li>
    );
  }

  const details = [formatCents(item.priceCents)];
  if (item.prepMinutes > 0) details.push(`~${item.prepMinutes} min`);

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-lg">{item.name}</p>
        <p className="text-stone-600">{details.join(' · ')}</p>
      </div>
      {quantity === 0 ? (
        <button
          type="button"
          aria-label={`Add ${item.name}`}
          onClick={() => onQuantityChange(1)}
          className="border-brand-600 text-brand-600 hover:bg-brand-50 flex size-11 items-center justify-center rounded-full border text-xl"
        >
          +
        </button>
      ) : (
        <div className="bg-brand-100 flex items-center gap-3 rounded-full p-1.5">
          <button
            type="button"
            aria-label={`Remove one ${item.name}`}
            onClick={() => onQuantityChange(quantity - 1)}
            className="text-brand-600 flex size-9 items-center justify-center rounded-full bg-white text-xl"
          >
            −
          </button>
          <span className="w-5 text-center text-lg font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={`Add one more ${item.name}`}
            onClick={() => onQuantityChange(quantity + 1)}
            className="bg-brand-600 flex size-9 items-center justify-center rounded-full text-xl text-white"
          >
            +
          </button>
        </div>
      )}
    </li>
  );
}
