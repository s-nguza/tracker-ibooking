import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { withNewIds, type Menu } from '../../domain/menu';
import { listenForChanges } from '../../lib/live';
import { useAuth } from '../auth/authContext';
import { fetchMenu, saveMenuChanges } from './menuApi';
import { MenuContext, type MenuStore } from './menuContext';
import { loadMenu, storeMenu } from './menuStorage';
import { KASI_MENU } from './templates';
import { newId } from '../../domain/ids';

const OFFLINE =
  'Couldn’t save the menu. Check your internet connection; your last change may be lost.';

/**
 * The business's menu. Signed in, it lives in Supabase and updates live on every
 * phone; in the offline demo it's kept in this browser.
 */
export function MenuProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const businessId = state.status === 'ready' ? state.business.id : null;

  const [demoMenu, setDemoMenu] = useState<Menu | null>(loadMenu);
  /** The signed-in business's menu, tagged with whose it is; undefined until it has loaded. */
  const [remote, setRemote] = useState<{ businessId: string; menu: Menu | null }>();
  const [saveError, setSaveError] = useState<string | null>(null);
  // Saves run one after another, each from the menu the last one left.
  const saving = useRef<Promise<unknown>>(Promise.resolve());

  const reload = useCallback(async (id: string) => {
    const result = await fetchMenu(id);
    if ('error' in result) {
      setSaveError(`Couldn’t load the menu (${result.error}).`);
      return;
    }
    setRemote({ businessId: id, menu: result.menu });
  }, []);

  useEffect(() => {
    if (!businessId) return;
    // Started just after the effect, so the first load is like any later one.
    queueMicrotask(() => void reload(businessId));
    return listenForChanges('menu', businessId, ['menu_categories', 'menu_items'], () => {
      void reload(businessId);
    });
  }, [businessId, reload]);

  const loaded = businessId !== null && remote?.businessId === businessId;
  const saved = businessId ? (loaded ? remote.menu : null) : demoMenu;

  function setMenu(next: Menu) {
    if (!businessId) {
      setDemoMenu(next);
      setSaveError(
        storeMenu(next)
          ? null
          : 'This browser wouldn’t save the menu, so it will be lost on refresh. Private browsing can cause this.',
      );
      return;
    }
    const prev = saved;
    setRemote({ businessId, menu: next });
    saving.current = saving.current.then(async () => {
      const error = await saveMenuChanges(prev, next, businessId);
      setSaveError(error ? `${OFFLINE} (${error})` : null);
      if (error) await reload(businessId);
    });
  }

  const store: MenuStore = {
    saved,
    menu: saved ?? KASI_MENU,
    loading: businessId !== null && !loaded,
    saveError,
    setMenu,
    // The template's ids are readable names; the database needs proper unique ids.
    start: (template) => setMenu(businessId ? withNewIds(template, newId) : template),
  };

  return <MenuContext value={store}>{children}</MenuContext>;
}
