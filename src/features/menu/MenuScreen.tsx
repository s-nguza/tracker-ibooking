import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { CloseIcon, PlusIcon } from '../../components/icons';
import { BOTTOM_BAR, BUTTON_PRIMARY, CARD, ROUND_BUTTON, SCREEN } from '../../components/styles';
import {
  hasItems,
  removeCategory,
  removeItem,
  saveCategory,
  saveItem,
  type Menu,
  type MenuCategory,
  type MenuEntry,
} from '../../domain/menu';
import { formatCents } from '../../domain/money';
import { CategorySheet } from './CategorySheet';
import { ItemSheet } from './ItemSheet';
import { useMenuStore } from './menuContext';
import { EMPTY_MENU, KASI_MENU } from './templates';

type OpenSheet =
  | { kind: 'item'; categoryId: string; item?: MenuEntry }
  | { kind: 'category'; category?: MenuCategory };

/**
 * The business's menu: categories, and the items in each. Opened straight after
 * registering (`?setup=1`) and from the orders board. Every change saves at once.
 */
export function MenuScreen() {
  const { saved, setMenu, start, loading, saveError } = useMenuStore();
  const [params] = useSearchParams();
  const setup = params.get('setup') === '1';
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<OpenSheet | null>(null);

  function save(next: Menu) {
    setMenu(next);
    setSheet(null);
  }

  return (
    <div className={SCREEN}>
      <header className="bg-night/85 sticky top-0 z-10 grid grid-cols-[3rem_1fr_3rem] items-center px-4 py-3 backdrop-blur">
        <Link to="/orders" aria-label="Close menu" className={ROUND_BUTTON}>
          <CloseIcon width={22} height={22} />
        </Link>
        <h1 className="text-center text-xl font-extrabold">
          {setup ? 'Set up your menu' : 'Menu'}
        </h1>
      </header>

      <main className="flex-1 space-y-4 px-5 pt-1 pb-6">
        {saveError && (
          <p role="alert" className="rounded-2xl bg-red-500/10 p-4 font-semibold text-red-200">
            {saveError}
          </p>
        )}

        {loading ? (
          <p role="status" className="text-muted py-10 text-center font-semibold">
            Loading your menu…
          </p>
        ) : saved === null ? (
          <StartChoice onPick={start} />
        ) : (
          <MenuEditor menu={saved} setup={setup} onOpen={setSheet} />
        )}
      </main>

      {setup && saved !== null && (
        <footer className={BOTTOM_BAR}>
          <button
            type="button"
            disabled={!hasItems(saved)}
            onClick={() => navigate('/orders')}
            className={BUTTON_PRIMARY}
          >
            Done, go to orders
          </button>
          {!hasItems(saved) && (
            <p className="text-muted mt-2 text-center text-sm">Add at least one item to finish.</p>
          )}
        </footer>
      )}
      {setup && !loading && saved === null && (
        <div className="px-5 pb-6 text-center">
          <Link to="/orders" className="text-muted hover:text-ink font-bold">
            Skip for now
          </Link>
        </div>
      )}

      {sheet?.kind === 'item' && saved && (
        <ItemSheet
          menu={saved}
          item={sheet.item}
          categoryId={sheet.categoryId}
          onSave={(item) => save(saveItem(saved, item))}
          onDelete={(id) => save(removeItem(saved, id))}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'category' && saved && (
        <CategorySheet
          menu={saved}
          category={sheet.category}
          onSave={(category) => save(saveCategory(saved, category))}
          onDelete={(id) => save(removeCategory(saved, id))}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

/** First visit: start from the ready-made kasi menu, or from nothing. */
function StartChoice({ onPick }: { onPick: (menu: Menu) => void }) {
  const choice = `${CARD} w-full p-5 text-left hover:border-brand-600`;
  return (
    <>
      <p className="text-muted">
        Add what you sell, with your own names, prices and categories. You can change it any time.
      </p>
      <button type="button" onClick={() => onPick(KASI_MENU)} className={choice}>
        <span className="block text-lg font-bold">Start with the kasi menu</span>
        <span className="text-muted mt-1 block">
          {KASI_MENU.items.length} items in {KASI_MENU.categories.length} categories: kotas, bunny
          chow, vetkoek, plates, drinks and extras. Change the prices and names to yours.
        </span>
      </button>
      <button type="button" onClick={() => onPick(EMPTY_MENU)} className={choice}>
        <span className="block text-lg font-bold">Start from scratch</span>
        <span className="text-muted mt-1 block">
          An empty menu. Add your own categories and items.
        </span>
      </button>
    </>
  );
}

function MenuEditor({
  menu,
  setup,
  onOpen,
}: {
  menu: Menu;
  setup: boolean;
  onOpen: (sheet: OpenSheet) => void;
}) {
  return (
    <>
      <p className="text-muted text-sm">
        {setup
          ? 'Tap an item to change its name or price. Changes save straight away.'
          : 'Changes save straight away. Orders already taken keep their prices.'}
      </p>

      {menu.categories.length === 0 && (
        <p className="text-muted py-6 text-center">
          Start by adding a category, like Kotas or Drinks.
        </p>
      )}

      {menu.categories.map((category) => {
        const items = menu.items.filter((i) => i.categoryId === category.id);
        return (
          <section key={category.id} className={CARD} aria-label={category.name}>
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{category.name}</h2>
                <p className="text-muted text-sm">
                  {items.length} {items.length === 1 ? 'item' : 'items'} · cooks {category.capacity}{' '}
                  at once
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpen({ kind: 'category', category })}
                aria-label={`Edit category ${category.name}`}
                className="text-brand-300 -my-2 h-10 shrink-0 px-2 font-bold hover:underline"
              >
                Edit
              </button>
            </div>

            <ul className="divide-line divide-y px-5">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpen({ kind: 'item', categoryId: category.id, item })}
                    aria-label={`Edit ${item.name}`}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block font-bold">{item.name}</span>
                      <span className="text-muted block text-sm">
                        {item.prepMinutes > 0 ? `${item.prepMinutes} min` : 'Ready straight away'}
                        {item.soldOut && (
                          <span className="font-semibold text-red-300"> · Sold out today</span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold">
                      {item.priceCents === 0 ? 'Free' : formatCents(item.priceCents)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onOpen({ kind: 'item', categoryId: category.id })}
              className="text-brand-300 border-line flex h-12 w-full items-center justify-center gap-2 border-t font-bold"
            >
              <PlusIcon width={18} height={18} strokeWidth={2.25} />
              Add item to {category.name}
            </button>
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => onOpen({ kind: 'category' })}
        className="border-line-strong hover:bg-canvas flex h-14 w-full items-center justify-center gap-2 rounded-3xl border border-dashed font-bold"
      >
        <PlusIcon width={20} height={20} strokeWidth={2.25} />
        Add category
      </button>
    </>
  );
}
