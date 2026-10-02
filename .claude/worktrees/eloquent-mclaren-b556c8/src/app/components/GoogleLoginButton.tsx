"use client";

import React from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";
import { useRouter } from "next/navigation";

export interface GoogleLoginButtonProps {
  onSuccess: (credentialResponse: CredentialResponse) => Promise<void>;
  onFailure: () => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onFailure,
}) => {
  const router = useRouter();

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      console.error("No credential found in response");
      onFailure();
      return;
    }

    try {
      const res = await fetch("/api/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

const data = await res.json();

console.log("Server Response:", data);
console.log("Google ID:", data.user?.google_id);

if (res.ok && data.token) {
  localStorage.setItem("token", data.token);
  router.push("/");
} else {
  console.error("Login failed:", data.message);
}
    } catch (error) {
      console.error("Login Error:", error);
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