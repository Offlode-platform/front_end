"use client";

import { useEffect, useState } from "react";
import { User, Lock, Shield, Bell, Plug } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ProfileSection } from "./components/profile-section";
import { PasswordSection } from "./components/password-section";
import { TwoFactorSection } from "./components/two-factor-section";
import { NotificationsSection } from "./components/notifications-section";
import { IntegrationsTestSection } from "./components/integrations-test-section";

type Tab = "profile" | "password" | "two-factor" | "notifications" | "integrations";

const TABS: {
  key: Tab;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "password", label: "Password", icon: Lock },
  { key: "two-factor", label: "Two-Factor Auth", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "integrations", label: "Integrations", icon: Plug },
];

export function SettingsPageView() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    if (accessToken && !currentUser) {
      void loadCurrentUser();
    }
  }, [accessToken, currentUser, loadCurrentUser]);

  return (
    <div
      className="page active"
      id="page-settings"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Page bar */}
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div className="page-bar-left">
          <div className="pg-title">Settings</div>
        </div>
        <div className="page-bar-right" />
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 32px 48px",
          minHeight: 0,
          background: "var(--canvas-bg)",
        }}
      >
        <div
          style={{
            maxWidth: 1020,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "196px 1fr",
            gap: 20,
            alignItems: "flex-start",
          }}
        >
          {/* ===== Left nav ===== */}
          <aside style={{ position: "sticky", top: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.055em",
                textTransform: "uppercase",
                color: "var(--clr-muted)",
                padding: "0 8px 10px 14px",
              }}
            >
              Account
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "7px 10px 7px 14px",
                      borderRadius: 8,
                      border: "none",
                      position: "relative",
                      background: active
                        ? "rgba(53,126,146,0.08)"
                        : "transparent",
                      color: active
                        ? "var(--clr-primary)"
                        : "var(--clr-secondary)",
                      fontSize: 14,
                      fontWeight: active ? 500 : 400,
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      transition: "background 0.12s, color 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--clr-surface-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                      }
                    }}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: 16,
                          background: "var(--brand)",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}
                    <Icon
                      size={15}
                      style={{
                        flexShrink: 0,
                        opacity: active ? 0.85 : 0.45,
                        color: active ? "var(--brand)" : "inherit",
                        transition: "opacity 0.12s, color 0.12s",
                      }}
                    />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ===== Right content card ===== */}
          <div
            style={{
              padding: "24px 28px 28px",
              borderRadius: 12,
              background: "var(--clr-surface-card)",
              border: "1px solid var(--clr-divider)",
              boxShadow: "var(--shadow-rest)",
            }}
          >
            {!currentUser ? (
              <LoadingState />
            ) : (
              <>
                {tab === "profile" && <ProfileSection user={currentUser} />}
                {tab === "password" && <PasswordSection />}
                {tab === "two-factor" && <TwoFactorSection user={currentUser} />}
                {tab === "notifications" && (
                  <NotificationsSection user={currentUser} />
                )}
                {tab === "integrations" && <IntegrationsTestSection />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: "72px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 26,
          height: 26,
          border: "2px solid var(--clr-divider)",
          borderTopColor: "var(--brand)",
          borderRadius: "50%",
          margin: "0 auto 14px",
          animation: "settings-spin 0.7s linear infinite",
        }}
      />
      <div style={{ fontSize: 14, color: "var(--clr-muted)" }}>
        Loading your profile…
      </div>
      <style>{`@keyframes settings-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
