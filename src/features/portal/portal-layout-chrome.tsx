"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { portalApi } from "@/lib/api/portal-api";
import type { PortalProfile } from "@/types/portal";
import { PortalShell, usePortalToken, PORTAL_PROFILE_KEY } from "./portal-shared";

// Auth routes render WITHOUT the app chrome.
const BARE_ROUTES = ["/portal/login", "/portal/forgot-password", "/portal/reset-password"];

type PortalCtx = {
  token: string | null | undefined;
  profile: PortalProfile | null;
  refreshProfile: () => void;
};

const Ctx = createContext<PortalCtx>({ token: undefined, profile: null, refreshProfile: () => {} });

/** Pages call this to read the session token + profile without their own fetch. */
export function usePortalContext() {
  return useContext(Ctx);
}

export function PortalLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.includes(pathname || "");

  if (isBare) {
    // Login / forgot / reset — no chrome, no token gate.
    return <>{children}</>;
  }

  return <PortalAppChrome>{children}</PortalAppChrome>;
}

function PortalAppChrome({ children }: { children: React.ReactNode }) {
  const urlToken = useSearchParams().get("token");
  const token = usePortalToken(urlToken);
  const [profile, setProfile] = useState<PortalProfile | null>(null);

  // Load the profile ONCE for the whole portal app (chrome lives across tabs).
  useEffect(() => {
    if (!token) return;
    // Seed from cache so the header shows instantly.
    try {
      const raw = sessionStorage.getItem(PORTAL_PROFILE_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (c?.clientName) {
          setProfile((p) => p ?? ({
            client_id: "",
            name: c.clientName,
            email: null,
            phone: null,
            organization_name: c.orgName ?? "",
            notification_preferences: {},
            last_login_at: null,
          } as PortalProfile));
        }
      }
    } catch {
      /* ignore */
    }
    portalApi.getProfile(token).then((p) => {
      setProfile(p);
      try {
        sessionStorage.setItem(
          PORTAL_PROFILE_KEY,
          JSON.stringify({ orgName: p.organization_name, clientName: p.name }),
        );
      } catch {
        /* ignore */
      }
    }).catch(() => {});
  }, [token]);

  function refreshProfile() {
    if (!token) return;
    portalApi.getProfile(token).then(setProfile).catch(() => {});
  }

  return (
    <Ctx.Provider value={{ token, profile, refreshProfile }}>
      <PortalShell orgName={profile?.organization_name} clientName={profile?.name}>
        {children}
      </PortalShell>
    </Ctx.Provider>
  );
}
