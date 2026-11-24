import { useState } from 'react';
import { BUTTON_OUTLINE, BUTTON_PRIMARY, FIELD_LABEL, TEXT_INPUT } from '../../components/styles';
import {
  centsToRandsInput,
  defaultPrepMinutes,
  itemProblem,
  LIMITS,
  parseRands,
  type Menu,
  type MenuEntry,
} from '../../domain/menu';
import { Sheet } from './Sheet';
import { newId } from '../../domain/ids';

/** Add a new item, or change or delete an existing one. */
export function ItemSheet({
  menu,
  item,
  categoryId,
  onSave,
  onDelete,
  onClose,
}: {
  menu: Menu;
  /** The item being edited; left out when adding. */
  item?: MenuEntry;
  /** Where a new item goes. */
  categoryId: string;
  onSave: (item: MenuEntry) => void;
  onDelete: (itemId: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? centsToRandsInput(item.priceCents) : '');
  const [prepMinutes, setPrepMinutes] = useState(
    String(item?.prepMinutes ?? defaultPrepMinutes(menu, categoryId)),
  );
  const [category, setCategory] = useState(item?.categoryId ?? categoryId);
  const [soldOut, setSoldOut] = useState(item?.soldOut ?? false);
  const [tried, setTried] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const problem = itemProblem(menu, {
    id: item?.id,
    categoryId: category,
    name,
    price,
    prepMinutes,
  });

  function save() {
    setTried(true);
    const priceCents = parseRands(price);
    if (problem || priceCents === null) return;
    onSave({
      id: item?.id ?? newId(),
      categoryId: category,
      name: name.trim(),
      priceCents,
      prepMinutes: Number(prepMinutes),
      soldOut,
    });
  }

  return (
    <Sheet title={item ? 'Edit item' : 'Add item'} onClose={onClose}>
      <form
        noValidate
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="block">
          <span className={FIELD_LABEL}>Item name</span>
          <input
            autoFocus={!item}
            value={name}
            maxLength={LIMITS.itemName}
            placeholder="e.g. Kota with egg"
            onChange={(e) => setName(e.target.value)}
            className={`${TEXT_INPUT} mt-1.5`}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={FIELD_LABEL}>Price</span>
            <span className="relative mt-1.5 block">
              <span className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-bold">
                R
              </span>
              <input
                inputMode="decimal"
                value={price}
                placeholder="35.00"
                onChange={(e) => setPrice(e.target.value)}
                className={`${TEXT_INPUT} pl-7`}
              />
            </span>
          </label>
          <label className="block">
            <span className={FIELD_LABEL}>Time to make</span>
            <span className="relative mt-1.5 block">
              <input
                inputMode="numeric"
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(e.target.value)}
                className={`${TEXT_INPUT} pr-12`}
              />
              <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-bold">
                min
              </span>
            </span>
          </label>
        </div>
        <p className="text-muted -mt-2 text-sm">
          Use 0 for drinks and anything handed over straight away.
        </p>

        <label className="block">
          <span className={FIELD_LABEL}>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${TEXT_INPUT} mt-1.5`}
          >
            {menu.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 font-semibold">
          <input
            type="checkbox"
            checked={soldOut}
            onChange={(e) => setSoldOut(e.target.checked)}
            className="accent-brand-600 size-5"
          />
          Sold out today
        </label>

        {tried && problem && (
          <p role="alert" className="text-sm font-semibold text-red-300">
            {problem}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" onClick={onClose} className={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="submit" className={BUTTON_PRIMARY}>
            {item ? 'Save' : 'Add item'}
          </button>
        </div>

        {item &&
          (confirmingDelete ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3">
              <p className="font-bold text-red-200">Delete {item.name}? Past orders keep it.</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="border-line-strong bg-surface h-11 rounded-2xl border font-bold"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="h-11 rounded-2xl bg-red-600 font-bold text-white hover:bg-red-700"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="h-11 w-full font-bold text-red-300 hover:underline"
            >
              Delete item
            </button>
          ))}
      </form>
    </Sheet>
  );
}
