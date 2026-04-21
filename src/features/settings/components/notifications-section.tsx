"use client";

import { useState } from "react";
import {
  Bell,
  MessageSquare,
  ShieldAlert,
  FileSpreadsheet,
  CalendarDays,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import type { CurrentUser } from "@/types/auth";
import {
  SectionHeader,
  FeedbackMessage,
  primaryBtnStyle,
  ghostBtnStyle,
} from "./profile-section";

type PrefKey =
  | "email_chase_events"
  | "email_client_questions"
  | "email_document_quarantine"
  | "email_import_completed"
  | "email_weekly_digest";

// Unified on the brand accent (#357e92) — matches the single-accent scheme
// used by dashboard / team / help pages. The icon is the semantic signal
// (ShieldAlert for quarantine), so the toggle colour stays brand across the
// whole list. Hex kept so `${color}26` opacity suffixes still parse.
const BRAND = "#357e92";
const PREFS: {
  key: PrefKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}[] = [
  {
    key: "email_chase_events",
    label: "Chase activity",
    description: "When a chase is sent, delivered, bounced, or clicked.",
    icon: Bell,
    color: BRAND,
  },
  {
    key: "email_client_questions",
    label: "Client questions",
    description:
      "When a client asks a question or marks a document as \"can't provide\".",
    icon: MessageSquare,
    color: BRAND,
  },
  {
    key: "email_document_quarantine",
    label: "Document quarantine",
    description: "When an uploaded document is flagged by virus scanning.",
    icon: ShieldAlert,
    color: BRAND,
  },
  {
    key: "email_import_completed",
    label: "Import completed",
    description: "When a CSV import or Xero sync finishes processing.",
    icon: FileSpreadsheet,
    color: BRAND,
  },
  {
    key: "email_weekly_digest",
    label: "Weekly digest",
    description: "Summary of the week's activity every Monday morning.",
    icon: CalendarDays,
    color: BRAND,
  },
];

function asBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v == null) return fallback;
  return Boolean(v);
}

export function NotificationsSection({ user }: { user: CurrentUser }) {
  const updateCurrentUser = useAuthStore((s) => s.updateCurrentUser);
  const initial = user.notification_preferences || {};

  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(() => ({
    email_chase_events: asBool(initial.email_chase_events, true),
    email_client_questions: asBool(initial.email_client_questions, true),
    email_document_quarantine: asBool(initial.email_document_quarantine, true),
    email_import_completed: asBool(initial.email_import_completed, false),
    email_weekly_digest: asBool(initial.email_weekly_digest, false),
  }));
  const [initialPrefs] = useState(prefs);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  const dirty = Object.keys(prefs).some(
    (k) => prefs[k as PrefKey] !== initialPrefs[k as PrefKey],
  );
  const enabledCount = Object.values(prefs).filter(Boolean).length;

  function toggle(key: PrefKey) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setMessage(null);
  }

  function toggleAll(value: boolean) {
    setPrefs({
      email_chase_events: value,
      email_client_questions: value,
      email_document_quarantine: value,
      email_import_completed: value,
      email_weekly_digest: value,
    });
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await updateCurrentUser({ notification_preferences: prefs });
      setMessage({ text: "Preferences saved.", ok: true });
    } catch (err) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;
      setMessage({ text: detail || "Failed to save preferences.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <SectionHeader
        title="Email Notifications"
        description="Choose which events trigger an email to your inbox. We'll only email you at your sign-in address."
      />

      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderRadius: 10,
          background:
            "linear-gradient(135deg, rgba(53,126,146,0.08), rgba(98,190,208,0.05))",
          border: "1px solid rgba(53,126,146,0.22)",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: "var(--clr-primary)" }}
          >
            {enabledCount} of {PREFS.length} enabled
          </div>
          <div style={{ fontSize: 12, color: "var(--clr-muted)", marginTop: 2 }}>
            Quickly enable or disable all notifications
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            style={{
              ...ghostBtnStyle,
              padding: "6px 12px",
              fontSize: 12,
            }}
          >
            Disable all
          </button>
          <button
            type="button"
            onClick={() => toggleAll(true)}
            style={{
              ...ghostBtnStyle,
              padding: "6px 12px",
              fontSize: 12,
              color: "var(--brand)",
              borderColor: "rgba(53,126,146,0.35)",
              background: "rgba(53,126,146,0.08)",
            }}
          >
            Enable all
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PREFS.map((pref) => {
          const Icon = pref.icon;
          const enabled = prefs[pref.key];
          return (
            <div
              key={pref.key}
              onClick={() => toggle(pref.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${
                  enabled ? `${pref.color}60` : "var(--clr-divider-strong)"
                }`,
                background: enabled
                  ? `linear-gradient(135deg, ${pref.color}14, ${pref.color}06)`
                  : "var(--clr-surface-card)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: enabled ? `${pref.color}26` : "var(--clr-surface-subtle)",
                  color: enabled ? pref.color : "var(--clr-muted)",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                <Icon size={17} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--clr-primary)",
                  }}
                >
                  {pref.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--clr-muted)",
                    marginTop: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {pref.description}
                </div>
              </div>

              {/* Toggle switch */}
              <div
                role="switch"
                aria-checked={enabled}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(pref.key);
                }}
                style={{
                  position: "relative",
                  width: 42,
                  height: 24,
                  borderRadius: 999,
                  background: enabled ? pref.color : "var(--clr-divider-strong)",
                  transition: "background 0.2s",
                  flexShrink: 0,
                  // Theme-agnostic: tinted glow on enabled, subtle inner depth
                  // on disabled (works on both light and dark surfaces).
                  boxShadow: enabled
                    ? `0 2px 8px ${pref.color}70`
                    : "inset 0 1px 2px rgba(0,0,0,0.15)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: enabled ? 20 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    // Thumb stays white on both themes — matches iOS/macOS
                    // native switch conventions.
                    background: "#ffffff",
                    transition: "left 0.2s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <FeedbackMessage message={message} />

      <div
        style={{
          marginTop: 24,
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          style={primaryBtnStyle(saving || !dirty)}
        >
          {saving ? "Saving…" : dirty ? "Save preferences" : "Saved"}
        </button>
      </div>
    </div>
  );
}
