-- Tracker iBooking: first database schema.
--
-- Run once in the Supabase dashboard (SQL Editor → New query → paste → Run).
-- Every table belongs to a business, and row level security means a signed-in
-- user only ever sees the businesses they are a member of.
--
-- Money is in integer cents and times are timestamptz, matching src/domain.

-- ───────────────────────────── Businesses and who can use them ─────────────────────────────

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  -- The "What do you sell?" answer from registering, e.g. 'kota-vetkoek'.
  business_type text,
  phone text,
  created_at timestamptz not null default now()
);

-- One row per person who can use a business. The owner registers it; staff can be added later.
create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index business_members_user_idx on public.business_members (user_id);

-- True when the signed-in user belongs to the business. Security definer so the
-- policies below can use it without tripping over business_members' own policy.
create function public.is_member (target_business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members m
    where m.business_id = target_business
      and m.user_id = (select auth.uid())
  );
$$;

-- Registering: creates the business and makes the signed-in user its owner, in one step.
create function public.create_business (
  business_name text,
  business_type text default null,
  business_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before creating a business';
  end if;

  insert into public.businesses (name, business_type, phone)
  values (trim(business_name), business_type, business_phone)
  returning id into new_id;

  insert into public.business_members (business_id, user_id, role)
  values (new_id, (select auth.uid()), 'owner');

  return new_id;
end;
$$;

revoke execute on function public.create_business (text, text, text) from public, anon;
grant execute on function public.create_business (text, text, text) to authenticated;
revoke execute on function public.is_member (uuid) from public, anon;
grant execute on function public.is_member (uuid) to authenticated;

-- ───────────────────────────── Menu ─────────────────────────────

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 30),
  -- How many orders in this category the kitchen can cook at once.
  capacity int not null default 1 check (capacity between 1 and 20),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  -- Lets items check their category belongs to the same business.
  unique (id, business_id)
);

create unique index menu_categories_name_idx
  on public.menu_categories (business_id, lower(trim(name)));

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 40),
  price_cents int not null check (price_cents > 0 and price_cents <= 1000000),
  -- 0 for anything handed over straight away, like a cold drink.
  prep_minutes int not null check (prep_minutes between 0 and 180),
  sold_out boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  -- A category can't be deleted while it still has items (matches the app's rule).
  foreign key (category_id, business_id)
    references public.menu_categories (id, business_id) on delete restrict
);

create unique index menu_items_name_idx
  on public.menu_items (category_id, lower(trim(name)));

-- ───────────────────────────── Orders ─────────────────────────────

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Queue numbers start again each day, South African time.
  business_day date not null default (now() at time zone 'Africa/Johannesburg')::date,
  queue_number int not null check (queue_number > 0),
  channel text not null check (channel in ('call', 'whatsapp', 'walk-in')),
  payment_method text not null check (payment_method in ('cash', 'card')),
  customer_name text check (char_length(customer_name) <= 80),
  -- E.164, e.g. +27823456712.
  phone text check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  special_request text check (char_length(special_request) <= 120),
  total_cents int not null check (total_cents >= 0),
  prep_minutes int not null check (prep_minutes >= 0),
  -- Ready time the customer was told, including the queue ahead of them.
  ready_minutes int not null check (ready_minutes >= 0),
  ready_by timestamptz,
  status text not null check (
    status in ('awaiting', 'confirmed', 'preparing', 'ready', 'done', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  started_at timestamptz,
  ready_at timestamptz,
  edited_while_cooking boolean not null default false,
  unique (business_id, business_day, queue_number),
  -- Lets lines and pauses check their order belongs to the same business.
  unique (id, business_id)
);

create index orders_business_day_idx on public.orders (business_id, business_day);

-- What was ordered. Name, category and price are copied at order time, so editing
-- or deleting a menu item never changes past orders.
create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  business_id uuid not null,
  item_id uuid references public.menu_items (id) on delete set null,
  name text not null,
  category text not null,
  prep_minutes int not null check (prep_minutes >= 0),
  quantity int not null check (quantity > 0),
  price_cents int not null check (price_cents >= 0),
  foreign key (order_id, business_id)
    references public.orders (id, business_id) on delete cascade
);

create index order_lines_order_idx on public.order_lines (order_id);

-- Every time cooking was paused. The open one has no resumed_at.
create table public.order_pauses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  business_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 1 and 120),
  paused_at timestamptz not null default now(),
  resumed_at timestamptz check (resumed_at >= paused_at),
  foreign key (order_id, business_id)
    references public.orders (id, business_id) on delete cascade
);

create index order_pauses_order_idx on public.order_pauses (order_id);

-- ───────────────────────────── Row level security ─────────────────────────────
-- Nothing is readable without signing in, and only your own business's rows are.

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.order_pauses enable row level security;

-- Businesses are created through create_business(), so there is no insert policy.
create policy "Members can read their business"
  on public.businesses for select to authenticated
  using (public.is_member(id));

create policy "Members can update their business"
  on public.businesses for update to authenticated
  using (public.is_member(id))
  with check (public.is_member(id));

create policy "Users can see their own memberships"
  on public.business_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Members manage their menu categories"
  on public.menu_categories for all to authenticated
  using (public.is_member(business_id))
  with check (public.is_member(business_id));

create policy "Members manage their menu items"
  on public.menu_items for all to authenticated
  using (public.is_member(business_id))
  with check (public.is_member(business_id));

create policy "Members manage their orders"
  on public.orders for all to authenticated
  using (public.is_member(business_id))
  with check (public.is_member(business_id));

create policy "Members manage their order lines"
  on public.order_lines for all to authenticated
  using (public.is_member(business_id))
  with check (public.is_member(business_id));

create policy "Members manage their order pauses"
  on public.order_pauses for all to authenticated
  using (public.is_member(business_id))
  with check (public.is_member(business_id));

-- ───────────────────────────── Live updates ─────────────────────────────
-- So a new order shows on the kitchen phone straight away. Row level security
-- still applies: each phone only hears about its own business.

alter publication supabase_realtime
  add table public.orders, public.order_lines, public.order_pauses,
    public.menu_categories, public.menu_items;
