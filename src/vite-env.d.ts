/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** From Supabase: Project Settings → API → Project URL. Set in .env.local. */
  readonly VITE_SUPABASE_URL?: string;
  /** From Supabase: Project Settings → API → the anon / publishable key. Safe in the browser. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
