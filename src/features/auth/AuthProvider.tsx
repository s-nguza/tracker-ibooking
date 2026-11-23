import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  AuthContext,
  type AuthState,
  type AuthStore,
  type Business,
  type RegisterDetails,
} from './authContext';
import { friendlyAuthError, friendlyDataError } from './authErrors';

/** What Register saves on the account, so the business can be created once they're signed in. */
interface PendingBusiness {
  business_name?: string;
  business_type?: string;
  business_phone?: string;
}

/**
 * Who is signed in, and their business. With email confirmation on, the business
 * can't be created at sign-up (there's no session yet), so the details ride along
 * on the account and the business is created on the first sign-in instead.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(
    supabase ? { status: 'loading' } : { status: 'demo' },
  );
  // One lookup per user at a time, so two sign-in events can't create two businesses.
  const lookups = useRef(new Map<string, Promise<void>>());

  const loadBusiness = useCallback((user: User) => {
    const running = lookups.current.get(user.id);
    if (running) return running;

    const lookup = (async () => {
      if (!supabase) return;
      setState((prev) =>
        prev.status === 'ready' && prev.user.id === user.id ? prev : { status: 'loading' },
      );

      const found = await findBusiness();
      if ('error' in found) {
        setState({ status: 'noBusiness', user, message: found.error });
        return;
      }
      if (found.business) {
        setState({ status: 'ready', user, business: found.business });
        return;
      }

      const pending = user.user_metadata as PendingBusiness;
      if (!pending.business_name) {
        setState({
          status: 'noBusiness',
          user,
          message: 'This account isn’t linked to a business yet.',
        });
        return;
      }
      const { error } = await supabase.rpc('create_business', {
        business_name: pending.business_name,
        business_type: pending.business_type ?? null,
        business_phone: pending.business_phone ?? null,
      });
      if (error) {
        setState({ status: 'noBusiness', user, message: friendlyDataError(error) });
        return;
      }
      const created = await findBusiness();
      if ('error' in created || !created.business) {
        setState({
          status: 'noBusiness',
          user,
          message: 'error' in created ? created.error : 'Your business couldn’t be created.',
        });
        return;
      }
      setState({ status: 'ready', user, business: created.business });
    })().finally(() => lookups.current.delete(user.id));

    lookups.current.set(user.id, lookup);
    return lookup;
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase asks not to call it again from inside this callback, so wait a tick.
      setTimeout(() => {
        if (session?.user) void loadBusiness(session.user);
        else setState({ status: 'signedOut' });
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [loadBusiness]);

  const store: AuthStore = {
    state,

    async register(details: RegisterDetails) {
      if (!supabase) return { ok: true };
      const pending: PendingBusiness & { owner_name: string } = {
        business_name: details.businessName.trim(),
        business_type: details.businessType,
        business_phone: details.phone,
        owner_name: details.ownerName.trim(),
      };
      const { data, error } = await supabase.auth.signUp({
        email: details.email.trim(),
        password: details.password,
        options: { data: pending, emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) return { ok: false, message: friendlyAuthError(error) };
      // Supabase hides whether an email is taken when confirmation is on: no identities means it was.
      if (data.user && data.user.identities?.length === 0) {
        return { ok: false, message: 'This email is already registered. Log in instead.' };
      }
      if (!data.session) return { ok: true, needsEmailConfirmation: true };
      await loadBusiness(data.session.user);
      return { ok: true };
    },

    async logIn(email: string, password: string) {
      if (!supabase) return { ok: true };
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, message: friendlyAuthError(error) };
      await loadBusiness(data.user);
      return { ok: true };
    },

    async logOut() {
      if (!supabase) return;
      await supabase.auth.signOut();
      setState({ status: 'signedOut' });
    },
  };

  return <AuthContext value={store}>{children}</AuthContext>;
}

/** The business the signed-in user belongs to. Row level security only returns their own. */
async function findBusiness(): Promise<{ business: Business | null } | { error: string }> {
  if (!supabase) return { business: null };
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (error) return { error: friendlyDataError(error) };
  return { business: data };
}
