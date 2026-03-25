"use client";

import { Eye, EyeOff } from "lucide-react";
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

function hasTwoFaSetupRequired(error: ApiRequestError): boolean {
  return (
    error.status === 403 &&
    /2fa/i.test(error.message) &&
    /setup/i.test(error.message)
  );
}

function hasTwoFaCodeRequired(error: ApiRequestError): boolean {
  const messageLower = error.message.toLowerCase();
  const hasTwoFactorInLoc = error.validationDetail?.some((d) =>
    d.loc.some((part) => String(part).toLowerCase().includes("two_factor"))
  );

  // Covers API responses like "2FA code required", "OTP required", validation on two_factor_code.
  return (
    hasTwoFactorInLoc || /2fa|otp|two[-_ ]?factor/.test(messageLower)
  );
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
  const [showPassword, setShowPassword] = useState(false);

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

  const redirectToBootstrapSetup = useCallback(() => {
    const emailTrimmed = email.trim();
    clearSession();
    clearTwoFaBootstrap();

    if (emailTrimmed) {
      router.push(
        `${routes.twoFaBootstrapSetup}?email=${encodeURIComponent(emailTrimmed)}`
      );
    } else {
      router.push(routes.twoFaBootstrapSetup);
    }

    void bootstrap2faSetup({
      email: emailTrimmed,
      password,
    }).catch(() => {
      /* store will surface setup error on setup page */
    });
  }, [
    email,
    password,
    router,
    clearSession,
    clearTwoFaBootstrap,
    bootstrap2faSetup,
  ]);

  const handleNext = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        // Step 1: try login with email/password only.
        await login({
          email: email.trim(),
          password,
        });
        persistRememberEmail();
        router.push(routes.staffHome);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (hasTwoFaSetupRequired(err)) {
            redirectToBootstrapSetup();
            return;
          }
          if (hasTwoFaCodeRequired(err)) {
            // 2FA already linked: ask user for OTP in step 2.
            setStep(2);
            return;
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
      login,
      persistRememberEmail,
      router,
      redirectToBootstrapSetup,
    ]
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
        if (err instanceof ApiRequestError && hasTwoFaSetupRequired(err)) {
          redirectToBootstrapSetup();
          return;
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
      persistRememberEmail,
      router,
      redirectToBootstrapSetup,
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
            <div className="password-field">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
            {loading ? "Checking..." : "Next"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} noValidate>
          <p style={{ marginBottom: 12, fontSize: 14, color: "var(--text-tertiary)" }}>
            Enter the code from your authenticator app.
          </p>
          <p
            style={{
              marginBottom: 16,
              fontSize: 14,
              color: "var(--text-secondary)",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            If your 2FA is not linked yet,{" "}
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                setError(null);

                const emailTrimmed = email.trim();
                const passwordTrimmed = password.trim();

                if (!emailTrimmed || !passwordTrimmed) {
                  setError("Please enter your email and password first.");
                  setStep(1);
                  return;
                }

                setLoading(true);
                clearTwoFaBootstrap();
                try {
                  await bootstrap2faSetup({
                    email: emailTrimmed,
                    password: passwordTrimmed,
                  });
                } finally {
                  setLoading(false);
                  router.push(
                    `${routes.twoFaBootstrapSetup}?email=${encodeURIComponent(
                      emailTrimmed
                    )}`
                  );
                }
              }}
              style={{
                color: "var(--primary-teal)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              link it here
            </a>
            .
          </p>
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}

      <div className="login-footer">
        <p>
          Don&apos;t have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              router.push(routes.signup);
            }}
          >
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
