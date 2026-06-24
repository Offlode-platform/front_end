"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export const PORTAL_TOKEN_KEY = "offlode-portal-token";
export const PORTAL_PROFILE_KEY = "offlode-portal-profile";

/** Read the portal session token: URL ?token= first, then sessionStorage. */
export function usePortalToken(urlToken?: string | null): string | null | undefined {
  // undefined = still resolving, null = none found (redirect), string = ok
  const [token, setToken] = useState<string | null | undefined>(
    urlToken ? urlToken : undefined,
  );
  const router = useRouter();

  useEffect(() => {
    if (urlToken) {
      try {
        sessionStorage.setItem(PORTAL_TOKEN_KEY, urlToken);
      } catch {
        /* ignore */
      }
      setToken(urlToken);
      return;
    }
    try {
      const stored = sessionStorage.getItem(PORTAL_TOKEN_KEY);
      if (stored) {
        setToken(stored);
        return;
      }
    } catch {
      /* ignore */
    }
    setToken(null);
    router.replace("/portal/login");
  }, [urlToken, router]);

  return token;
}

export function portalLogout(router: ReturnType<typeof useRouter>) {
  try {
    sessionStorage.removeItem(PORTAL_TOKEN_KEY);
    sessionStorage.removeItem(PORTAL_PROFILE_KEY);
  } catch {
    /* ignore */
  }
  router.replace("/portal/login");
}

const NAV = [
  { href: "/portal", label: "Documents" },
  { href: "/portal/files", label: "My Files" },
  { href: "/portal/profile", label: "Profile" },
];

export function PortalShell({
  children,
  orgName,
  clientName,
}: {
  children: React.ReactNode;
  orgName?: string;
  clientName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSearchParams().get("token");

  // Fall back to a cached profile so the header/nav render instantly on tab
  // changes (no flash) before the page's own fetch resolves.
  const [cached, setCached] = useState<{ orgName?: string; clientName?: string }>({});
  useEffect(() => {
    if (orgName || clientName) {
      try {
        sessionStorage.setItem(
          PORTAL_PROFILE_KEY,
          JSON.stringify({ orgName, clientName }),
        );
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const raw = sessionStorage.getItem(PORTAL_PROFILE_KEY);
      if (raw) setCached(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [orgName, clientName]);

  const shownOrg = orgName || cached.orgName;
  const shownClient = clientName || cached.clientName;
  const initial = (shownClient || "?").trim().charAt(0).toUpperCase();

  // Keep the session token on tab links so client-side nav stays authenticated.
  const withToken = (href: string) => (token ? `${href}?token=${encodeURIComponent(token)}` : href);

  return (
    <div style={pageBg}>
      {/* Top bar */}
      <header style={topbar}>
        <div style={topbarInner}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              {shownOrg || "Document Portal"}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Offlode Portal
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {shownClient && (
              <span style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>
                {shownClient}
              </span>
            )}
            <div style={avatar} title={shownClient}>{initial}</div>
            <button type="button" onClick={() => portalLogout(router)} style={logoutBtn}>
              Sign out
            </button>
          </div>
        </div>
        {/* Nav tabs */}
        <nav style={navBar}>
          <div style={navInner}>
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={withToken(item.href)}
                  prefetch
                  style={{
                    ...navTab,
                    textDecoration: "none",
                    color: active ? "#357e92" : "#64748b",
                    borderBottom: active ? "2px solid #357e92" : "2px solid transparent",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 80px" }}>
        {children}
      </main>
    </div>
  );
}

const pageBg: React.CSSProperties = {
  // The global stylesheet locks `body { height:100vh; overflow:hidden }` for
  // the staff dashboard, so the portal owns its own scroll container here.
  height: "100vh",
  overflowY: "auto",
  background: "#f1f5f9",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  WebkitFontSmoothing: "antialiased",
  color: "#0f172a",
};

const topbar: React.CSSProperties = {
  background: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const topbarInner: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "14px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const avatar: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "#357e92",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
};

const logoutBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid #cbd5e1",
  color: "#475569",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const navBar: React.CSSProperties = {
  borderTop: "1px solid #f1f5f9",
};

const navInner: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "0 16px",
  display: "flex",
  gap: 8,
};

const navTab: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "12px 8px",
  fontSize: 14,
  cursor: "pointer",
};
