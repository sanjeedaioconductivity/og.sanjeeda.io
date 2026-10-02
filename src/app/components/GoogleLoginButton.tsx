"use client";

import React from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";

export interface GoogleLoginButtonProps {
  onSuccess: (credentialResponse: CredentialResponse) => Promise<void>;
  onFailure: () => void;
}

/**
 * Thin wrapper over Google's button. The credential is handed straight to the
 * caller's `onSuccess`, which is the only thing that exchanges it for a portal
 * session (see `auth/page.tsx` → `POST /api/auth` with `action: "google-login"`).
 *
 * Sprint 9 removed a second exchange that used to run here first: it posted to
 * `/api/google-login`, a route that does not exist, so it 404'd on every sign-in
 * and its `localStorage.setItem("token", …)` never ran. That dead write was the
 * portal's second JWT storage key.
 */
const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onFailure,
}) => {
  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      console.error("No credential found in response");
      onFailure();
      return;
    }

    await onSuccess(response);
  };

  const handleFailure = () => {
    console.error("Google Login Failed");
    onFailure();
  };

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
    >
      <GoogleLogin onSuccess={handleSuccess} onError={handleFailure} />
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;