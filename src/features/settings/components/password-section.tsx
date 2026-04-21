"use client";

import { useState, useMemo } from "react";
import { Lock, Key, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api/auth-api";
import {
  SectionHeader,
  Field,
  FeedbackMessage,
  inputStyle,
  primaryBtnStyle,
  ghostBtnStyle,
} from "./profile-section";

function scorePassword(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pw) return { score: 0, label: "", color: "var(--clr-muted)" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Status colors — use CSS vars so they adapt in dark mode via the --success/
  // --danger/--warning/--info variables defined in reference-style.css.
  const bands = [
    { label: "Too short", color: "var(--danger)" },
    { label: "Weak", color: "var(--danger)" },
    { label: "Fair", color: "var(--warning)" },
    { label: "Good", color: "var(--info)" },
    { label: "Strong", color: "var(--success)" },
    { label: "Very strong", color: "var(--success)" },
  ];
  return { score, ...bands[Math.min(score, bands.length - 1)] };
}

function PasswordInput({
  label,
  value,
  onChange,
  icon,
  autoComplete,
  hint,
  error,
  showToggle = true,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  autoComplete?: string;
  hint?: React.ReactNode;
  error?: boolean;
  showToggle?: boolean;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "var(--danger)"
    : focused
      ? "var(--brand)"
      : "var(--clr-divider)";

  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 500,
          color: "var(--clr-secondary)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: "var(--clr-surface-subtle)",
          border: `1px solid ${borderColor}`,
          borderRadius: 10,
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: focused
            ? `0 0 0 3px ${error ? "rgba(239,68,68,0.15)" : "rgba(53,126,146,0.15)"}`
            : "none",
        }}
      >
        <div
          style={{
            paddingLeft: 12,
            color: focused ? "var(--brand)" : "var(--clr-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            padding: "11px 10px",
            border: "none",
            background: "transparent",
            color: "var(--clr-primary)",
            fontSize: 14,
            outline: "none",
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            style={{
              background: "none",
              border: "none",
              color: "var(--clr-muted)",
              cursor: "pointer",
              padding: "0 12px",
              height: 40,
              display: "flex",
              alignItems: "center",
            }}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: error ? "var(--danger)" : "var(--clr-muted)",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  const strength = useMemo(() => scorePassword(newPassword), [newPassword]);
  const mismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({
        text: "New password and confirmation do not match.",
        ok: false,
      });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({
        text: "New password must be at least 8 characters.",
        ok: false,
      });
      return;
    }
    if (currentPassword === newPassword) {
      setMessage({
        text: "New password must differ from the current password.",
        ok: false,
      });
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage({ text: "Password changed successfully.", ok: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;
      setMessage({ text: detail || "Failed to change password.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <SectionHeader
        title="Change Password"
        description="Use a strong password with at least 8 characters. You'll remain signed in after changing it."
      />

      {/* Security tip card — tinted overlays work on both light and dark themes */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "12px 14px",
          borderRadius: 10,
          background:
            "linear-gradient(135deg, rgba(53,126,146,0.08), rgba(98,190,208,0.05))",
          border: "1px solid rgba(53,126,146,0.25)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "rgba(53,126,146,0.18)",
            color: "var(--brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={17} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--clr-primary)" }}>
            Security tip
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--clr-muted)",
              marginTop: 2,
              lineHeight: 1.5,
            }}
          >
            Mix uppercase, lowercase, numbers, and symbols. Avoid reusing passwords
            across services.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <PasswordInput
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          icon={<Lock size={15} />}
          autoComplete="current-password"
          required
        />

        <PasswordInput
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          icon={<Key size={15} />}
          autoComplete="new-password"
          required
        />

        {/* Strength meter */}
        {newPassword && (
          <div style={{ marginTop: -8, marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                gap: 4,
                height: 5,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background:
                      i < strength.score ? strength.color : "var(--clr-divider)",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span
                style={{ color: strength.color, fontWeight: 600 }}
              >
                {strength.label}
              </span>
              <span style={{ color: "var(--clr-muted)" }}>
                {newPassword.length} chars
              </span>
            </div>
          </div>
        )}

        <PasswordInput
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={<Key size={15} />}
          autoComplete="new-password"
          required
          error={mismatch}
          hint={mismatch ? "Passwords don't match." : undefined}
        />

        <FeedbackMessage message={message} />

        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          {(currentPassword || newPassword || confirmPassword) && (
            <button
              type="button"
              style={ghostBtnStyle}
              onClick={() => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setMessage(null);
              }}
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={
              saving || !currentPassword || !newPassword || !confirmPassword
            }
            style={primaryBtnStyle(
              saving || !currentPassword || !newPassword || !confirmPassword,
            )}
          >
            {saving ? "Changing…" : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}
