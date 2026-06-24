"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { portalApi } from "@/lib/api/portal-api";

export function PortalForgotPasswordView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await portalApi.forgotPassword(email.trim());
    } catch {
      /* always show the same success message (no enumeration) */
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <div style={shell}>
      <div style={card}>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Offlode Document Portal</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
          Forgot password
        </h1>

        {sent ? (
          <>
            <p style={{ fontSize: 14, color: "#475569", margin: "0 0 24px", lineHeight: 1.6 }}>
              If an account exists for <strong>{email}</strong>, we&apos;ve emailed a link to reset
              your password. It expires in 60 minutes.
            </p>
            <button type="button" style={primaryBtn} onClick={() => router.push("/portal/login")}>
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "#475569", margin: "0 0 24px", lineHeight: 1.6 }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} noValidate>
              <label style={label} htmlFor="fp-email">Email</label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                style={input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <button type="submit" style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <button type="button" onClick={() => router.push("/portal/login")} style={linkBtn}>
                Back to sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const shell: React.CSSProperties = { height: "100vh", overflowY: "auto", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" };
const card: React.CSSProperties = { width: "100%", maxWidth: 400, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };
const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 6px" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", fontSize: 15, color: "#0f172a", border: "1px solid #d1d5db", borderRadius: 10, marginBottom: 16, outline: "none" };
const primaryBtn: React.CSSProperties = { width: "100%", background: "#357e92", color: "#fff", border: "none", borderRadius: 10, padding: "13px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 48 };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#357e92", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 };
