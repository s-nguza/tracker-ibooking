import { SECTION_LABEL } from '../../components/styles';

const MAX_LENGTH = 120;

/** Optional free text on the new-order and edit screens. */
export function SpecialRequestField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={SECTION_LABEL}>Special request (optional)</span>
      <input
        type="text"
        value={value}
        maxLength={MAX_LENGTH}
        placeholder="e.g. only spice"
        onChange={(e) => onChange(e.target.value)}
        className="border-line-strong focus:border-brand-600 bg-surface mt-2 h-12 w-full rounded-2xl border px-3 font-semibold outline-none"
      />
    </label>
  );
}

/** Stands out on the order so the kitchen doesn't miss it. */
export function SpecialRequestNote({ text }: { text: string }) {
  return (
    <p className="bg-warn-100 text-warn-800 rounded-2xl px-3 py-2 text-sm font-semibold break-words">
      <span className="font-extrabold">Special request:</span> {text}
    </p>
  );
}
