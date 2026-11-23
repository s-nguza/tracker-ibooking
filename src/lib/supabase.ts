import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// The one Supabase connection for the whole app.
//
// The keys come from .env.local (see .env.example). Without them the client is
// null and the app keeps running as the offline demo, with sample orders and the
// menu saved in this browser, so it still works before the project is set up.

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;
