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
  const clearSession = useAuthStore((s) => s.clearSession);
  const bootstrap2faSetup = useAuthStore((s) => s.bootstrap2faSetup);
  const clearTwoFaBootstrap = useAuthStore((s) => s.clearTwoFaBootstrap);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
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
      router.replace(routes.staffHome);
    }
  }, [accessToken, isTokenExpired, router]);

  const persistRememberEmail = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [email, rememberMe]);

  const handleNext = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setStep(2);
    },
    []
  );

  const handleSignIn = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await login({
          email: email.trim(),
          password,
          two_factor_code: twoFactorCode.trim(),
        });
        persistRememberEmail();
        router.push(routes.staffHome);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiRequestError) {
          const looksLikeTwoFaBootstrapRequired =
            err.status === 403 &&
            /2fa/i.test(err.message) &&
            /setup/i.test(err.message);

          const emailTrimmed = email.trim();

          if (looksLikeTwoFaBootstrapRequired) {
            clearSession();
            clearTwoFaBootstrap();

            if (emailTrimmed) {
              router.push(
                `${routes.twoFaBootstrapSetup}?email=${encodeURIComponent(
                  emailTrimmed
                )}`
              );
            } else {
              router.push(routes.twoFaBootstrapSetup);
            }

            // Background: fetch bootstrap/setup so the user can see QR immediately.
            void bootstrap2faSetup({
              email: emailTrimmed,
              password,
            }).catch(() => {
              /* store will show setup error */
            });

            return;
          }

          const messageLower = err.message.toLowerCase();
          const detailLower = err.validationDetail
            ?.map((d) => d.msg)
            .join(" ")
            .toLowerCase();
          const hasTwoFactorInLoc = err.validationDetail?.some((d) =>
            d.loc.some((part) =>
              String(part).toLowerCase().includes("two_factor")
            )
          );
          const looksLikeInvalid2faCode =
            (messageLower.includes("invalid") ||
              messageLower.includes("incorrect") ||
              messageLower.includes("wrong")) &&
            (messageLower.includes("2fa") ||
              messageLower.includes("otp") ||
              messageLower.includes("two-factor") ||
              messageLower.includes("two_factor") ||
              /two[-_ ]?factor/.test(detailLower ?? "") ||
              hasTwoFactorInLoc);

          if (looksLikeInvalid2faCode) {
            if (emailTrimmed) {
              // Requirement: never show invalid-code error; redirect immediately.
              clearSession();
              clearTwoFaBootstrap();
              router.push(
                `${routes.twoFaBootstrapSetup}?email=${encodeURIComponent(
                  emailTrimmed
                )}`
              );

              // Background: call bootstrap/setup so the QR appears.
              void bootstrap2faSetup({
                email: emailTrimmed,
                password,
              }).catch(() => {
                /* error will be shown on 2FA setup page */
              });

              return;
            }
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
      login,
      router,
      clearSession,
      bootstrap2faSetup,
      clearTwoFaBootstrap,
      persistRememberEmail,
    ]
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

      {step === 1 ? (
        <form onSubmit={handleNext} noValidate>
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Next
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} noValidate>
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
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setError(null);
                setStep(1);
              }}
              style={{
                color: "var(--primary-teal)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Back
            </a>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

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
