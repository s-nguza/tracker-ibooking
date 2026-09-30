# Tracker iBooking

Booking and order management for small food businesses (spaza shops, kota vendors) that
currently track orders on paper. Barbers and hairdressers come in a later phase.

## Stack

- React + TypeScript + Vite, styled with Tailwind CSS, routed with React Router
- Firebase: Authentication, Hosting (database choice comes in Phase 1)
- State: React hooks + Context for auth and the
  current business

## Getting started

```bash
npm install
cp .env.example .env.local   # leave VITE_USE_EMULATORS=true for local dev
npm run emulators            # terminal 1: Auth emulator, UI at http://127.0.0.1:4000
npm run dev                  # terminal 2: app at http://localhost:5173
```

Local dev uses the offline project ID
`demo-tracker-ibooking`, so you don't need a real Firebase project until you deploy.
Emulator data is saved to `emulator-data/` when you stop the emulators (gitignored).

To point at a real project, fill in the `VITE_FIREBASE_*` values in `.env.local`, set
`VITE_USE_EMULATORS=false`, and put your project ID in `.firebaserc`.

## Scripts

| Script              | Does                               |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Vite dev server                    |
| `npm run build`     | Typecheck and production build     |
| `npm run lint`      | ESLint                             |
| `npm run format`    | Prettier (writes changes)          |
| `npm run typecheck` | `tsc` only                         |
| `npm run emulators` | Firebase emulators with saved data |

## Folder structure

```
src/
  app/          App shell, routes, top-level pages
  components/   Shared UI components
  domain/       Pure business logic (money, statuses, message templates).
                No React, Firebase or DOM imports, so a native app can reuse it.
  features/     One folder per feature (auth, menu, orders, board), holding its
                screens, hooks and data access
  lib/          Third-party setup (firebase.ts)
```
