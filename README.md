# Tracker iBooking

Booking and order management for small food businesses (spaza shops, kota vendors) that
currently track orders on paper. Barbers and hairdressers come in a later phase.

Staff use it on a phone to take orders that come in by call, WhatsApp or walk-in, tell each
customer a realistic ready time, and see what to cook next.

> **Current stage:** frontend only. There is no backend yet, so orders are held in memory and
> **reset when the page is refreshed**. The app opens with sample orders so there is something
> to look at. The business name is a placeholder. The menu is saved in the browser only (see
> below).

## What it can do

### Set up the menu

After registering, the business sets up its menu. It's also reachable any time from the
**Menu** button on the orders board.

- **Start from the kasi menu** (46 items in 6 categories) and edit it, or **start from
  scratch**.
- **Categories:** a name, plus how many orders the kitchen can cook in that category at once.
  Ready times use this number.
- **Items:** name, price in rands (e.g. `35`, `35.50` or `R35,50`), time to make (0 for drinks
  and anything handed over straight away), and **Sold out today**.
- Every change saves straight away. Orders already taken keep the names and prices they were
  sold at.
- A category can only be deleted once it's empty, so items are never lost by accident.
- The menu is saved in **this browser only** until there's a backend. It survives a refresh,
  but not clearing site data, and isn't shared between phones.

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

- **Backend:** orders, the menu and accounts need to be saved somewhere (decided in Phase 1).
  Today, orders reset on refresh and the menu lives in one browser.
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
