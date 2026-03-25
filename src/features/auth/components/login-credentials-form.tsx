"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { ApiRequestError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth-store";
import type { Bootstrap2faSetupResponse } from "@/types/auth";
import { QrCode } from "@/components/qr";

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
  const clearSession = useAuthStore((s) => s.clearSession);
  const bootstrap2faSetup = useAuthStore((s) => s.bootstrap2faSetup);
  const bootstrap2faVerify = useAuthStore((s) => s.bootstrap2faVerify);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [twoFaPhase, setTwoFaPhase] = useState<
    "login" | "bootstrapping" | "qr" | "verify"
  >("login");
  const [bootstrapRes, setBootstrapRes] = useState<
    Bootstrap2faSetupResponse | null
  >(null);

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
      router.replace(routes.staffHome);
    }
  }, [accessToken, isTokenExpired, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        if (twoFaPhase !== "login") return;
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
        router.push(routes.staffHome);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiRequestError) {
          const looksLikeTwoFaBootstrapRequired =
            err.status === 403 &&
            /2fa/i.test(err.message) &&
            (/setup/i.test(err.message) || /required/i.test(err.message));

          if (looksLikeTwoFaBootstrapRequired) {
            clearSession();
            setTwoFaPhase("bootstrapping");
            setTwoFactorCode("");
            setBootstrapRes(null);

            try {
              const res = await bootstrap2faSetup({
                email: email.trim(),
                password,
              });
              setBootstrapRes(res);
              setTwoFaPhase("qr");
            } catch (bootstrapErr) {
              setError(formatLoginError(bootstrapErr));
              setTwoFaPhase("login");
            }
            return;
          }

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
    [
      email,
      password,
      twoFactorCode,
      rememberMe,
      login,
      router,
      clearSession,
      bootstrap2faSetup,
      twoFaPhase,
    ]
  );

  const handleVerify2fa = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (twoFaPhase !== "verify") return;
      if (!bootstrapRes?.setup_token) return;

      setError(null);
      setLoading(true);
      try {
        await bootstrap2faVerify({
          setup_token: bootstrapRes.setup_token,
          code: twoFactorCode.trim(),
        });
        router.push(routes.staffHome);
        router.refresh();
      } catch (err) {
        setError(formatLoginError(err));
      } finally {
        setLoading(false);
      }
    },
    [bootstrap2faVerify, bootstrapRes, router, twoFaPhase, twoFactorCode]
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

      {twoFaPhase === "login" ? (
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
      ) : null}

      {twoFaPhase === "bootstrapping" ? (
        <div style={{ paddingTop: 6 }}>
          <div className="login-form-error" style={{ background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
            Setting up 2FA… please wait.
          </div>
          <div style={{ marginTop: 12, color: "var(--text-tertiary)", fontSize: 14 }}>
            Calling <span style={{ fontFamily: "var(--font-synapse-mono)" }}>POST /api/v1/auth/2fa/bootstrap/setup</span>
          </div>
        </div>
      ) : null}

      {twoFaPhase === "qr" && bootstrapRes ? (
        <div>
          <div style={{ marginTop: 14, marginBottom: 10, color: "var(--text-secondary)" }}>
            Scan this QR code with your authenticator app.
          </div>

          <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
            <QrCode value={bootstrapRes.otpauth_url} size={190} />
          </div>

          <div style={{ marginTop: 10, color: "var(--text-tertiary)", fontSize: 12 }}>
            Do NOT scan the setup token. Only scan from <code style={{ fontFamily: "var(--font-synapse-mono)" }}>otpauth_url</code>.
          </div>

          <div style={{ marginTop: 14, border: "1px solid var(--border-color)", borderRadius: 6, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Bootstrap response</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", wordBreak: "break-all" }}>
              <div>
                <span style={{ fontWeight: 600 }}>secret:</span> {bootstrapRes.secret}
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>otpauth_url:</span> {bootstrapRes.otpauth_url}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 600 }}>setup_token:</span> {bootstrapRes.setup_token}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => {
              setTwoFactorCode("");
              setTwoFaPhase("verify");
            }}
            style={{ marginTop: 16 }}
          >
            Next: enter code
          </button>

          <div className="login-footer" style={{ marginTop: 14 }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setBootstrapRes(null);
                setTwoFaPhase("login");
                setError(null);
              }}
            >
              Cancel setup
            </a>
          </div>
        </div>
      ) : null}

      {twoFaPhase === "verify" && bootstrapRes ? (
        <form onSubmit={handleVerify2fa} noValidate style={{ marginTop: 10 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-2fa-verify">
              Two-factor code
            </label>
            <input
              id="login-2fa-verify"
              name="code"
              type="text"
              className="form-input"
              placeholder="Enter your 6-digit code"
              autoComplete="one-time-code"
              inputMode="numeric"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Verifying…" : "Verify & Sign in"}
          </button>
        </form>
      ) : null}

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
