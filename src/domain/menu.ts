// The business's own menu, as they set it up: categories, and the items in each.
// Pure logic, like the rest of src/domain.

import type { Cents } from './money';
import type { CategoryCapacity, MenuItem } from './orders';

export interface MenuCategory {
  id: string;
  name: string;
  /** How many orders in this category the kitchen can cook at the same time. */
  capacity: number;
}

export interface MenuEntry {
  id: string;
  /** Linked by id, so renaming a category keeps its items. */
  categoryId: string;
  name: string;
  priceCents: Cents;
  /** 0 for anything handed over straight away, like a cold drink. */
  prepMinutes: number;
  soldOut: boolean;
}

/** Categories and items are kept in the order they are shown. */
export interface Menu {
  categories: MenuCategory[];
  items: MenuEntry[];
}

export const LIMITS = {
  itemName: 60,
  categoryName: 30,
  maxPriceCents: 1_000_000, // R10 000
  maxPrepMinutes: 180,
  maxCapacity: 20,
};

/** Time to make for a new item: the category's usual time, or 10 minutes for a new category. */
export function defaultPrepMinutes(menu: Menu, categoryId: string): number {
  const times = menu.items.filter((i) => i.categoryId === categoryId).map((i) => i.prepMinutes);
  if (times.length === 0) return 10;
  const sorted = [...times].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

/** The menu as the order screens use it: items in category order, each with its category name. */
export function menuItems(menu: Menu): MenuItem[] {
  return menu.categories.flatMap((category) =>
    menu.items
      .filter((item) => item.categoryId === category.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: category.name,
        priceCents: item.priceCents,
        prepMinutes: item.prepMinutes,
        soldOut: item.soldOut,
      })),
  );
}

/** How many orders each category can cook at once, by category name. */
export function menuCapacity(menu: Menu): CategoryCapacity {
  return Object.fromEntries(menu.categories.map((c) => [c.name, c.capacity]));
}

/** "35", "35.5", "R35,50" → 3550 cents; "0" for free. Null when it isn't a usable price. */
export function parseRands(text: string): Cents | null {
  const cleaned = text.trim().replace(/^r\s*/i, '').replace(',', '.').replace(/\s/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  // 0 is allowed, for free extras like sauce.
  return cents >= 0 && cents <= LIMITS.maxPriceCents ? cents : null;
}

/** 3550 → "35.50", for putting a saved price back in the price field. */
export function centsToRandsInput(cents: Cents): string {
  return (cents / 100).toFixed(2);
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Why this item can't be saved, or null when it can. `item.id` is ignored when checking duplicates of itself. */
export function itemProblem(
  menu: Menu,
  item: { id?: string; categoryId: string; name: string; price: string; prepMinutes: string },
): string | null {
  const name = item.name.trim();
  if (!name) return 'Give the item a name.';
  if (name.length > LIMITS.itemName) return `Keep the name under ${LIMITS.itemName} characters.`;
  if (!menu.categories.some((c) => c.id === item.categoryId)) return 'Choose a category.';
  const duplicate = menu.items.some(
    (other) =>
      other.id !== item.id && other.categoryId === item.categoryId && same(other.name, name),
  );
  if (duplicate) return 'There is already an item with this name in this category.';
  if (parseRands(item.price) === null) return 'Enter a price, like 35 or 35.50 (0 if it’s free).';
  const minutes = Number(item.prepMinutes);
  if (!/^\d+$/.test(item.prepMinutes.trim()) || minutes > LIMITS.maxPrepMinutes) {
    return `Enter the minutes it takes to make, from 0 to ${LIMITS.maxPrepMinutes}.`;
  }
  return null;
}

/** Why this category can't be saved, or null when it can. */
export function categoryProblem(
  menu: Menu,
  category: { id?: string; name: string; capacity: number },
): string | null {
  const name = category.name.trim();
  if (!name) return 'Give the category a name.';
  if (name.length > LIMITS.categoryName) {
    return `Keep the name under ${LIMITS.categoryName} characters.`;
  }
  if (menu.categories.some((other) => other.id !== category.id && same(other.name, name))) {
    return 'There is already a category with this name.';
  }
  const { capacity } = category;
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > LIMITS.maxCapacity) {
    return `Choose between 1 and ${LIMITS.maxCapacity} at once.`;
  }
  return null;
}

/** Adds the item, or replaces the one with the same id. */
export function saveItem(menu: Menu, item: MenuEntry): Menu {
  const exists = menu.items.some((i) => i.id === item.id);
  return {
    ...menu,
    items: exists ? menu.items.map((i) => (i.id === item.id ? item : i)) : [...menu.items, item],
  };
}

export function removeItem(menu: Menu, itemId: string): Menu {
  return { ...menu, items: menu.items.filter((i) => i.id !== itemId) };
}

/** Adds the category, or replaces the one with the same id. */
export function saveCategory(menu: Menu, category: MenuCategory): Menu {
  const exists = menu.categories.some((c) => c.id === category.id);
  return {
    ...menu,
    categories: exists
      ? menu.categories.map((c) => (c.id === category.id ? category : c))
      : [...menu.categories, category],
  };
}

/** Only empty categories can go, so no item is ever lost by accident. */
export function removeCategory(menu: Menu, categoryId: string): Menu {
  if (menu.items.some((i) => i.categoryId === categoryId)) return menu;
  return { ...menu, categories: menu.categories.filter((c) => c.id !== categoryId) };
}

/** True when there's at least one item to sell. */
export function hasItems(menu: Menu): boolean {
  return menu.items.length > 0;
}

/**
 * The same menu with every category and item given a new id from `newId`, keeping
 * items linked to their categories. Used to copy the kasi template into a business.
 */
export function withNewIds(menu: Menu, newId: () => string): Menu {
  const categoryIds = new Map(menu.categories.map((c) => [c.id, newId()]));
  return {
    categories: menu.categories.map((c) => ({ ...c, id: categoryIds.get(c.id)! })),
    items: menu.items.map((i) => ({
      ...i,
      id: newId(),
      categoryId: categoryIds.get(i.categoryId) ?? i.categoryId,
    })),
  };
}
