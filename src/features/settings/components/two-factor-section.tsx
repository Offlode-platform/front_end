"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Check,
  Copy,
  Smartphone,
} from "lucide-react";
import { toDataURL } from "qrcode";
import { authApi } from "@/lib/api/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import type { CurrentUser, Setup2faResponse } from "@/types/auth";
import {
  SectionHeader,
  Field,
  FeedbackMessage,
  inputStyle,
  primaryBtnStyle,
  ghostBtnStyle,
  dangerBtnStyle,
} from "./profile-section";

type Stage =
  | { kind: "idle" }
  | { kind: "setup_pending"; data: Setup2faResponse }
  | { kind: "disable_confirm" };

export function TwoFactorSection({ user }: { user: CurrentUser }) {
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Generate QR code whenever we move into the setup_pending stage
  useEffect(() => {
    if (stage.kind !== "setup_pending") {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = await toDataURL(stage.data.otpauth_url, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#111827", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stage]);

  async function handleStartSetup() {
    setBusy(true);
    setMessage(null);
    try {
      const data = await authApi.setup2fa();
      setStage({ kind: "setup_pending", data });
    } catch (err) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;
      setMessage({ text: detail || "Failed to start 2FA setup.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode() {
    if (!verificationCode || verificationCode.length < 6) return;
    setBusy(true);
    setMessage(null);
    try {
      await authApi.verify2fa({ code: verificationCode });
      setMessage({
        text: "Two-factor authentication enabled successfully.",
        ok: true,
      });
      setStage({ kind: "idle" });
      setVerificationCode("");
      await loadCurrentUser();
    } catch (err) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;
      setMessage({
        text: detail || "Invalid code. Please try again.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (!confirmPassword) return;
    setBusy(true);
    setMessage(null);
    try {
      await authApi.disable2fa({ password: confirmPassword });
      setMessage({ text: "Two-factor authentication disabled.", ok: true });
      setStage({ kind: "idle" });
      setConfirmPassword("");
      await loadCurrentUser();
    } catch (err) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;
      setMessage({ text: detail || "Failed to disable 2FA.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopySecret() {
    if (stage.kind !== "setup_pending") return;
    try {
      await navigator.clipboard.writeText(stage.data.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  }

  const isEnabled = user.two_factor_enabled;

  return (
    <div style={{ maxWidth: 640 }}>
      <SectionHeader
        title="Two-Factor Authentication"
        description="Protect your account with a one-time code from your authenticator app every time you sign in."
      />

      {/* Status hero card */}
      <div
        style={{
          position: "relative",
          padding: 20,
          borderRadius: 16,
          background: isEnabled
            ? "linear-gradient(135deg, rgba(34,160,107,0.12), rgba(22,163,74,0.06))"
            : "linear-gradient(135deg, rgba(224,148,34,0.12), rgba(245,158,11,0.06))",
          border: `1px solid ${isEnabled ? "rgba(34,160,107,0.3)" : "rgba(224,148,34,0.3)"}`,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: isEnabled ? "var(--success)" : "var(--warning)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: isEnabled
              ? "0 6px 20px rgba(34,160,107,0.4)"
              : "0 6px 20px rgba(224,148,34,0.4)",
          }}
        >
          {isEnabled ? <ShieldCheck size={28} /> : <AlertTriangle size={26} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: isEnabled ? "var(--success)" : "var(--warning)",
              letterSpacing: "-0.01em",
            }}
          >
            {isEnabled ? "Two-factor authentication is ON" : "Two-factor authentication is OFF"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--clr-muted)",
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {isEnabled
              ? "Your account has an extra layer of security. You'll need a code from your authenticator each time you sign in."
              : "Your account is protected by password only. We strongly recommend enabling 2FA."}
          </div>
        </div>
      </div>

      <FeedbackMessage message={message} />

      {/* Idle state */}
      {stage.kind === "idle" && !isEnabled && (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handleStartSetup}
            disabled={busy}
            style={{
              ...primaryBtnStyle(busy),
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Shield size={14} />
            {busy ? "Starting…" : "Set up two-factor authentication"}
          </button>
        </div>
      )}

      {stage.kind === "idle" && isEnabled && (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setStage({ kind: "disable_confirm" })}
            style={{
              ...ghostBtnStyle,
              color: "var(--danger)",
              borderColor: "rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.06)",
            }}
          >
            Disable two-factor authentication
          </button>
        </div>
      )}

      {/* Setup flow */}
      {stage.kind === "setup_pending" && (
        <div
          style={{
            marginTop: 8,
            padding: 24,
            borderRadius: 16,
            background: "var(--clr-surface-subtle)",
            border: "1px solid var(--clr-divider)",
          }}
        >
          {/* Step indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <StepPill num={1} label="Scan QR code" active />
            <StepConnector />
            <StepPill num={2} label="Verify code" />
          </div>

          {/* QR + secret */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: 20,
              alignItems: "flex-start",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 14,
                // QR code MUST stay on white for phone scanners to read it
                // regardless of the app theme.
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--clr-divider-strong)",
                padding: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="2FA QR Code"
                  width={216}
                  height={216}
                  style={{ display: "block", borderRadius: 8 }}
                />
              ) : (
                <div style={{ color: "var(--clr-muted)", fontSize: 13 }}>
                  Generating QR…
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: "rgba(53,126,146,0.18)",
                    color: "var(--brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Smartphone size={14} />
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--clr-primary)",
                  }}
                >
                  Scan with an authenticator app
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--clr-muted)",
                  lineHeight: 1.6,
                  marginBottom: 16,
                  marginLeft: 34,
                }}
              >
                Use Google Authenticator, 1Password, Authy, or any app that
                supports time-based codes.
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--clr-muted)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Can&apos;t scan? Enter manually
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                  background: "var(--clr-surface-subtle)",
                  border: "1px solid var(--clr-divider-strong)",
                  borderRadius: 10,
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 12,
                    color: "var(--clr-primary)",
                    wordBreak: "break-all",
                    letterSpacing: "0.03em",
                  }}
                >
                  {stage.data.secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  style={{
                    background: copiedSecret
                      ? "rgba(34,160,107,0.15)"
                      : "var(--clr-surface-subtle)",
                    color: copiedSecret ? "var(--success)" : "var(--clr-secondary)",
                    border: `1px solid ${copiedSecret ? "rgba(34,160,107,0.35)" : "var(--clr-divider-strong)"}`,
                    borderRadius: 7,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {copiedSecret ? (
                    <>
                      <Check size={12} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Verification code input */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "var(--clr-surface-subtle)",
              border: "1px solid var(--clr-divider-strong)",
              marginBottom: 16,
            }}
          >
            <Field label="Enter the 6-digit code from your authenticator app">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, ""))
                }
                maxLength={6}
                placeholder="000000"
                inputMode="numeric"
                autoFocus
                style={{
                  ...inputStyle,
                  letterSpacing: "0.5em",
                  textAlign: "center",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 24,
                  fontWeight: 700,
                  paddingTop: 14,
                  paddingBottom: 14,
                }}
              />
            </Field>
            <div
              style={{
                fontSize: 12,
                color: "var(--clr-muted)",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Codes rotate every 30 seconds.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setStage({ kind: "idle" });
                setVerificationCode("");
              }}
              disabled={busy}
              style={ghostBtnStyle}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={busy || verificationCode.length !== 6}
              style={primaryBtnStyle(busy || verificationCode.length !== 6)}
            >
              {busy ? "Verifying…" : "Enable 2FA"}
            </button>
          </div>
        </div>
      )}

      {/* Disable confirm */}
      {stage.kind === "disable_confirm" && (
        <div
          style={{
            marginTop: 8,
            padding: 24,
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.04))",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(239,68,68,0.18)",
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--clr-primary)",
                  marginBottom: 4,
                }}
              >
                Disable two-factor authentication?
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--clr-muted)",
                  lineHeight: 1.5,
                }}
              >
                This reduces your account security. You&apos;ll only need your
                password to sign in — not recommended.
              </div>
            </div>
          </div>

          <Field label="Confirm your password to continue">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
              autoFocus
            />
          </Field>

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setStage({ kind: "idle" });
                setConfirmPassword("");
              }}
              disabled={busy}
              style={ghostBtnStyle}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDisable}
              disabled={busy || !confirmPassword}
              style={{
                ...dangerBtnStyle,
                opacity: busy || !confirmPassword ? 0.6 : 1,
                cursor:
                  busy || !confirmPassword ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepPill({
  num,
  label,
  active,
}: {
  num: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        background: active
          ? "linear-gradient(135deg, rgba(53,126,146,0.2), rgba(98,190,208,0.12))"
          : "var(--clr-surface-card)",
        border: `1px solid ${active ? "rgba(53,126,146,0.45)" : "var(--clr-divider-strong)"}`,
        fontSize: 12,
        color: active ? "var(--brand)" : "var(--clr-muted)",
        fontWeight: active ? 600 : 500,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: active
            ? "linear-gradient(135deg, var(--brand), var(--brand-electric))"
            : "var(--clr-surface-subtle)",
          color: active ? "#fff" : "var(--clr-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          boxShadow: active ? "0 2px 6px rgba(53,126,146,0.45)" : "none",
        }}
      >
        {num}
      </span>
      {label}
    </div>
  );
}

function StepConnector() {
  return (
    <div
      style={{
        flex: "0 1 40px",
        height: 1,
        background: "var(--clr-divider)",
      }}
    />
  );
}
