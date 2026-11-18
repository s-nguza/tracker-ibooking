import { createContext, useContext } from 'react';
import { menuCapacity, type Menu } from '../../domain/menu';
import type { CategoryCapacity } from '../../domain/orders';

export interface MenuStore {
  /** The menu the business saved, or null if they haven't set one up yet. */
  saved: Menu | null;
  /** What the app sells from: the saved menu, or the kasi menu until one is saved. */
  menu: Menu;
  /** Saves and starts using it. False if the browser wouldn't keep it. */
  setMenu: (menu: Menu) => boolean;
}

export const MenuContext = createContext<MenuStore | null>(null);

export function useMenuStore(): MenuStore {
  const store = useContext(MenuContext);
  if (!store) throw new Error('useMenuStore must be used inside <MenuProvider>');
  return store;
}

/** How many orders each category can cook at once, from the menu settings. */
export function useKitchenCapacity(): CategoryCapacity {
  return menuCapacity(useMenuStore().menu);
}
