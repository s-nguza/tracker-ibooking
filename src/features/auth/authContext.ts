import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface Business {
  id: string;
  name: string;
}

/**
 * - demo: no Supabase keys, so the app runs offline with sample data and no login.
 * - loading: checking for a saved login, or loading the signed-in user's business.
 * - signedOut / ready: as they say. Ready means signed in with a business.
 * - noBusiness: signed in, but no business could be found or created.
 */
export type AuthState =
  | { status: 'demo' }
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'noBusiness'; user: User; message: string }
  | { status: 'ready'; user: User; business: Business };

export interface RegisterDetails {
  businessName: string;
  businessType: string;
  ownerName: string;
  /** E.164. */
  phone: string;
  email: string;
  password: string;
}

export type AuthResult =
  { ok: true; needsEmailConfirmation?: boolean } | { ok: false; message: string };

export interface AuthStore {
  state: AuthState;
  register: (details: RegisterDetails) => Promise<AuthResult>;
  logIn: (email: string, password: string) => Promise<AuthResult>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthStore | null>(null);

export function useAuth(): AuthStore {
  const store = useContext(AuthContext);
  if (!store) throw new Error('useAuth must be used inside <AuthProvider>');
  return store;
}
