"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { ApiRequestError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth-store";

const REMEMBER_EMAIL_KEY = "offlode-login-email";

function formatLoginError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const details = error.validationDetail;
    if (details?.length) {
      return details.map((d) => d.msg).join("; ");
    }
    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function LoginCredentialsForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (accessToken && !isTokenExpired()) {
      router.replace(routes.home);
    }
  }, [accessToken, isTokenExpired, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await login({
          email: email.trim(),
          password,
          ...(twoFactorCode.trim()
            ? { two_factor_code: twoFactorCode.trim() }
            : {}),
        });
        if (rememberMe && typeof window !== "undefined") {
          try {
            localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
          } catch {
            /* ignore */
          }
        } else if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
          } catch {
            /* ignore */
          }
        }
        router.push(routes.home);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiRequestError) {
          const needs2fa = err.validationDetail?.some((d) =>
            d.loc.some((part) =>
              String(part).toLowerCase().includes("two_factor")
            )
          );
          if (needs2fa || /2fa|two[- ]?factor|otp/i.test(err.message)) {
            setShowTwoFactor(true);
          }
        }
        setError(formatLoginError(err));
      } finally {
        setLoading(false);
      }
    },
    [email, password, twoFactorCode, rememberMe, login, router]
  );

  return (
    <div className="login-form">
      <h2>Welcome back</h2>
      <p>Sign in to your account to continue</p>

      {error ? (
        <div className="login-form-error" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            className="form-input"
            placeholder="you@yourfirm.co.uk"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            className="form-input"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        {showTwoFactor ? (
          <div className="form-group">
            <label className="form-label" htmlFor="login-2fa">
              Two-factor code
            </label>
            <input
              id="login-2fa"
              name="two_factor_code"
              type="text"
              className="form-input"
              placeholder="Enter your 2FA code"
              autoComplete="one-time-code"
              inputMode="numeric"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              disabled={loading}
            />
          </div>
        ) : null}
        <div className="form-checkbox">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
          />
          <label htmlFor="remember">Remember me for 30 days</label>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="login-footer">
        <p>
          Don&apos;t have an account?{" "}
          <a href="#" onClick={(e) => e.preventDefault()}>
            Start free trial
          </a>
        </p>
        <p style={{ marginTop: 8 }}>
          <a href="#" onClick={(e) => e.preventDefault()}>
            Forgot password?
          </a>
        </p>
      </div>
    </div>
  );
}
