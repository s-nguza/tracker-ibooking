import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { BackIcon, ReceiptCheckIcon } from '../../components/icons';
import { isValidEmail } from '../../domain/email';
import { normalizeZaPhone } from '../../domain/phone';
import { BrandBackground } from '../../components/BrandBackground';
import { useAuth } from './authContext';
import { AUTH_SUBMIT, FIELD_INPUT, FIELD_LABEL, FORM_ERROR, TEXT_LINK } from './authStyles';

const FORM_ID = 'register-form';
const MIN_PASSWORD_LENGTH = 8;

const BUSINESS_TYPES = ['Kota & vetkoek', 'Kasi food store', 'Takeaway', 'Restaurant'] as const;
const COMING_SOON_TYPES = ['Barber', 'Hair salon'] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number];

/** "Kota & vetkoek" → "kota-vetkoek", the form saved with the business. */
function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const CHIP = 'flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm';

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function RegisterScreen() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('Kota & vetkoek');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const { register } = useAuth();

  function findProblem(): string | null {
    if (!businessName.trim()) return 'Enter your business name.';
    if (!ownerName.trim()) return 'Enter your name.';
    if (!normalizeZaPhone(phone)) return 'Enter a valid South African cell number.';
    if (!isValidEmail(email)) return 'Enter a valid business email.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
    }
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const problem = findProblem();
    const e164 = normalizeZaPhone(phone);
    if (problem || !e164) {
      setMessage(problem ?? 'Enter a valid South African cell number.');
      return;
    }
    setMessage('');
    setBusy(true);
    const result = await register({
      businessName,
      businessType: toSlug(businessType),
      ownerName,
      phone: e164,
      email,
      password,
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    if (result.needsEmailConfirmation) {
      setConfirmEmailSent(true);
      return;
    }
    // Next step: set up the menu.
    navigate('/menu?setup=1');
  }

  if (confirmEmailSent) {
    return (
      <div className="relative isolate flex h-dvh items-center overflow-hidden bg-[#0b0f1a] text-white">
        <BrandBackground glow="register" />
        <main className="mx-auto w-full max-w-md px-6 text-center">
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
            Check your email
          </h1>
          <p className="mt-3 font-medium text-[#aab1c2]">
            We sent a link to <strong className="text-white">{email.trim()}</strong>. Open it to
            confirm your account, then log in to set up your menu.
          </p>
          <Link to="/" className={`${AUTH_SUBMIT} mt-8 flex items-center justify-center`}>
            Go to log in
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="relative isolate h-dvh overflow-hidden bg-[#0b0f1a] text-white">
      <BrandBackground glow="register" />

      <main className="mx-auto flex h-full w-full max-w-md flex-col px-6 pt-5 pb-6">
        <header className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to log in"
            className="-ml-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <BackIcon width={20} height={20} strokeWidth={2.25} />
          </Link>
          <div className="bg-brand-600 flex size-10 shrink-0 items-center justify-center rounded-xl shadow-[0_0_24px_rgb(61_90_254/0.5)]">
            <ReceiptCheckIcon width={20} height={24} />
          </div>
          <p className="text-[1.65rem] font-extrabold tracking-tight">
            Tracker <span className="text-[#93a4ff]">iBooking</span>
          </p>
        </header>

        <h1 className="mt-6 text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Register your business
        </h1>
        <p className="mt-1 max-w-80 text-sm leading-snug font-medium text-[#aab1c2]">
          Set up your store in two minutes. You can add your menu next.
        </p>

        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          noValidate
          className="mt-4 flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:rgb(255_255_255/0.2)_transparent] flex-col gap-5 overflow-y-auto pb-4"
        >
          <Field id="register-business" label="Business name">
            <input
              id="register-business"
              type="text"
              autoComplete="organization"
              placeholder="Mama Rosie’s Kitchen"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className={FIELD_INPUT}
            />
          </Field>

          <fieldset>
            <legend className={`${FIELD_LABEL} mb-2`}>What do you sell?</legend>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={businessType === type}
                  onClick={() => setBusinessType(type)}
                  className={`${CHIP} font-bold ${
                    businessType === type
                      ? 'border-brand-600 bg-brand-600/20 text-white'
                      : 'border-white/8 bg-[#121826] text-[#d5d9e3] hover:bg-[#1a2132]'
                  }`}
                >
                  {type}
                </button>
              ))}
              {COMING_SOON_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled
                  className={`${CHIP} cursor-not-allowed border-dashed border-white/10 font-semibold text-[#6b7385]`}
                >
                  {type}
                  <span className="bg-brand-600/25 rounded-md px-2 py-0.5 text-[0.65rem] font-extrabold tracking-wider text-[#93a4ff] uppercase">
                    Soon
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <Field id="register-owner" label="Your name">
            <input
              id="register-owner"
              type="text"
              autoComplete="name"
              placeholder="Rosie Mokoena"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              className={FIELD_INPUT}
            />
          </Field>

          <Field id="register-phone" label="Business cell number">
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="082 345 6712"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={FIELD_INPUT}
            />
          </Field>

          <Field id="register-email" label="Business email">
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@yourstore.co.za"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={FIELD_INPUT}
            />
          </Field>

          <Field id="register-password" label="Password">
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={FIELD_INPUT}
            />
          </Field>
        </form>

        <div className="pt-4">
          {message && (
            <p role="alert" className={`${FORM_ERROR} mb-3`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            form={FORM_ID}
            disabled={busy}
            className={`${AUTH_SUBMIT} disabled:cursor-wait disabled:opacity-70`}
          >
            {busy ? 'Creating your account…' : 'Create account'}
          </button>
          <p className="mt-4 text-center text-sm font-medium text-[#8b93a7]">
            Already registered?{' '}
            <Link to="/" className={TEXT_LINK}>
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
