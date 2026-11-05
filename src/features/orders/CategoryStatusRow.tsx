import type { CategoryStatus } from '../../domain/orders';
import { BADGE_TONES } from './orderStatusUi';

/** At a glance: which categories are cooking at full stretch and which have room. */
export function CategoryStatusRow({ stations }: { stations: readonly CategoryStatus[] }) {
  return (
    <ul aria-label="Kitchen by category" className="mb-3 flex flex-wrap gap-1.5">
      {stations.map(({ category, cooking, capacity, full }) => (
        <li
          key={category}
          className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${
            BADGE_TONES[full ? 'warn' : 'ok']
          }`}
        >
          {category} ·{' '}
          {full ? 'busy' : cooking.length === 0 ? 'free' : `${cooking.length} of ${capacity}`}
        </li>
      ))}
    </ul>
  );
}
