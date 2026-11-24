-- Tracker iBooking: allow free extras and longer item names.
--
-- Run once in the Supabase dashboard (SQL Editor → New query → paste → Run),
-- after 20261118000000_initial_schema.sql.
--
-- The kasi menu has "Extra chilli sauce" at R0 and "Braai plate (wors, steak, pap,
-- chakalaka)", which is 41 characters; the first schema refused both.

alter table public.menu_items
  drop constraint menu_items_price_cents_check,
  add constraint menu_items_price_cents_check
    check (price_cents >= 0 and price_cents <= 1000000);

alter table public.menu_items
  drop constraint menu_items_name_check,
  add constraint menu_items_name_check
    check (char_length(trim(name)) between 1 and 60);
