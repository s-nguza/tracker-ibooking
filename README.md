# Tracker iBooking

Booking and order management for small food businesses (spaza shops, kota vendors) that
currently track orders on paper. Barbers and hairdressers come in a later phase.

Staff use it on a phone to take orders that come in by call, WhatsApp or walk-in, tell each
customer a realistic ready time, and see what to cook next.

> **Current stage:** pilot. With Supabase set up (see [Backend setup](#backend-setup-supabase)),
> owners register a business, log in, and their menu and orders are saved and shared live
> between phones. Without Supabase keys the app runs as an offline demo: sample orders held in
> memory (reset on refresh), a placeholder business name, and the menu saved in the browser.

## What it can do

### Set up the menu

After registering, the business sets up its menu. It's also reachable any time from the
**Menu** button on the orders board.

- **Start from the kasi menu** (46 items in 6 categories) and edit it, or **start from
  scratch**.
- **Categories:** a name, plus how many orders the kitchen can cook in that category at once.
  Ready times use this number.
- **Items:** name, price in rands (e.g. `35`, `35.50` or `R35,50`; `0` for free extras), time
  to make (0 for drinks and anything handed over straight away), and **Sold out today**.
- Every change saves straight away. Orders already taken keep the names and prices they were
  sold at.
- A category can only be deleted once it's empty, so items are never lost by accident.
- Signed in, the menu is saved in Supabase and changes show on the business's other phones
  within a few seconds. In the offline demo it's saved in this browser only.

### Take an order

- **Three ways in:** Call needs a name, WhatsApp needs a number, and a walk-in needs neither
  and gets a queue number to call out.
- **Menu:** every category from the business's menu is visible at once.
- **Payment type:** staff must choose Cash or Card before the order can be saved. The app only
  records the choice. It doesn't take payments.
- **Special requests:** an optional note such as "only spice".
- **Repeat customers:** typing a known number fills in the name and shows how they usually
  order.
- **Confirm now or quote first:** a quote waits on the board, tagged **Awaiting yes**, until
  the customer agrees.

### Tell the customer a ready time

Each menu category is tracked separately, so an order only waits for orders in the categories
it needs. A Kota isn't held up by pap.

For each category the order needs:

```
wait for a free place + the slowest item in that category
```

- Each order ahead counts for its remaining cooking time, minus 2 minutes, because the kitchen
  overlaps work.
- The order is ready when its last category finishes.
- Drinks don't queue. Quotes and finished orders don't count towards the wait.
- Once an item has 3 timed orders, the real median time replaces the menu's estimate.

The new order screen shows the working, for example
`Kotas: 10 min to make + 12 min for 2 orders ahead`.

### Run the kitchen

The orders board is the home screen, with four tabs:

| Tab           | Shows                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| **Confirmed** | Orders to start, in priority order, with quotes below them. Shows which categories are busy or free. |
| **Preparing** | Everything cooking at once, each with a live timer, plus Pause and Ready buttons.                    |
| **Ready**     | Orders waiting for collection, with the payment type (Cash or Card) next to the Collected button.    |
| **Done**      | Collected orders and how long each took to make.                                                     |

- **Priority:** orders that can start now come before orders waiting for a busy category. After
  that, orders that must start now come first, then the longest to make. Starting an order is
  never blocked, so staff can always override the order.
- **Tags:** each order shows its categories and whether it's Long (15 minutes or more) or Quick.
- **Late:** an order that passes the time the customer was told is tagged **Late**.
- **Pause:** pausing needs a reason, stops the timer and tags the order **Paused**. Its place
  in the category is freed for another order.

### Manage an order

Tap any order to open it.

- **Edit** quotes, confirmed orders and orders being cooked: change items or the special
  request. The total and ready time update, and the timer keeps running.
- **Message the customer:** quote, confirmation, updated order and ready messages open in
  WhatsApp, already written, for staff to send. They can also be copied. Nothing is sent
  automatically.
- **Call** the customer, or add a number to a walk-in who wants to be messaged.
- **Cancel** any order that hasn't been collected.

## Before going live

- **Supabase plan:** the free plan pauses a project after 7 days without use and has no backups.
  Move to Pro ($25/month) once a business depends on it.
- **Kitchen capacity:** the kasi menu starts every category at 1 order at a time. Each business
  should set its real numbers on the Menu screen.

## Stack

- React + TypeScript + Vite, styled with Tailwind CSS, routed with React Router
- State: React hooks + Context
- Backend and database: not chosen yet (decided in Phase 1)

## Getting started

```bash
npm install
npm run dev    # app at http://localhost:5173
```

Without Supabase keys the app runs as an offline demo (sample orders, menu saved in the
browser).

## Backend setup (Supabase)

The backend is [Supabase](https://supabase.com), on the free plan.

1. Create a free account and a new project. Pick the region closest to South Africa that's
   offered, and save the database password somewhere safe.
2. In the project, open **SQL Editor → New query**, paste the whole of
   `supabase/migrations/20261118000000_initial_schema.sql`, and click **Run**. This creates the
   tables, the security rules (each business only sees its own data) and live updates. Then do
   the same with each later file in `supabase/migrations`, in date order (e.g.
   `20261123000000_menu_item_limits.sql`, which allows free extras and longer item names). Run
   each file once only.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon / publishable**
   key.
4. Copy `.env.example` to `.env.local` and paste both values in. Never use the
   `service_role` / secret key in the app.
5. Run `npm run check:supabase`. It connects with your keys as a logged-out visitor and checks
   that the project answers, all 7 tables exist, and they show and allow nothing without a
   login. It only reads, never changes anything.
6. Restart `npm run dev`.

With keys set, Register creates a real account and business, Login and Log out work, and the
order screens need a login. Each business only sees its own data. The menu and
today's orders are saved in Supabase and update live on every phone signed in to the business.

Free-plan limits to know: a project pauses after 7 days without use (restore it from the
dashboard), and there are no automatic backups. Move to Pro ($25/month) once a real business
relies on it.

## Scripts

| Script                 | Does                           |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Vite dev server                |
| `npm run build`        | Typecheck and production build |
| `npm run preview`      | Serve the production build     |
| `npm run lint`         | ESLint                         |
| `npm run format`       | Prettier (writes changes)      |
| `npm run format:check` | Prettier (check only)          |
| `npm run typecheck`    | `tsc` only                     |

## Folder structure

```
src/
  app/          App shell, routes, top-level pages
  components/   Shared UI components
  domain/       Pure business logic (money, statuses, ready times, message templates).
                No React, backend or DOM imports, so a native app can reuse it.
  features/     One folder per feature, holding its screens and hooks.
                Everything so far is in features/orders.
  lib/          Third-party setup
```
