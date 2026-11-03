'use client';

import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';

/**
 * A full-width "Sign up with Google" button in our own styling.
 *
 * Google's rendered button (GoogleLoginButton) is capped at 400px and drawn once
 * at a fixed size, so it can't fill a form. This uses Google's popup flow
 * instead: the click opens Google's account chooser and returns an access
 * token, which the parent sends to POST /api/auth { action: "google-token" }.
 * The server verifies the token was issued to our client id before trusting it.
 *
 * Styled to Google's sign-in branding: white surface, the four-colour "G",
 * "Sign up with Google".
 */
function Inner({
  onToken,
  onError,
  busy,
}: {
  onToken: (accessToken: string) => void;
  onError: () => void;
  busy: boolean;
}) {
  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: (res) => (res.access_token ? onToken(res.access_token) : onError()),
    // Closing the popup is not an error worth a red toast.
    onError: () => onError(),
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={busy}
      className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-[#dadce0] bg-white px-4 text-[13px] font-medium text-[#3c4043] shadow-sm transition hover:bg-[#f8faff] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285f4] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-70"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
      )}
      {busy ? 'Signing you in…' : 'Sign up with Google'}
    </button>
  );
}

export default function GoogleSignupButton(props: {
  onToken: (accessToken: string) => void;
  onError: () => void;
  busy: boolean;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Inner {...props} />
    </GoogleOAuthProvider>
  );
}
