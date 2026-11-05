import { useState } from 'react';
import { CARD, SECTION_LABEL } from '../../components/styles';
import { CONTACT_RULES, type OrderChannel } from '../../domain/orders';
import { normalizeZaPhone } from '../../domain/phone';
import type { CustomerContact } from './customerContact';

interface CustomerCardProps {
  channel: OrderChannel;
  queueNumber: number;
  contact: CustomerContact;
  onChange: (contact: CustomerContact) => void;
}

export function CustomerCard(props: CustomerCardProps) {
  return (
    <section>
      <h2 className={SECTION_LABEL}>Customer</h2>
      <div className="mt-2">
        {props.channel === 'walk-in' ? <WalkInCard {...props} /> : <ContactCard {...props} />}
      </div>
    </section>
  );
}

/** Calls and WhatsApp: who's on the other end. What's required depends on the channel. */
function ContactCard({ channel, contact, onChange }: CustomerCardProps) {
  const rules = CONTACT_RULES[channel];
  const phoneLabel = channel === 'whatsapp' ? 'WhatsApp number' : 'Phone number';

  return (
    <div className={`${CARD} divide-line divide-y px-5`}>
      <PhoneField
        label={rules.phone === 'optional' ? `${phoneLabel} (optional)` : phoneLabel}
        value={contact.phone}
        onChange={(phone) => onChange({ ...contact, phone })}
      />
      <TextField
        label={rules.name === 'optional' ? 'Name (optional)' : 'Name'}
        value={contact.name}
        onChange={(name) => onChange({ ...contact, name })}
        placeholder="Thabo M."
        autoComplete="name"
      />
    </div>
  );
}

/** Walk-ins are standing right there, so the queue number is enough. */
function WalkInCard({ queueNumber, contact, onChange }: CustomerCardProps) {
  const hasContact = Boolean(contact.name.trim() || contact.phone.trim());
  const [expanded, setExpanded] = useState(hasContact);

  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold">Serving as queue #{queueNumber}</h3>
        <span className="bg-track text-ink-soft shrink-0 rounded-full px-3 py-1 text-sm font-semibold">
          {hasContact ? 'Contact added' : 'No contact yet'}
        </span>
      </div>
      <p className="text-muted mt-1">
        Call out the number when it’s ready. Add a name or number if you’d like to text them
        instead.
      </p>
      {expanded ? (
        <div className="divide-line mt-2 divide-y">
          <TextField
            label="Name (optional)"
            value={contact.name}
            onChange={(name) => onChange({ ...contact, name })}
            placeholder="Thabo M."
            autoComplete="name"
            autoFocus
          />
          <PhoneField
            label="Phone number (optional)"
            value={contact.phone}
            onChange={(phone) => onChange({ ...contact, phone })}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="border-line-strong hover:bg-canvas mt-4 h-12 w-full rounded-2xl border border-dashed font-bold"
        >
          + Add name or number (optional)
        </button>
      )}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  type?: 'text' | 'tel';
  error?: string | null;
}

function TextField({ label, onChange, error, type = 'text', ...inputProps }: TextFieldProps) {
  return (
    <label className="group block py-3">
      <span className="text-muted group-focus-within:text-brand-700 text-sm font-medium">
        {label}
      </span>
      <input
        type={type}
        inputMode={type === 'tel' ? 'tel' : undefined}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className="placeholder:text-muted/50 w-full bg-transparent text-lg font-bold outline-none placeholder:font-medium"
        {...inputProps}
      />
      {error && <span className="block text-sm font-medium text-red-700">{error}</span>}
    </label>
  );
}

function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // Only flag the number once it looks finished, so we don't nag mid-typing.
  const digits = value.replace(/\D/g, '');
  const error = digits.length >= 10 && !normalizeZaPhone(value) ? 'Not a valid SA number' : null;

  return (
    <TextField
      label={label}
      type="tel"
      value={value}
      onChange={onChange}
      placeholder="082 345 6712"
      autoComplete="tel"
      error={error}
    />
  );
}
