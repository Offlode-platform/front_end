"use client";

import { useState } from "react";
import { Mail, Building2, User as UserIcon, Clock, Check, AlertCircle, Info } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import type { CurrentUser } from "@/types/auth";

export function ProfileSection({ user }: { user: CurrentUser }) {
  const updateCurrentUser = useAuthStore((s) => s.updateCurrentUser);
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const dirty = name.trim() !== user.name;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateCurrentUser({ name: name.trim() });
      setMessage({ text: "Profile updated successfully.", ok: true });
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMessage({ text: detail || "Failed to update profile.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <SectionHeader
        title="Profile"
        description="Your name is shown to teammates on chases, activity, and audit logs."
      />

      {/* Hero profile card with gradient — tinted overlays work on both light and dark themes */}
      <div
        style={{
          position: "relative",
          padding: 20,
          borderRadius: 16,
          background:
            "linear-gradient(135deg, rgba(53,126,146,0.08) 0%, rgba(98,190,208,0.05) 100%)",
          border: "1px solid rgba(53,126,146,0.2)",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
          overflow: "hidden",
        }}
      >
        <Avatar name={user.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--clr-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--clr-muted)",
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Mail size={12} />
            {user.email}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <RoleBadge role={user.role} />
            {user.email_verified && <Pill variant="success" label="Email verified" />}
            {user.two_factor_enabled && <Pill variant="accent" label="2FA enabled" />}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <IconInput
          label="Display name"
          icon={<UserIcon size={15} />}
          value={name}
          onChange={setName}
          required
        />

        <IconInput
          label="Email address"
          icon={<Mail size={15} />}
          value={user.email}
          disabled
          hint={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Info size={11} /> Email changes require admin support.
            </span>
          }
        />

        <IconInput
          label="Organization"
          icon={<Building2 size={15} />}
          value={user.organization_name || "—"}
          disabled
        />

        {/* Metadata card */}
        <div
          style={{
            marginTop: 20,
            padding: "4px 16px",
            borderRadius: 12,
            background: "var(--clr-surface-subtle)",
            border: "1px solid var(--clr-divider-strong)",
          }}
        >
          <MetaRow
            icon={<Clock size={13} />}
            label="Last login"
            value={
              user.last_login_at
                ? new Date(user.last_login_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Never"
            }
          />
          <MetaRow
            icon={<Clock size={13} />}
            label="Member since"
            value={
              user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
            last
          />
        </div>

        <FeedbackMessage message={message} />

        <div
          style={{
            marginTop: "var(--sp-24)",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setName(user.name);
                setMessage(null);
              }}
              style={ghostBtnStyle}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!dirty || saving}
            style={primaryBtnStyle(!dirty || saving)}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ===========================================================================
// SHARED PRIMITIVES (exported)
// ===========================================================================

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--clr-primary)",
          marginBottom: description ? 6 : 0,
          letterSpacing: "-0.015em",
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 13.5,
            color: "var(--clr-muted)",
            lineHeight: 1.55,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

/**
 * Input with a left-side icon inside the field. Much cleaner than an
 * icon next to the label.
 */
export function IconInput({
  label,
  icon,
  value,
  onChange,
  disabled,
  required,
  type = "text",
  placeholder,
  hint,
  autoComplete,
  maxLength,
  inputMode,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: React.ReactNode;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "email";
}) {
  const [focused, setFocused] = useState(false);

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
          // Subtle inset surface so the input visually recedes inside the
          // outer card on both themes.
          background: "var(--clr-surface-subtle)",
          border: `1px solid ${focused ? "var(--brand)" : "var(--clr-divider-strong)"}`,
          borderRadius: 10,
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: focused ? "0 0 0 3px rgba(53,126,146,0.15)" : "none",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {icon && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: 12,
              color: focused ? "var(--brand)" : "var(--clr-muted)",
              transition: "color 0.15s",
            }}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            padding: icon ? "11px 14px 11px 10px" : "11px 14px",
            border: "none",
            background: "transparent",
            color: "var(--clr-primary)",
            fontSize: 14,
            outline: "none",
            width: "100%",
          }}
        />
      </div>
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: "var(--clr-muted)",
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

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
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
      {children}
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: "var(--clr-muted)",
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

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "var(--clr-muted)",
        marginTop: 6,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

export function FeedbackMessage({
  message,
}: {
  message: { text: string; ok: boolean } | null;
}) {
  if (!message) return null;
  const Icon = message.ok ? Check : AlertCircle;
  // Semi-transparent backgrounds overlay the card surface — works on both
  // light and dark themes without needing theme-specific overrides.
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 10,
        background: message.ok ? "rgba(34,160,107,0.12)" : "rgba(239,68,68,0.12)",
        color: message.ok ? "var(--success)" : "var(--danger)",
        fontSize: 13,
        marginTop: 18,
        border: `1px solid ${message.ok ? "rgba(34,160,107,0.3)" : "rgba(239,68,68,0.3)"}`,
        fontWeight: 500,
      }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span>{message.text}</span>
    </div>
  );
}

// Inputs use surface-subtle (not surface-card) so they contrast with the
// enclosing card background in both light and dark themes. On light the
// difference is subtle (#fafafa vs white); on dark the input appears as a
// slightly lighter well sunken into the card.
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid var(--clr-divider-strong)",
  background: "var(--clr-surface-subtle)",
  color: "var(--clr-primary)",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  opacity: 0.65,
  cursor: "not-allowed",
};

export function primaryBtnStyle(disabled?: boolean): React.CSSProperties {
  return {
    padding: "10px 20px",
    borderRadius: 10,
    border: disabled ? "1px solid var(--clr-divider-strong)" : "none",
    background: disabled
      ? "var(--clr-surface-subtle)"
      : "var(--brand)",
    color: disabled ? "var(--clr-muted)" : "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 2px 8px rgba(53,126,146,0.35)",
    transition: "transform 0.1s, box-shadow 0.15s",
  };
}

export const ghostBtnStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "1px solid var(--clr-divider-strong)",
  background: "var(--clr-surface-subtle)",
  color: "var(--clr-secondary)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s",
};

export const dangerBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "none",
  background: "var(--danger)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
};

// ===========================================================================
// INTERNAL HELPERS
// ===========================================================================

function Avatar({ name }: { name: string }) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--brand), var(--brand-electric))",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 0.5,
        flexShrink: 0,
        boxShadow: "0 4px 14px rgba(53,126,146,0.45)",
      }}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  // Semi-transparent color pairs (rgba bg + var() fg) work on both themes.
  // Matches team-utils.ts conventions: owner = brand teal, admin = purple,
  // manager = neutral.
  const style = {
    owner: { bg: "rgba(53,126,146,0.18)", fg: "var(--brand)", border: "rgba(53,126,146,0.35)" },
    admin: { bg: "rgba(139,92,246,0.18)", fg: "var(--purple)", border: "rgba(139,92,246,0.35)" },
    manager: { bg: "rgba(107,114,128,0.2)", fg: "var(--clr-muted)", border: "rgba(107,114,128,0.35)" },
  }[role] || { bg: "rgba(107,114,128,0.2)", fg: "var(--clr-muted)", border: "rgba(107,114,128,0.35)" };

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.border}`,
        padding: "3px 10px",
        borderRadius: 999,
        textTransform: "capitalize",
        letterSpacing: "0.03em",
      }}
    >
      {role}
    </span>
  );
}

function Pill({
  variant,
  label,
}: {
  variant: "success" | "warning" | "danger" | "accent";
  label: string;
}) {
  const colors = {
    success: { bg: "rgba(34,160,107,0.15)", fg: "var(--success)", border: "rgba(34,160,107,0.3)" },
    warning: { bg: "rgba(224,148,34,0.15)", fg: "var(--warning)", border: "rgba(224,148,34,0.3)" },
    danger: { bg: "rgba(239,68,68,0.15)", fg: "var(--danger)", border: "rgba(239,68,68,0.3)" },
    accent: { bg: "rgba(139,92,246,0.15)", fg: "var(--purple)", border: "rgba(139,92,246,0.3)" },
  }[variant];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
        padding: "3px 10px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Check size={10} /> {label}
    </span>
  );
}

function MetaRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid var(--clr-divider)",
        fontSize: 13,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "var(--clr-muted)",
        }}
      >
        {icon}
        {label}
      </span>
      <span style={{ color: "var(--clr-primary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
