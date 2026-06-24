"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { portalApi } from "@/lib/api/portal-api";

// sessionStorage key the portal page reads to recover the client session.
export const PORTAL_TOKEN_KEY = "offlode-portal-token";

export function PortalLoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await portalApi.login({ email: email.trim(), password });
      try {
        sessionStorage.setItem(PORTAL_TOKEN_KEY, res.access_token);
      } catch {
        /* ignore storage errors */
      }
      // Carry the token in the URL so the portal bootstraps even if storage is blocked.
      router.replace(`/portal?token=${encodeURIComponent(res.access_token)}`);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Invalid email or password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={shell}>
      <div style={card}>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Offlode Document Portal</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
          Sign in
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
          Use the email and password your accountant sent you.
        </p>

        {error && (
          <div style={errorBox} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label style={label} htmlFor="portal-email">Email</label>
          <input
            id="portal-email"
            type="email"
            autoComplete="email"
            style={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label style={label} htmlFor="portal-password">Password</label>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              id="portal-password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              style={{ ...input, marginBottom: 0, paddingRight: 64 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              style={eyeBtn}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => router.push("/portal/forgot-password")}
              style={linkBtn}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 20, lineHeight: 1.6 }}>
          Trouble signing in? Contact your accountant for help.
        </p>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  // Own scroll container (global body is height:100vh/overflow:hidden).
  height: "100vh",
  overflowY: "auto",
  background: "#f9fafb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 16px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 400,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "32px 28px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  margin: "0 0 6px",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 13px",
  fontSize: 15,
  color: "#0f172a",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  marginBottom: 16,
  outline: "none",
};

const eyeBtn: React.CSSProperties = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "#357e92",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  padding: "4px 6px",
};

const linkBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#357e92",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  background: "#357e92",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "13px 16px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  minHeight: 48,
};

const errorBox: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  marginBottom: 18,
  lineHeight: 1.5,
};
