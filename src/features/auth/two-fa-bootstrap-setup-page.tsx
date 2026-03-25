"use client";

/* eslint-disable @next/next/no-img-element */

import { Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toDataURL } from "qrcode";
import { routes } from "@/config/routes";
import { ApiRequestError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth-store";
import { LoginBrandPanel } from "./components/login-brand-panel";

function formatAuthError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.isValidationError && error.validationDetail?.length) {
      return error.validationDetail.map((d) => d.msg).join("; ");
    }
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function TwoFaBootstrapSetupPage({
  initialEmail,
}: {
  initialEmail?: string;
}) {
  const router = useRouter();

  const accessToken = useAuthStore((s) => s.accessToken);
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired);
  const bootstrap2faSetup = useAuthStore((s) => s.bootstrap2faSetup);
  const bootstrap2faVerify = useAuthStore((s) => s.bootstrap2faVerify);
  const twoFaSetupToken = useAuthStore((s) => s.twoFaSetupToken);
  const twoFaSecret = useAuthStore((s) => s.twoFaSecret);
  const twoFaOtpAuthUrl = useAuthStore((s) => s.twoFaOtpAuthUrl);
  const twoFaSetupExpiresAt = useAuthStore((s) => s.twoFaSetupExpiresAt);
  const twoFaSetupStatus = useAuthStore((s) => s.twoFaSetupStatus);
  const twoFaSetupError = useAuthStore((s) => s.twoFaSetupError);
  const clearTwoFaBootstrap = useAuthStore((s) => s.clearTwoFaBootstrap);

  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (email.trim()) return;
    try {
      const saved = localStorage.getItem("offlode-login-email");
      if (saved) setEmail(saved);
    } catch {
      /* ignore */
    }
  }, [email]);

  useEffect(() => {
    if (accessToken && !isTokenExpired()) {
      router.replace(routes.staffHome);
    }
  }, [accessToken, isTokenExpired, router]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!twoFaOtpAuthUrl) {
        setQrDataUrl(null);
        return;
      }
      try {
        const url = await toDataURL(twoFaOtpAuthUrl, {
          width: 240,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [twoFaOtpAuthUrl]);

  const setupExpired = useMemo(() => {
    if (!twoFaSetupExpiresAt) return false;
    return Date.now() >= twoFaSetupExpiresAt;
  }, [twoFaSetupExpiresAt]);

  const handleStartSetup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await bootstrap2faSetup({
        email: email.trim(),
        password,
      });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!twoFaSetupToken) return;
    setError(null);
    setLoading(true);
    try {
      await bootstrap2faVerify({
        setup_token: twoFaSetupToken,
        code: code.trim(),
      });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" data-offlode-theme="light">
      <LoginBrandPanel />

      <div className="login-right">
        <div className="login-form">
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <Lock size={18} color="var(--primary-teal)" />
            </span>
            Bootstrap 2FA
          </h2>
          <p>Scan in your authenticator app, then verify with your code.</p>

          {setupExpired ? (
            <div className="login-form-error" role="alert">
              Your setup token expired. Please start the bootstrap process
              again.
            </div>
          ) : null}

          {error ? (
            <div className="login-form-error" role="alert">
              {error}
            </div>
          ) : null}

          {!error && twoFaSetupStatus === "error" && twoFaSetupError ? (
            <div className="login-form-error" role="alert">
              {twoFaSetupError}
            </div>
          ) : null}

          {twoFaSetupToken && !setupExpired ? (
            <form onSubmit={handleVerify} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="login-2fa-verify">
                  Two-factor code
                </label>
                <input
                  id="login-2fa-verify"
                  name="code"
                  type="text"
                  className="form-input"
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  <ShieldCheck size={18} color="var(--primary-teal)" />
                  Setup details
                </div>
                {twoFaSecret ? (
                  <div className="login-code-box">
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      Secret
                    </div>
                    <div style={{ wordBreak: "break-all" }}>{twoFaSecret}</div>
                  </div>
                ) : null}
                {twoFaOtpAuthUrl ? (
                  <div style={{ marginTop: 14 }}>
                    {qrDataUrl ? (
                      <img
                        className="login-qr"
                        alt="2FA QR Code"
                        src={qrDataUrl}
                        width={240}
                        height={240}
                        style={{
                          display: "block",
                          margin: "0 auto",
                          borderRadius: 8,
                          border: "1px solid var(--border-color)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", color: "var(--text-tertiary)" }}>
                        Generating QR...
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: 10,
                        textAlign: "center",
                        color: "var(--text-tertiary)",
                        fontSize: 13,
                      }}
                    >
                      Scan from the QR (derived from `otpauth_url`).
                    </div>
                  </div>
                ) : null}
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Verifying…" : "Verify & Sign in"}
              </button>
              <div className="login-footer" style={{ marginTop: 14 }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    clearTwoFaBootstrap();
                    router.push(routes.login);
                  }}
                >
                  Back to login
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStartSetup} noValidate>
              {twoFaSetupStatus === "loading" ? (
                <div className="login-form-error" role="status" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-primary)" }}>
                  Bootstrapping 2FA setup and generating QR...
                </div>
              ) : null}

              <div className="form-group">
                <label className="form-label" htmlFor="login-2fa-email">
                  Email address
                </label>
                <input
                  id="login-2fa-email"
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
                <label className="form-label" htmlFor="login-2fa-password">
                  Password
                </label>
                <input
                  id="login-2fa-password"
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

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Bootstrapping…" : "Start 2FA setup"}
              </button>
              <div className="login-footer" style={{ marginTop: 14 }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(routes.login);
                  }}
                >
                  Back to login
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

