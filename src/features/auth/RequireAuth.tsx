import { Navigate, Outlet } from 'react-router';
import { BUTTON_OUTLINE, SCREEN } from '../../components/styles';
import { useAuth } from './authContext';

/** Keeps the business screens behind a login. In demo mode (no Supabase keys) everyone gets in. */
export function RequireAuth() {
  const { state, logOut } = useAuth();

  if (state.status === 'demo' || state.status === 'ready') return <Outlet />;
  if (state.status === 'signedOut') return <Navigate to="/" replace />;

  return (
    <div className={`${SCREEN} items-center justify-center gap-4 px-6 text-center`}>
      {state.status === 'loading' ? (
        <>
          <span
            aria-hidden="true"
            className="border-line-strong border-t-brand-600 size-10 animate-spin rounded-full border-4"
          />
          <p role="status" className="text-muted font-semibold">
            Loading your business…
          </p>
        </>
      ) : (
        <>
          <p role="alert" className="text-lg font-bold">
            {state.message}
          </p>
          <p className="text-muted">Signed in as {state.user.email}.</p>
          <div className="grid w-full max-w-72 gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-brand-600 hover:bg-brand-700 h-14 rounded-2xl text-lg font-bold text-white"
            >
              Try again
            </button>
            <button type="button" onClick={() => void logOut()} className={BUTTON_OUTLINE}>
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
