"use client";

import { useEffect, useState } from "react";
import { portalApi } from "@/lib/api/portal-api";
import { usePortalContext } from "./portal-layout-chrome";

export function PortalProfileView() {
  const { token, profile, refreshProfile } = usePortalContext();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Seed the form from the shared profile once it loads.
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setPhone(profile.phone ?? "");
    setEmailNotif(profile.notification_preferences?.email !== false);
    setSmsNotif(profile.notification_preferences?.sms !== false);
  }, [profile]);

  async function saveProfile() {
    if (!token) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await portalApi.updateProfile(token, {
        name: name.trim(),
        phone: phone.trim(),
        notification_preferences: { email: emailNotif, sms: smsNotif },
      });
      refreshProfile();
      setProfileMsg("Saved.");
    } catch {
      setProfileMsg("Could not save. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (!token) return;
    setPwMsg(null);
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setSavingPw(true);
    try {
      await portalApi.changePassword(token, curPw, newPw);
      setPwMsg({ ok: true, text: "Password changed." });
      setCurPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPwMsg({ ok: false, text: detail || "Could not change password." });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <h1 style={h1}>Profile &amp; settings</h1>
      <p style={sub}>Manage your details and how {profile?.organization_name || "your accountant"} contacts you.</p>

      {/* Profile details */}
      <div style={card}>
        <div style={cardTitle}>Your details</div>

        <label style={label} htmlFor="pf-name">Name</label>
        <input id="pf-name" style={input} value={name} onChange={(e) => setName(e.target.value)} />

        <label style={label} htmlFor="pf-email">Email (login)</label>
        <input id="pf-email" style={{ ...input, background: "#f1f5f9", color: "#64748b" }} value={profile?.email ?? ""} readOnly disabled />
        <div style={hint}>To change your login email, contact your accountant.</div>

        <label style={label} htmlFor="pf-phone">Phone</label>
        <input id="pf-phone" style={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 020 7946 0001" />

        <div style={{ ...cardTitle, marginTop: 18 }}>Notifications</div>
        <label style={toggleRow}>
          <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
          <span>Email me about documents needed</span>
        </label>
        <label style={toggleRow}>
          <input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} />
          <span>Send me SMS / WhatsApp reminders</span>
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
          <button type="button" style={{ ...primaryBtn, opacity: savingProfile ? 0.7 : 1 }} disabled={savingProfile} onClick={saveProfile}>
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
          {profileMsg && <span style={{ fontSize: 13, color: "#15803d" }}>{profileMsg}</span>}
        </div>
      </div>

      {/* Change password */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={cardTitle}>Change password</div>

        <label style={label} htmlFor="pf-cur">Current password</label>
        <input id="pf-cur" type={showPw ? "text" : "password"} style={input} value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" />

        <label style={label} htmlFor="pf-new">New password</label>
        <input id="pf-new" type={showPw ? "text" : "password"} style={input} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />

        <label style={label} htmlFor="pf-confirm">Confirm new password</label>
        <input id="pf-confirm" type={showPw ? "text" : "password"} style={input} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", margin: "0 0 14px", cursor: "pointer" }}>
          <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
          <span>Show passwords</span>
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <button type="button" style={{ ...primaryBtn, opacity: savingPw ? 0.7 : 1 }} disabled={savingPw} onClick={savePassword}>
            {savingPw ? "Updating…" : "Update password"}
          </button>
          {pwMsg && <span style={{ fontSize: 13, color: pwMsg.ok ? "#15803d" : "#b91c1c" }}>{pwMsg.text}</span>}
        </div>
      </div>
    </>
  );
}

const h1: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" };
const sub: React.CSSProperties = { fontSize: 14, color: "#64748b", margin: "0 0 20px" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 20px" };
const cardTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", marginBottom: 14 };
const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#334155", margin: "0 0 6px" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 14, border: "1px solid #cbd5e1", borderRadius: 9, marginBottom: 14, outline: "none", color: "#0f172a" };
const hint: React.CSSProperties = { fontSize: 12, color: "#94a3b8", marginTop: -8, marginBottom: 14 };
const toggleRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#334155", padding: "6px 0", cursor: "pointer" };
const primaryBtn: React.CSSProperties = { background: "#357e92", color: "#fff", border: "none", borderRadius: 9, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
