import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ReceiptCheckIcon } from '../../components/icons';
import { isValidEmail } from '../../domain/email';
import { BrandBackground } from '../../components/BrandBackground';
import { useAuth } from './authContext';
import { AUTH_SUBMIT, FIELD_INPUT, FIELD_LABEL, FORM_ERROR, TEXT_LINK } from './authStyles';

export function LoginScreen() {
  const navigate = useNavigate();
  const { state, logIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!isValidEmail(email)) {
      setMessage('Enter a valid business email.');
      return;
    }
    if (!password) {
      setMessage('Enter your password.');
      return;
    }
    setMessage('');
    setBusy(true);
    const result = await logIn(email, password);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    navigate('/orders');
  }

  // Already signed in on this device: skip straight to the orders.
  if (state.status === 'ready') return <Navigate to="/orders" replace />;

  return (
    <div className="relative isolate min-h-full overflow-hidden bg-[#0b0f1a] text-white">
      <BrandBackground glow="login" />

      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-26 pb-10">
        <header className="flex flex-col items-center text-center">
          <div className="bg-brand-600 flex size-24 items-center justify-center rounded-3xl shadow-[0_0_56px_rgb(61_90_254/0.6)]">
            <ReceiptCheckIcon />
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight">
            Tracker <span className="text-[#93a4ff]">iBooking</span>
          </h1>
          <p className="mt-4 text-base leading-snug font-medium text-[#aab1c2]">
            Orders, queues and wait times
            <br />
            for your kitchen.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-auto flex flex-col pt-16">
          <label htmlFor="login-email" className={FIELD_LABEL}>
            Business email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@yourstore.co.za"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${FIELD_INPUT} mt-2`}
          />

          <div className="mt-5 flex items-baseline justify-between">
            <label htmlFor="login-password" className={FIELD_LABEL}>
              Password
            </label>
            <button
              type="button"
              onClick={() => setMessage('Password reset is coming soon.')}
              className={`text-xs ${TEXT_LINK}`}
            >
              Forgot password?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${FIELD_INPUT} mt-2`}
          />

          {message && (
            <p role="alert" className={`mt-3 ${FORM_ERROR}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className={`mt-6 ${AUTH_SUBMIT} disabled:cursor-wait disabled:opacity-70`}
          >
            {busy ? 'Logging in…' : 'Log in'}
          </button>

          <p className="mt-5 text-center text-sm leading-relaxed font-medium text-[#8b93a7]">
            For store and restaurant staff only.
            <br />
            Don&apos;t have an account?{' '}
            <Link to="/register" className={TEXT_LINK}>
              Register your business
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
