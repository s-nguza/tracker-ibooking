import type { AuthError, PostgrestError } from '@supabase/supabase-js';

/** Turns Supabase errors into something an owner can act on. */
export function friendlyAuthError(error: AuthError): string {
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return 'Couldn’t reach the server. Check your internet connection and try again.';
  }
  switch (error.code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Check them and try again.';
    case 'email_not_confirmed':
      return 'Confirm your email first: open the link we sent to your inbox.';
    case 'user_already_exists':
    case 'email_exists':
      return 'This email is already registered. Log in instead.';
    case 'weak_password':
      return 'Choose a stronger password: longer, with letters and numbers.';
    case 'email_address_invalid':
      return 'That email address can’t be used. Check it or use another.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many tries. Wait a few minutes and try again.';
    case 'signup_disabled':
      return 'New registrations are switched off at the moment.';
    default:
      return error.message || 'Something went wrong. Try again.';
  }
}

export function friendlyDataError(error: PostgrestError): string {
  if (/fetch|network/i.test(error.message)) {
    return 'Couldn’t reach the server. Check your internet connection and try again.';
  }
  return `Couldn’t load your business (${error.message}).`;
}
