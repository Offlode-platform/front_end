"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { portalApi } from "@/lib/api/portal-api";
import { PORTAL_TOKEN_KEY } from "./portal-shared";

export function PortalResetPasswordView() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing its token. Please use the link from your email.");
      return;
    }
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await portalApi.resetPassword(token, pw);
      try {
        sessionStorage.setItem(PORTAL_TOKEN_KEY, res.access_token);
      } catch {
        /* ignore */
      }
      router.replace(`/portal?token=${encodeURIComponent(res.access_token)}`);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "This reset link is invalid or has expired. Please request a new one.");
      setLoading(false);
    }
  }

  return (
    <div style={shell}>
      <div style={card}>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Offlode Document Portal</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
          Set a new password
        </h1>
        <p style={{ fontSize: 14, color: "#475569", margin: "0 0 24px", lineHeight: 1.6 }}>
          Choose a new password for your portal account.
        </p>

        {error && <div style={errorBox} role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label style={label} htmlFor="rp-pw">New password</label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              id="rp-pw"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              style={{ ...input, marginBottom: 0, paddingRight: 64 }}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              disabled={loading}
              required
            />
            <button type="button" onClick={() => setShowPw((s) => !s)} style={eyeBtn} aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          <label style={label} htmlFor="rp-confirm">Confirm new password</label>
          <input
            id="rp-confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            style={input}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            required
          />

          <button type="submit" style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Saving…" : "Reset password & sign in"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <button type="button" onClick={() => router.push("/portal/login")} style={linkBtn}>
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = { height: "100vh", overflowY: "auto", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" };
const card: React.CSSProperties = { width: "100%", maxWidth: 400, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };
const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 6px" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", fontSize: 15, color: "#0f172a", border: "1px solid #d1d5db", borderRadius: 10, marginBottom: 16, outline: "none" };
const eyeBtn: React.CSSProperties = { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#357e92", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 6px" };
const primaryBtn: React.CSSProperties = { width: "100%", background: "#357e92", color: "#fff", border: "none", borderRadius: 10, padding: "13px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 48 };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#357e92", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 };
const errorBox: React.CSSProperties = { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 18, lineHeight: 1.5 };
