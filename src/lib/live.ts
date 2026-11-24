import { supabase } from './supabase';

/**
 * Calls `onChange` (at most once per `delayMs`) whenever any of `tables` changes for
 * this business, on any phone. Returns a function that stops listening.
 *
 * Inserts and updates are filtered to the business. Deletes can't be filtered by
 * Supabase (they only carry the row's id), so any delete on these tables triggers
 * a refresh too; row level security still decides what the refresh can read.
 */
export function listenForChanges(
  name: string,
  businessId: string,
  tables: string[],
  onChange: () => void,
  delayMs = 300,
): () => void {
  if (!supabase) return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, delayMs);
  };

  let channel = supabase.channel(`${name}-${businessId}`);
  for (const table of tables) {
    channel = channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table, filter: `business_id=eq.${businessId}` },
        schedule,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table, filter: `business_id=eq.${businessId}` },
        schedule,
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, schedule);
  }
  channel.subscribe();

  // A phone that slept or lost signal may have missed changes: catch up when it's back.
  const catchUp = () => {
    if (document.visibilityState === 'visible') schedule();
  };
  document.addEventListener('visibilitychange', catchUp);
  window.addEventListener('online', schedule);

  return () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', catchUp);
    window.removeEventListener('online', schedule);
    void supabase?.removeChannel(channel);
  };
}
