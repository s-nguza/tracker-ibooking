import { useState } from 'react';
import type { OrderChannel } from '../../domain/orders';
import { normalizeZaPhone } from '../../domain/phone';
import type { CustomerContact } from './customerContact';

interface CustomerCardProps {
  channel: OrderChannel;
  queueNumber: number;
  contact: CustomerContact;
  onChange: (contact: CustomerContact) => void;
}

export function CustomerCard(props: CustomerCardProps) {
  switch (props.channel) {
    case 'call':
      return <CallCard {...props} />;
    case 'whatsapp':
      return <WhatsAppCard {...props} />;
    case 'walk-in':
      return <WalkInCard {...props} />;
  }
}

function CallCard({ queueNumber, contact, onChange }: CustomerCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <CardHeader title="Caller details" badge={`Order #${queueNumber}`} />
      <p className="mt-1 text-stone-600">
        Get a name to call out at pickup. Read the order and ready time back before you hang up.
      </p>
      <div className="mt-4 space-y-3">
        <TextField
          label="Name"
          value={contact.name}
          onChange={(name) => onChange({ ...contact, name })}
          placeholder="e.g. Thabo"
          autoComplete="name"
        />
        <PhoneField
          label="Number (optional, for call-backs)"
          value={contact.phone}
          onChange={(phone) => onChange({ ...contact, phone })}
        />
      </div>
    </section>
  );
}

function WhatsAppCard({ queueNumber, contact, onChange }: CustomerCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <CardHeader title="WhatsApp customer" badge={`Order #${queueNumber}`} />
      <p className="mt-1 text-stone-600">
        After confirming you can send them the order, total and ready time on WhatsApp.
      </p>
      <div className="mt-4 space-y-3">
        <PhoneField
          label="WhatsApp number"
          value={contact.phone}
          onChange={(phone) => onChange({ ...contact, phone })}
        />
        <TextField
          label="Name (optional)"
          value={contact.name}
          onChange={(name) => onChange({ ...contact, name })}
          placeholder="e.g. Lerato"
          autoComplete="name"
        />
      </div>
    </section>
  );
}

function WalkInCard({ queueNumber, contact, onChange }: CustomerCardProps) {
  const hasContact = Boolean(contact.name.trim() || contact.phone.trim());
  const [expanded, setExpanded] = useState(hasContact);

  return (
    <section className="border-brand-300 rounded-2xl border border-dashed bg-white p-4">
      <CardHeader
        title={`Serving as queue #${queueNumber}`}
        badge={hasContact ? 'Contact added' : 'No contact yet'}
        badgeTone={hasContact ? 'brand' : 'muted'}
      />
      <p className="mt-1 text-stone-600">
        Call out the number when it's ready. Add a name or number if you'd like to text them
        instead.
      </p>
      {expanded ? (
        <div className="mt-4 space-y-3">
          <TextField
            label="Name (optional)"
            value={contact.name}
            onChange={(name) => onChange({ ...contact, name })}
            placeholder="e.g. Sipho"
            autoComplete="name"
            autoFocus
          />
          <PhoneField
            label="Number (optional)"
            value={contact.phone}
            onChange={(phone) => onChange({ ...contact, phone })}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="border-brand-600 text-brand-700 hover:bg-brand-50 mt-4 h-12 w-full rounded-xl border border-dashed font-semibold"
        >
          + Add name or number (optional)
        </button>
      )}
    </section>
  );
}

function CardHeader({
  title,
  badge,
  badgeTone = 'muted',
}: {
  title: string;
  badge: string;
  badgeTone?: 'muted' | 'brand';
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
          badgeTone === 'brand' ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-400'
        }`}
      >
        {badge}
      </span>
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
    <label className="block">
      <span className="text-sm font-medium text-stone-600">{label}</span>
      <input
        type={type}
        inputMode={type === 'tel' ? 'tel' : undefined}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`mt-1 h-12 w-full rounded-xl border bg-white px-3 text-base outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'focus:border-brand-600 focus:ring-brand-100 border-stone-200'
        }`}
        {...inputProps}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
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
      placeholder="e.g. 082 123 4567"
      autoComplete="tel"
      error={error}
    />
  );
}
