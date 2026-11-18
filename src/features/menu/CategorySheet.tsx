import { useState } from 'react';
import { MinusIcon, PlusIcon } from '../../components/icons';
import { BUTTON_OUTLINE, BUTTON_PRIMARY, FIELD_LABEL, TEXT_INPUT } from '../../components/styles';
import { categoryProblem, LIMITS, type Menu, type MenuCategory } from '../../domain/menu';
import { Sheet } from './Sheet';

/** Add a new category, or rename one, change its capacity, or delete it when empty. */
export function CategorySheet({
  menu,
  category,
  onSave,
  onDelete,
  onClose,
}: {
  menu: Menu;
  /** The category being edited; left out when adding. */
  category?: MenuCategory;
  onSave: (category: MenuCategory) => void;
  onDelete: (categoryId: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [capacity, setCapacity] = useState(category?.capacity ?? 1);
  const [tried, setTried] = useState(false);
  const problem = categoryProblem(menu, { id: category?.id, name, capacity });
  const itemCount = category ? menu.items.filter((i) => i.categoryId === category.id).length : 0;

  const stepButton =
    'border-line-strong hover:bg-canvas flex size-12 items-center justify-center rounded-2xl border disabled:opacity-40';

  return (
    <Sheet title={category ? 'Edit category' : 'Add category'} onClose={onClose}>
      <form
        noValidate
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (problem) return;
          onSave({ id: category?.id ?? crypto.randomUUID(), name: name.trim(), capacity });
        }}
      >
        <label className="block">
          <span className={FIELD_LABEL}>Category name</span>
          <input
            autoFocus={!category}
            value={name}
            maxLength={LIMITS.categoryName}
            placeholder="e.g. Kotas, Plates, Drinks"
            onChange={(e) => setName(e.target.value)}
            className={`${TEXT_INPUT} mt-1.5`}
          />
        </label>

        <div>
          <p id="capacity-label" className={FIELD_LABEL}>
            Orders you can cook at once
          </p>
          <div
            className="mt-1.5 flex items-center gap-3"
            role="group"
            aria-labelledby="capacity-label"
          >
            <button
              type="button"
              aria-label="One fewer"
              disabled={capacity <= 1}
              onClick={() => setCapacity((c) => c - 1)}
              className={stepButton}
            >
              <MinusIcon />
            </button>
            <output className="w-10 text-center text-2xl font-extrabold" aria-live="polite">
              {capacity}
            </output>
            <button
              type="button"
              aria-label="One more"
              disabled={capacity >= LIMITS.maxCapacity}
              onClick={() => setCapacity((c) => c + 1)}
              className={stepButton}
            >
              <PlusIcon />
            </button>
          </div>
          <p className="text-muted mt-1.5 text-sm">
            E.g. 2 if you can make two kota orders side by side. Ready times use this.
          </p>
        </div>

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
            {category ? 'Save' : 'Add category'}
          </button>
        </div>

        {category &&
          (itemCount === 0 ? (
            <button
              type="button"
              onClick={() => onDelete(category.id)}
              className="h-11 w-full font-bold text-red-300 hover:underline"
            >
              Delete category
            </button>
          ) : (
            <p className="text-muted text-center text-sm">
              To delete this category, move or delete its {itemCount}{' '}
              {itemCount === 1 ? 'item' : 'items'} first.
            </p>
          ))}
      </form>
    </Sheet>
  );
}
