# Tracker iBooking

Booking and order management for small food businesses (spaza shops, kota vendors) that
currently track orders on paper. Barbers and hairdressers come in a later phase.

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
| `npm run lint`         | ESLint                         |
| `npm run format`       | Prettier (writes changes)      |
| `npm run format:check` | Prettier (check only)          |
| `npm run typecheck`    | `tsc` only                     |

## Folder structure

```
src/
  app/          App shell, routes, top-level pages
  components/   Shared UI components
  domain/       Pure business logic (money, statuses, message templates).
                No React, backend or DOM imports, so a native app can reuse it.
  features/     One folder per feature (menu, orders, board), holding its
                screens and hooks
  lib/          Third-party setup
```
