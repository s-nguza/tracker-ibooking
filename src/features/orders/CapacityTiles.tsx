import { SECTION_LABEL } from '../../components/styles';
import type { CategoryStatus } from '../../domain/orders';

/** "Vetkoek & snacks" → "Vetkoek", so five tiles fit across a phone. */
function shortName(category: string): string {
  return category.split(/\s+/)[0] ?? category;
}

/** One tile per category: how many orders are cooking out of how many it can take. */
export function CapacityTiles({ stations }: { stations: readonly CategoryStatus[] }) {
  return (
    <section>
      <h2 className={`${SECTION_LABEL} text-xs`}>Kitchen capacity</h2>
      <ul className="mt-2 grid grid-cols-3 gap-1.5 min-[380px]:grid-cols-5">
        {stations.map(({ category, cooking, capacity, full }) => (
          <li
            key={category}
            title={category}
            aria-label={`${category}: ${cooking.length} of ${capacity} cooking${full ? ', full' : ''}`}
            className="border-line bg-surface rounded-xl border px-2 py-1.5"
          >
            <p className="truncate text-xs font-bold">{shortName(category)}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="bg-track h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
                <span
                  className={`block h-full rounded-full ${full ? 'bg-warn-800' : 'bg-brand-600'}`}
                  style={{ width: `${Math.min(100, (cooking.length / capacity) * 100)}%` }}
                />
              </span>
              <span className="text-muted shrink-0 text-[11px] font-bold tabular-nums">
                {cooking.length}/{capacity}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
