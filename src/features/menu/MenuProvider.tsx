import { useState, type ReactNode } from 'react';
import type { Menu } from '../../domain/menu';
import { MenuContext, type MenuStore } from './menuContext';
import { loadMenu, storeMenu } from './menuStorage';
import { KASI_MENU } from './templates';

export function MenuProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Menu | null>(loadMenu);

  const store: MenuStore = {
    saved,
    menu: saved ?? KASI_MENU,
    setMenu(menu) {
      setSaved(menu);
      return storeMenu(menu);
    },
  };

  return <MenuContext value={store}>{children}</MenuContext>;
}
