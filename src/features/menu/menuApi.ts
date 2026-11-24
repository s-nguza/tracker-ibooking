import type { Menu } from '../../domain/menu';
import { supabase } from '../../lib/supabase';

// The menu in Supabase: menu_categories and menu_items (see supabase/migrations).

interface CategoryRow {
  id: string;
  business_id: string;
  name: string;
  capacity: number;
  sort_order: number;
}

interface ItemRow {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  price_cents: number;
  prep_minutes: number;
  sold_out: boolean;
  sort_order: number;
}

/** The business's menu, or null if they haven't set one up yet. */
export async function fetchMenu(
  businessId: string,
): Promise<{ menu: Menu | null } | { error: string }> {
  if (!supabase) return { menu: null };
  const [categories, items] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('id, business_id, name, capacity, sort_order')
      .eq('business_id', businessId)
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('menu_items')
      .select('id, business_id, category_id, name, price_cents, prep_minutes, sold_out, sort_order')
      .eq('business_id', businessId)
      .order('sort_order')
      .order('created_at'),
  ]);
  const error = categories.error ?? items.error;
  if (error) return { error: error.message };
  const categoryRows = (categories.data ?? []) as CategoryRow[];
  const itemRows = (items.data ?? []) as ItemRow[];
  if (categoryRows.length === 0 && itemRows.length === 0) return { menu: null };
  return {
    menu: {
      categories: categoryRows.map((c) => ({ id: c.id, name: c.name, capacity: c.capacity })),
      items: itemRows.map((i) => ({
        id: i.id,
        categoryId: i.category_id,
        name: i.name,
        priceCents: i.price_cents,
        prepMinutes: i.prep_minutes,
        soldOut: i.sold_out,
      })),
    },
  };
}

function categoryRows(menu: Menu, businessId: string): CategoryRow[] {
  return menu.categories.map((c, index) => ({
    id: c.id,
    business_id: businessId,
    name: c.name,
    capacity: c.capacity,
    sort_order: index,
  }));
}

function itemRows(menu: Menu, businessId: string): ItemRow[] {
  return menu.items.map((i, index) => ({
    id: i.id,
    business_id: businessId,
    category_id: i.categoryId,
    name: i.name,
    price_cents: i.priceCents,
    prep_minutes: i.prepMinutes,
    sold_out: i.soldOut,
    sort_order: index,
  }));
}

/** Rows in `next` that are new or different from `prev`. */
function changed<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const before = new Map(prev.map((row) => [row.id, JSON.stringify(row)]));
  return next.filter((row) => before.get(row.id) !== JSON.stringify(row));
}

/** Ids in `prev` that are gone from `next`. */
function removed(prev: { id: string }[], next: { id: string }[]): string[] {
  const kept = new Set(next.map((row) => row.id));
  return prev.filter((row) => !kept.has(row.id)).map((row) => row.id);
}

/**
 * Saves the difference between two versions of the menu. Categories go in before
 * the items that use them, and items come out before their categories, so the
 * database's rules (an item needs its category) hold at every step.
 * Returns an error message, or null when it all saved.
 */
export async function saveMenuChanges(
  prev: Menu | null,
  next: Menu,
  businessId: string,
): Promise<string | null> {
  if (!supabase) return null;
  const empty: Menu = { categories: [], items: [] };
  const before = prev ?? empty;
  const prevCategories = categoryRows(before, businessId);
  const nextCategories = categoryRows(next, businessId);
  const prevItems = itemRows(before, businessId);
  const nextItems = itemRows(next, businessId);

  const steps = [
    async () => {
      const rows = changed(prevCategories, nextCategories);
      return rows.length ? (await supabase!.from('menu_categories').upsert(rows)).error : null;
    },
    async () => {
      const rows = changed(prevItems, nextItems);
      return rows.length ? (await supabase!.from('menu_items').upsert(rows)).error : null;
    },
    async () => {
      const ids = removed(prevItems, nextItems);
      return ids.length ? (await supabase!.from('menu_items').delete().in('id', ids)).error : null;
    },
    async () => {
      const ids = removed(prevCategories, nextCategories);
      return ids.length
        ? (await supabase!.from('menu_categories').delete().in('id', ids)).error
        : null;
    },
  ];
  for (const step of steps) {
    const error = await step();
    if (error) return error.message;
  }
  return null;
}
