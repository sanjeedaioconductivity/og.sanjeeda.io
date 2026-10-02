"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CredentialResponse } from "@react-oauth/google";
import { toast, ToastContainer } from "react-toastify";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { storePortalToken } from "@/lib/portal/session";
import { useAuth } from "@/lib/portal/AuthProvider";
import "react-toastify/dist/ReactToastify.css";

type AuthMode = "login" | "signup" | "forgot" | "reset" | "google";

type AuthResponse = {
  token?: string;
  message?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  email?: string;
};

type AxiosErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

// PGPStudent went with the `pgp_students` lookup that routeUserAfterLogin used
// to gate navigation on. Nothing else referenced it.

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosErrorResponse;

  return axiosError.response?.data?.message || axiosError.message || fallback;
};

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  /**
   * Post-login housekeeping.
   *
   * Sprint 9 fixed two things here:
   *
   * 1. It now ALWAYS navigates away. It used to push "/" only when the email
   *    appeared in the `pgp_students` localStorage array, so most people stayed
   *    sitting on the login form after a successful login with no sign anything
   *    had happened.
   * 2. It refreshes AuthProvider first. The provider lives in the root layout
   *    and never unmounts, so a client-side navigation does not make it re-read
   *    the session — without this, logging in as an admin left the nav showing
   *    the guest tier until a hard refresh.
   *
   * Order matters: refresh before navigating, so the destination renders with
   * the correct tier rather than correcting itself a moment later.
   */
  const routeUserAfterLogin = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    localStorage.setItem("pgp_session_email", normalizedEmail);
    localStorage.setItem("pgp_active_student_email", normalizedEmail);

    await refresh();

    router.push("/");
    // The destination is a client component tree; refresh() has already updated
    // the provider, but this also re-runs any server components on the way.
    router.refresh();
  };

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  const handleSignupChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSignupForm({
      ...signupForm,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const payload = {
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
      };

const response = await axios.post<AuthResponse>("/api/auth", {
  action: "login",
  ...payload,
});
      if (response.data.token) {
        storePortalToken(response.data.token);
        setMessage("Login successful!");
        await routeUserAfterLogin(payload.email);
      } else {
        setMessage(response.data.message || "Login failed");
      }
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Login failed"));
    }
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const email = signupForm.email.trim().toLowerCase();
      const response = await axios.post<AuthResponse>("/api/auth", {
        action: "signup",
        name: signupForm.name.trim(),
        email,
        password: signupForm.password,
      });

      setMessage("Signup successful!");

      // Sprint 9 fixed two things here. Signup never stored its token, so a new
      // account was logged in on the server (the cookie is set on the signup
      // response) but not on the client. And it navigated to "/pgp", which is
      // not a route — the pgp entry point is "/pgp-access" — so a successful
      // signup landed on a 404.
      if (response.data.token) storePortalToken(response.data.token);
      await routeUserAfterLogin(email);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Signup failed"));
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse.credential) {
      setMessage("Google authentication failed: No credential received.");
      return;
    }

    try {
const response = await axios.post<AuthResponse>("/api/auth", {
  action: "google-login",
  credential: credentialResponse.credential,
});

      if (response.data.token) {
        storePortalToken(response.data.token);

        if (response.data.email) {
          await routeUserAfterLogin(response.data.email);
        } else {
          await refresh();
          router.push("/");
        }
      } else {
        setMessage(response.data.message || "Google authentication failed");
      }
    } catch {
      setMessage("Google authentication failed");
    }
  };

  const handleGoogleFailure = () => {
    setMessage("Google authentication failed");
  };

  const handleSendCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
const response = await fetch("/api/auth", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "send-code",
    email: forgotEmail.trim().toLowerCase(),
  }),
});

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Confirmation code sent to your email.");
        setResetEmail(forgotEmail.trim().toLowerCase());
        setMode("reset");
      } else {
        toast.error(data.message || "User not found.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
const response = await fetch("/api/auth", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "verify-code",
    email: resetEmail.trim().toLowerCase(),
    code: resetCode,
    password: newPassword,
  }),
});

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Password reset successful!");

        setTimeout(() => {
          setMode("login");
          setMessage("Password reset successful. Please login.");
        }, 1200);
      } else {
        toast.error(data.message || "Invalid code or email.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-darkBlue flex items-center justify-center px-4">
      <div className="w-full max-w-md mt-10">
        {mode === "login" && (
          <form onSubmit={handleLogin} className="w-full p-6 sm:p-8 space-y-1">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Sign In
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Welcome Back
              </h1>
            </div>

            <div className="space-y-2">
              <input
                id="login-email"
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                required
                placeholder="Enter your email"
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
              />

              <input
                id="login-password"
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setMode("forgot");
                }}
                className="text-xs font-medium text-red-600 hover:text-red-700 transition"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              Login
            </button>

            {message && (
              <p className="text-center text-sm font-medium text-red-600">
                {message}
              </p>
            )}

            <Divider />

            <div className="space-y-3 text-center">
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onFailure={handleGoogleFailure}
              />

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setMode("google");
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Open Google Login Only
              </button>

              <p className="text-sm text-gray-500 dark:text-slate-400">
                Don&apos;t have an account?
              </p>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setMode("signup");
                }}
                className="inline-block text-sm font-semibold text-red-600 hover:text-red-700 transition"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="w-full p-6 sm:p-8 space-y-1">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Sign Up
              </p>

              <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Welcome Here
              </h1>
            </div>

            <div className="space-y-2">
              <input
                id="signup-name"
                type="text"
                name="name"
                value={signupForm.name}
                onChange={handleSignupChange}
                required
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
              />

              <input
                id="signup-email"
                type="email"
                name="email"
                value={signupForm.email}
                onChange={handleSignupChange}
                required
                placeholder="Enter your email"
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
              />

              <input
                id="signup-password"
                type="password"
                name="password"
                value={signupForm.password}
                onChange={handleSignupChange}
                required
                placeholder="Create a password"
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
              />
            </div>

            {message && (
              <p className="text-center text-sm font-medium text-red-600">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              Register Now
            </button>

            <Divider />

            <div className="space-y-1 text-center">
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onFailure={handleGoogleFailure}
              />

              <p className="text-sm text-gray-500 dark:text-slate-400">
                Already have an account?
              </p>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setMode("login");
                }}
                className="inline-block text-sm font-semibold text-red-600 hover:text-red-700 transition"
              >
                Login
              </button>
            </div>
          </form>
        )}

        {mode === "google" && (
          <div className="w-full p-6 space-y-6 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Google Login
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Continue with Google
              </h1>
            </div>

            <div className="flex justify-center">
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onFailure={handleGoogleFailure}
              />
            </div>

            {message && (
              <p className="text-center text-sm font-medium text-red-600">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setMessage("");
                setMode("login");
              }}
              className="text-sm font-semibold text-red-600 hover:text-red-700 transition"
            >
              Back to Login
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleSendCode} className="w-full p-6 space-y-3">
            <div className="text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Forgot Password
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Enter your email to receive a confirmation code
              </h1>
            </div>

            <input
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send Confirmation Code"}
            </button>

            <Divider />

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setMode("login");
                }}
                className="block w-full text-sm font-semibold text-red-600 transition hover:text-red-700"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleVerifyAndReset} className="w-full p-6 space-y-3">
            <div className="text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Reset Password
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Enter your 6 Digits Code to Reset Password
              </h1>
            </div>

            <input
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
            />

            <input
              type="text"
              placeholder="Your code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
            />

            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <Divider />

            <div className="space-y-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setMode("forgot");
                }}
                className="block w-full text-sm font-semibold text-red-600 transition hover:text-red-700"
              >
                Forgot Password
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setMode("login");
                }}
                className="block w-full text-sm font-semibold text-red-600 transition hover:text-red-700"
              >
                Back to Login
              </button>

              <Link
                href="/#Home"
                className="block text-sm font-semibold text-red-600 transition hover:text-red-700"
              >
                Back to Home
              </Link>
            </div>
          </form>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center my-2">
      <hr className="w-1/4 border-gray-300 dark:border-white/15" />
      <span className="px-2 text-xs font-semibold text-gray-500 dark:text-slate-400">OR</span>
      <hr className="w-1/4 border-gray-300 dark:border-white/15" />
    </div>
  );
}