import { formatCents } from '../domain/money';
import { usingEmulators } from '../lib/firebase';

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">Tracker iBooking</h1>
      <p className="text-stone-600">Scaffold is running. Screens arrive in later phases.</p>
      <dl className="rounded-xl bg-white p-4 text-sm shadow-sm">
        <div className="flex justify-between py-1">
          <dt className="text-stone-500">Firebase</dt>
          <dd>{usingEmulators ? 'Local emulators' : 'Live project'}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-stone-500">Money format check</dt>
          <dd>{formatCents(4550)}</dd>
        </div>
      </dl>
    </main>
  );
}
