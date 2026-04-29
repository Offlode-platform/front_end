"use client";

import { useState } from "react";
import { clientsApi } from "@/lib/api/clients-api";
import { chasesApi } from "@/lib/api/chases-api";
import type { ListedClient, UpdateClientRequest } from "@/types/clients";

type Props = {
  client: ListedClient;
  onUpdated: (updated: ListedClient) => void;
};

export function WorkspaceSettingsTab({ client, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [chaseEnabled, setChaseEnabled] = useState(client.chase_enabled);
  const [frequencyDays, setFrequencyDays] = useState(client.chase_frequency_days);
  const [escalationDays, setEscalationDays] = useState(client.escalation_days);
  const [vatEnabled, setVatEnabled] = useState(client.vat_tracking_enabled);
  const [isVip, setIsVip] = useState(client.is_vip ?? false);
  const [dirty, setDirty] = useState(false);
  const [pauseMsg, setPauseMsg] = useState<string | null>(null);

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates: UpdateClientRequest = {};
      if (chaseEnabled !== client.chase_enabled) updates.chase_enabled = chaseEnabled;
      if (frequencyDays !== client.chase_frequency_days) updates.chase_frequency_days = frequencyDays;
      if (escalationDays !== client.escalation_days) updates.escalation_days = escalationDays;
      if (vatEnabled !== client.vat_tracking_enabled) updates.vat_tracking_enabled = vatEnabled;
      if (isVip !== (client.is_vip ?? false)) updates.is_vip = isVip;

      if (Object.keys(updates).length > 0) {
        const updated = await clientsApi.update(client.id, updates);
        onUpdated({ ...client, ...updated });
      }

      // Also sync chase schedule config if chase fields changed
      const chaseChanged =
        chaseEnabled !== client.chase_enabled ||
        frequencyDays !== client.chase_frequency_days ||
        escalationDays !== client.escalation_days;
      if (chaseChanged) {
        await chasesApi.configure(client.id, {
          client_id: client.id,
          frequency_days: frequencyDays,
          escalation_days: escalationDays,
          enabled: chaseEnabled,
        });
      }

      setDirty(false);
    } catch {
      setPauseMsg("Failed to save settings.");
      setTimeout(() => setPauseMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setChaseEnabled(client.chase_enabled);
    setFrequencyDays(client.chase_frequency_days);
    setEscalationDays(client.escalation_days);
    setVatEnabled(client.vat_tracking_enabled);
    setIsVip(client.is_vip ?? false);
    setDirty(false);
  }

  async function handlePause() {
    setSaving(true);
    try {
      const pauseUntil = new Date(Date.now() + 7 * 86400000).toISOString();
      await chasesApi.pause(client.id, pauseUntil);
      const updated = await clientsApi.get(client.id);
      onUpdated({ ...client, ...updated });
      setPauseMsg("Chasing paused for 7 days.");
      setTimeout(() => setPauseMsg(null), 3000);
    } catch {
      setPauseMsg("Failed to pause chasing.");
      setTimeout(() => setPauseMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleResume() {
    setSaving(true);
    try {
      await chasesApi.resume(client.id);
      const updated = await clientsApi.get(client.id);
      onUpdated({ ...client, ...updated });
      setPauseMsg("Chasing resumed.");
      setTimeout(() => setPauseMsg(null), 3000);
    } catch {
      setPauseMsg("Failed to resume chasing.");
      setTimeout(() => setPauseMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  const isPaused = client.chase_paused_until && new Date(client.chase_paused_until) > new Date();

  return (
    <div className="ws-panel active">
      <div style={{ padding: "var(--sp-16)", display: "flex", flexDirection: "column", gap: "var(--sp-20)" }}>
        {/* Chase automation */}
        <div className="ws-section">
          <div className="ws-section-title">Chase Automation</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-12)", marginTop: "var(--sp-8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)" }}>Chasing enabled</span>
              <label className="ws-toggle">
                <input
                  type="checkbox"
                  checked={chaseEnabled}
                  onChange={(e) => { setChaseEnabled(e.target.checked); markDirty(); }}
                />
                <span className="ws-toggle-slider" />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)" }}>Frequency (days)</span>
              <input
                type="number"
                min={1}
                max={90}
                value={frequencyDays}
                onChange={(e) => { setFrequencyDays(Number(e.target.value)); markDirty(); }}
                style={{
                  width: 64,
                  padding: "var(--sp-4) var(--sp-8)",
                  border: "1px solid var(--clr-divider-strong)",
                  borderRadius: "var(--r-sm)",
                  fontSize: "var(--text-sm)",
                  textAlign: "center",
                  background: "var(--canvas-bg)",
                  color: "var(--clr-primary)",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)" }}>Escalation after (days)</span>
              <input
                type="number"
                min={7}
                max={90}
                value={escalationDays}
                onChange={(e) => { setEscalationDays(Number(e.target.value)); markDirty(); }}
                style={{
                  width: 64,
                  padding: "var(--sp-4) var(--sp-8)",
                  border: "1px solid var(--clr-divider-strong)",
                  borderRadius: "var(--r-sm)",
                  fontSize: "var(--text-sm)",
                  textAlign: "center",
                  background: "var(--canvas-bg)",
                  color: "var(--clr-primary)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Pause/Resume */}
        <div className="ws-section">
          <div className="ws-section-title">Pause Chasing</div>
          <div style={{ marginTop: "var(--sp-8)", display: "flex", gap: "var(--sp-8)", alignItems: "center" }}>
            {isPaused ? (
              <>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--warning)" }}>
                  Paused until {new Date(client.chase_paused_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleResume} disabled={saving}>
                  Resume
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handlePause} disabled={saving}>
                Pause for 7 days
              </button>
            )}
            {pauseMsg && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>{pauseMsg}</span>
            )}
          </div>
        </div>

        {/* VAT Tracking */}
        <div className="ws-section">
          <div className="ws-section-title">VAT Tracking</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--sp-8)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)" }}>VAT tracking enabled</span>
            <label className="ws-toggle">
              <input
                type="checkbox"
                checked={vatEnabled}
                onChange={(e) => { setVatEnabled(e.target.checked); markDirty(); }}
              />
              <span className="ws-toggle-slider" />
            </label>
          </div>
          {client.vat_period_end_date && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginTop: "var(--sp-8)" }}>
              VAT period end: {new Date(client.vat_period_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          )}
        </div>

        {/* VIP Status */}
        <div className="ws-section">
          <div className="ws-section-title">VIP Status</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--sp-8)" }}>
            <div>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--clr-secondary)" }}>Mark as VIP client</span>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
                VIP clients are starred in the workspace list and shown in the VIP filter.
              </div>
            </div>
            <label className="ws-toggle">
              <input
                type="checkbox"
                checked={isVip}
                onChange={(e) => { setIsVip(e.target.checked); markDirty(); }}
              />
              <span className="ws-toggle-slider" />
            </label>
          </div>
        </div>

        {/* Save bar */}
        {dirty && (
          <div style={{
            display: "flex",
            gap: "var(--sp-8)",
            justifyContent: "flex-end",
            padding: "var(--sp-12) 0",
            borderTop: "1px solid var(--clr-divider)",
          }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscard} disabled={saving}>
              Discard
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
