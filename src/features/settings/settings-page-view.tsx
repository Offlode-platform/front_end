"use client";

import { useEffect, useState } from "react";
import { User, Lock, Shield, Bell, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ProfileSection } from "./components/profile-section";
import { PasswordSection } from "./components/password-section";
import { TwoFactorSection } from "./components/two-factor-section";
import { NotificationsSection } from "./components/notifications-section";

type Tab = "profile" | "password" | "two-factor" | "notifications";

const TABS: {
  key: Tab;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}[] = [
  {
    key: "profile",
    label: "Profile",
    description: "Name & organization",
    icon: User,
    color: "#6366f1",
  },
  {
    key: "password",
    label: "Password",
    description: "Change sign-in password",
    icon: Lock,
    color: "#a855f7",
  },
  {
    key: "two-factor",
    label: "Two-Factor Auth",
    description: "Extra sign-in security",
    icon: Shield,
    color: "#22c55e",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Email preferences",
    icon: Bell,
    color: "#f59e0b",
  },
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

  const activeTab = TABS.find((t) => t.key === tab);

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
          <div>
            <div className="pg-title">Settings</div>
            <div className="pg-subtitle">
              Manage your profile, password, and security preferences.
            </div>
          </div>
        </div>
        <div className="page-bar-right" />
      </div>

      {/* Content area — using plain div instead of dash-content to control padding */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px 40px",
          minHeight: 0,
          background:
            "radial-gradient(1200px 500px at 50% -100px, rgba(139,92,246,0.06), transparent 70%)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* ===== Left sidebar nav ===== */}
          <aside
            style={{
              position: "sticky",
              top: 12,
              padding: 8,
              borderRadius: 14,
              background: "var(--clr-surface-card)",
              border: "1px solid var(--clr-divider)",
              boxShadow: "var(--shadow-rest)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                      gap: 12,
                      padding: "11px 12px",
                      borderRadius: 10,
                      border: active
                        ? `1px solid ${t.color}40`
                        : "1px solid transparent",
                      // Stronger tint so the active state reads well in dark mode
                      background: active
                        ? `linear-gradient(135deg, ${t.color}26, ${t.color}12)`
                        : "transparent",
                      color: "var(--clr-primary)",
                      fontSize: 14,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                      width: "100%",
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
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: active
                          ? `linear-gradient(135deg, ${t.color}, ${t.color}cc)`
                          : `${t.color}1f`,
                        color: active ? "#fff" : t.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
                        boxShadow: active ? `0 2px 6px ${t.color}50` : "none",
                      }}
                    >
                      <Icon size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: active ? 600 : 500,
                          fontSize: 13.5,
                          color: "var(--clr-primary)",
                        }}
                      >
                        {t.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--clr-muted)",
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.description}
                      </div>
                    </div>
                    {active && (
                      <ChevronRight
                        size={14}
                        color={t.color}
                        style={{ flexShrink: 0, opacity: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ===== Right content card ===== */}
          <div
            style={{
              padding: "28px 32px 32px",
              borderRadius: 14,
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
              </>
            )}
          </div>
        </div>

        {/* Subtle footer */}
        {activeTab && currentUser && (
          <div
            style={{
              maxWidth: 1100,
              margin: "24px auto 0",
              textAlign: "center",
              fontSize: 12,
              color: "var(--clr-muted)",
            }}
          >
            Changes are saved to your {currentUser.organization_name || "workspace"} profile.
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid var(--clr-divider)",
          borderTopColor: "var(--purple)",
          borderRadius: "50%",
          margin: "0 auto 16px",
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
