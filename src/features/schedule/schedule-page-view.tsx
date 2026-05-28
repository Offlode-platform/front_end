"use client";

import { useEffect, useState, useCallback } from "react";
import { clientsApi } from "@/lib/api/clients-api";
import { chasesApi } from "@/lib/api/chases-api";
import type { ListedClient } from "@/types/clients";
import type { ChaseScheduleConfig } from "@/types/chases";

// ── types ──────────────────────────────────────────────────────────────────

type ToastKind = "success" | "error";
type Toast = { id: number; kind: ToastKind; message: string };

type EditingRow = {
  clientId: string;
  frequencyDays: number;
  escalationDays: number;
  chaseEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
};

// ── helpers ────────────────────────────────────────────────────────────────

function isPaused(client: ListedClient): boolean {
  if (!client.chase_paused_until) return false;
  return new Date(client.chase_paused_until) > new Date();
}

function pauseLabel(client: ListedClient): string {
  if (!client.chase_paused_until) return "";
  const d = new Date(client.chase_paused_until);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── escalation timeline sub-component ─────────────────────────────────────

function EscalationTimeline({
  frequencyDays,
  escalationDays,
}: {
  frequencyDays: number;
  escalationDays: number;
}) {
  const steps = [
    { day: 0, label: "Email", color: "#2563eb", icon: "✉" },
    { day: frequencyDays, label: `Reminder (day ${frequencyDays})`, color: "#7c3aed", icon: "✉" },
    { day: frequencyDays + escalationDays, label: `SMS (day ${frequencyDays + escalationDays})`, color: "#d97706", icon: "📱" },
    { day: frequencyDays + escalationDays * 2, label: `WhatsApp (day ${frequencyDays + escalationDays * 2})`, color: "#16a34a", icon: "💬" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "8px 0" }}>
      {steps.map((step, i) => (
        <div key={step.day} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: step.color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
            }}>
              {step.icon}
            </div>
            <div style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap", textAlign: "center", maxWidth: 80 }}>
              {step.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: "#e5e7eb", margin: "0 4px", marginBottom: 20 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── number stepper ─────────────────────────────────────────────────────────

function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 90,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          style={stepperBtn}
          aria-label={`Decrease ${label}`}
        >−</button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= min && n <= max) onChange(n);
          }}
          style={{
            width: 52,
            textAlign: "center",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: "4px 6px",
            fontSize: 13,
            fontWeight: 600,
            color: "#111827",
          }}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          style={stepperBtn}
          aria-label={`Increase ${label}`}
        >+</button>
        <span style={{ fontSize: 12, color: "#6b7280" }}>days</span>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function SchedulePageView() {
  const [clients, setClients] = useState<ListedClient[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Default config for the whole org (editable at top)
  const [orgDefaults, setOrgDefaults] = useState({
    frequencyDays: 7,
    escalationDays: 3,
  });
  const [savingDefaults, setSavingDefaults] = useState(false);

  function pushToast(kind: ToastKind, message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientsApi.list();
      setClients(data);
      // Seed org defaults from the first active client that has chase enabled
      const seed = data.find((c) => c.chase_enabled && c.is_active);
      if (seed) {
        setOrgDefaults({
          frequencyDays: seed.chase_frequency_days ?? 7,
          escalationDays: seed.escalation_days ?? 3,
        });
      }
    } catch {
      pushToast("error", "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadClients(); }, [loadClients]);

  function startEditing(client: ListedClient) {
    setEditingRow({
      clientId: client.id,
      frequencyDays: client.chase_frequency_days ?? orgDefaults.frequencyDays,
      escalationDays: client.escalation_days ?? orgDefaults.escalationDays,
      chaseEnabled: client.chase_enabled ?? true,
      smsEnabled: true,
      whatsappEnabled: true,
    });
  }

  function cancelEditing() {
    setEditingRow(null);
  }

  async function saveRow(clientId: string) {
    if (!editingRow || editingRow.clientId !== clientId) return;
    setSavingId(clientId);
    try {
      const config: ChaseScheduleConfig = {
        client_id: clientId,
        frequency_days: editingRow.frequencyDays,
        escalation_days: editingRow.escalationDays,
        enabled: editingRow.chaseEnabled,
        sms_enabled: editingRow.smsEnabled,
        whatsapp_enabled: editingRow.whatsappEnabled,
      };
      await chasesApi.configure(clientId, config);
      // Also update the client record
      await clientsApi.update(clientId, {
        chase_enabled: editingRow.chaseEnabled,
        chase_frequency_days: editingRow.frequencyDays,
        escalation_days: editingRow.escalationDays,
      });
      setClients((prev) =>
        prev
          ? prev.map((c) =>
              c.id === clientId
                ? {
                    ...c,
                    chase_enabled: editingRow.chaseEnabled,
                    chase_frequency_days: editingRow.frequencyDays,
                    escalation_days: editingRow.escalationDays,
                  }
                : c,
            )
          : prev,
      );
      setEditingRow(null);
      pushToast("success", "Chase schedule updated.");
    } catch {
      pushToast("error", "Failed to save schedule.");
    } finally {
      setSavingId(null);
    }
  }

  async function togglePause(client: ListedClient) {
    setSavingId(client.id);
    try {
      if (isPaused(client)) {
        await chasesApi.resume(client.id);
        setClients((prev) =>
          prev
            ? prev.map((c) => (c.id === client.id ? { ...c, chase_paused_until: "" } : c))
            : prev,
        );
        pushToast("success", `Resumed chasing for ${client.name}.`);
      } else {
        // Pause for 30 days by default
        const until = new Date();
        until.setDate(until.getDate() + 30);
        await chasesApi.pause(client.id, until.toISOString());
        setClients((prev) =>
          prev
            ? prev.map((c) =>
                c.id === client.id ? { ...c, chase_paused_until: until.toISOString() } : c,
              )
            : prev,
        );
        pushToast("success", `Paused chasing for ${client.name} for 30 days.`);
      }
    } catch {
      pushToast("error", "Failed to update pause state.");
    } finally {
      setSavingId(null);
    }
  }

  async function applyDefaultsToAll() {
    if (!clients) return;
    setSavingDefaults(true);
    const activeClients = clients.filter((c) => c.chase_enabled && c.is_active);
    let successCount = 0;
    for (const client of activeClients) {
      try {
        await chasesApi.configure(client.id, {
          client_id: client.id,
          frequency_days: orgDefaults.frequencyDays,
          escalation_days: orgDefaults.escalationDays,
          enabled: true,
        });
        await clientsApi.update(client.id, {
          chase_frequency_days: orgDefaults.frequencyDays,
          escalation_days: orgDefaults.escalationDays,
        });
        successCount++;
      } catch {
        // continue with remaining clients
      }
    }
    setClients((prev) =>
      prev
        ? prev.map((c) =>
            c.chase_enabled && c.is_active
              ? {
                  ...c,
                  chase_frequency_days: orgDefaults.frequencyDays,
                  escalation_days: orgDefaults.escalationDays,
                }
              : c,
          )
        : prev,
    );
    setSavingDefaults(false);
    pushToast("success", `Applied defaults to ${successCount} clients.`);
  }

  const filteredClients = (clients ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const totalActive = (clients ?? []).filter((c) => c.chase_enabled && c.is_active).length;
  const totalPaused = (clients ?? []).filter((c) => isPaused(c)).length;
  const totalDisabled = (clients ?? []).filter((c) => !c.chase_enabled).length;

  return (
    <div className="page active" id="page-schedule" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Page header */}
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div className="page-bar-left">
          <div>
            <div className="pg-title">Chase Schedule</div>
            <div className="pg-subtitle">
              Configure when and how clients are chased for missing documents.
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-24)" }}>

        {/* Summary stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Active", value: totalActive, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Paused", value: totalPaused, color: "#d97706", bg: "#fffbeb" },
            { label: "Disabled", value: totalDisabled, color: "#6b7280", bg: "#f9fafb" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: stat.bg,
              border: `1px solid ${stat.color}22`,
              borderRadius: 10,
              padding: "12px 20px",
              minWidth: 120,
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Organisation-level defaults */}
        <div style={{
          background: "var(--clr-surface-card, #fff)",
          border: "1px solid var(--clr-border, #e5e7eb)",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--clr-primary, #111827)", marginBottom: 4 }}>
                Organisation defaults
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                Set the default chase cadence. Apply to all active clients at once.
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
                <NumberStepper
                  label="Initial chase after"
                  value={orgDefaults.frequencyDays}
                  onChange={(v) => setOrgDefaults((prev) => ({ ...prev, frequencyDays: v }))}
                />
                <NumberStepper
                  label="Escalation interval"
                  value={orgDefaults.escalationDays}
                  onChange={(v) => setOrgDefaults((prev) => ({ ...prev, escalationDays: v }))}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={savingDefaults}
                  onClick={applyDefaultsToAll}
                >
                  {savingDefaults ? "Applying…" : "Apply to all clients"}
                </button>
              </div>
            </div>
            <div style={{ minWidth: 340, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", marginBottom: 8 }}>
                Escalation timeline preview
              </div>
              <EscalationTimeline
                frequencyDays={orgDefaults.frequencyDays}
                escalationDays={orgDefaults.escalationDays}
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              maxWidth: 320,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              color: "#111827",
              outline: "none",
            }}
          />
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Client table */}
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
            Loading clients…
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{
            padding: 48,
            textAlign: "center",
            background: "var(--clr-surface-card, #fff)",
            border: "1px solid var(--clr-border, #e5e7eb)",
            borderRadius: 12,
            color: "#6b7280",
            fontSize: 14,
          }}>
            No clients found.
          </div>
        ) : (
          <div style={{
            background: "var(--clr-surface-card, #fff)",
            border: "1px solid var(--clr-border, #e5e7eb)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{ ...tableRow, background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ ...tableCell, flex: 2, fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Client</div>
              <div style={{ ...tableCell, flex: 1, fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</div>
              <div style={{ ...tableCell, flex: 2, fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Schedule</div>
              <div style={{ ...tableCell, flex: 2, fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Escalation preview</div>
              <div style={{ ...tableCell, width: 160, fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</div>
            </div>

            {filteredClients.map((client, i) => {
              const isEditing = editingRow?.clientId === client.id;
              const paused = isPaused(client);
              const isSaving = savingId === client.id;
              const isLast = i === filteredClients.length - 1;

              const freqDays = isEditing
                ? editingRow.frequencyDays
                : (client.chase_frequency_days ?? orgDefaults.frequencyDays);
              const escalDays = isEditing
                ? editingRow.escalationDays
                : (client.escalation_days ?? orgDefaults.escalationDays);

              return (
                <div key={client.id}>
                  {/* Main row */}
                  <div style={{ ...tableRow, borderBottom: isEditing || !isLast ? "1px solid #f3f4f6" : "none" }}>
                    {/* Client name */}
                    <div style={{ ...tableCell, flex: 2 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "#111827" }}>{client.name}</div>
                      {client.email && (
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                          {client.email}
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <div style={{ ...tableCell, flex: 1 }}>
                      {!client.chase_enabled ? (
                        <span style={badge("#6b7280", "#f9fafb")}>Disabled</span>
                      ) : paused ? (
                        <div>
                          <span style={badge("#d97706", "#fffbeb")}>Paused</span>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                            until {pauseLabel(client)}
                          </div>
                        </div>
                      ) : (
                        <span style={badge("#16a34a", "#f0fdf4")}>Active</span>
                      )}
                    </div>

                    {/* Schedule summary */}
                    <div style={{ ...tableCell, flex: 2 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <NumberStepper
                              label="First chase"
                              value={editingRow.frequencyDays}
                              onChange={(v) =>
                                setEditingRow((prev) => prev ? { ...prev, frequencyDays: v } : prev)
                              }
                            />
                            <NumberStepper
                              label="Escalation interval"
                              value={editingRow.escalationDays}
                              onChange={(v) =>
                                setEditingRow((prev) => prev ? { ...prev, escalationDays: v } : prev)
                              }
                            />
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            <label style={toggleLabel}>
                              <input
                                type="checkbox"
                                checked={editingRow.chaseEnabled}
                                onChange={(e) =>
                                  setEditingRow((prev) => prev ? { ...prev, chaseEnabled: e.target.checked } : prev)
                                }
                                style={{ marginRight: 4 }}
                              />
                              <span style={{ fontSize: 12, color: "#374151" }}>Chase enabled</span>
                            </label>
                            <label style={toggleLabel}>
                              <input
                                type="checkbox"
                                checked={editingRow.smsEnabled}
                                onChange={(e) =>
                                  setEditingRow((prev) => prev ? { ...prev, smsEnabled: e.target.checked } : prev)
                                }
                                style={{ marginRight: 4 }}
                              />
                              <span style={{ fontSize: 12, color: "#374151" }}>SMS</span>
                            </label>
                            <label style={toggleLabel}>
                              <input
                                type="checkbox"
                                checked={editingRow.whatsappEnabled}
                                onChange={(e) =>
                                  setEditingRow((prev) => prev ? { ...prev, whatsappEnabled: e.target.checked } : prev)
                                }
                                style={{ marginRight: 4 }}
                              />
                              <span style={{ fontSize: 12, color: "#374151" }}>WhatsApp</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 13, color: "#374151" }}>
                            Every <strong>{freqDays}d</strong>, escalate after <strong>{escalDays}d</strong>
                          </div>
                          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                            Email → SMS → WhatsApp
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline preview */}
                    <div style={{ ...tableCell, flex: 2 }}>
                      <EscalationTimeline frequencyDays={freqDays} escalationDays={escalDays} />
                    </div>

                    {/* Actions */}
                    <div style={{ ...tableCell, width: 160, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={isSaving}
                            onClick={() => saveRow(client.id)}
                          >
                            {isSaving ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={isSaving}
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={isSaving}
                            onClick={() => startEditing(client)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${paused ? "btn-ghost" : "btn-ghost"}`}
                            disabled={isSaving || !client.chase_enabled}
                            onClick={() => togglePause(client)}
                            title={paused ? "Resume chasing" : "Pause chasing for 30 days"}
                          >
                            {isSaving ? "…" : paused ? "Resume" : "Pause"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.kind}`}>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── style constants ────────────────────────────────────────────────────────

const tableRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  padding: "14px 20px",
  gap: 12,
  minHeight: 56,
};

const tableCell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
};

function badge(color: string, bg: string): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
    color,
    background: bg,
    border: `1px solid ${color}33`,
  };
}

const stepperBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#f9fafb",
  color: "#374151",
  fontSize: 16,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  padding: 0,
};

const toggleLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
};
