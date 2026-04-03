"use client";

import { useState } from "react";
import { clientsApi } from "@/lib/api/clients-api";
import type { ListedClient, UpdateClientRequest } from "@/types/clients";

type Props = {
  client: ListedClient;
  onUpdated: (updated: ListedClient) => void;
};

export function WorkspaceContactTab({ client, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);

  function startEdit() {
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const updates: UpdateClientRequest = {};
      if (name !== client.name) updates.name = name;
      if (email !== client.email) updates.email = email;
      if (phone !== client.phone) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        const updated = await clientsApi.update(client.id, updates);
        onUpdated({ ...client, ...updated });
      }
      setEditing(false);
    } catch {
      // Error silently handled
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ws-panel active">
      <div style={{ padding: "var(--sp-20)", display: "flex", flexDirection: "column", gap: "var(--sp-20)" }}>
        {/* Contact info card */}
        <div style={{
          background: "var(--clr-surface-card)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--clr-divider)",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--sp-14) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
          }}>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)" }}>
              Contact Details
            </div>
            {!editing ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={startEdit}
                style={{ fontSize: "var(--text-xs)" }}
              >
                Edit
              </button>
            ) : (
              <div style={{ display: "flex", gap: "var(--sp-8)" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={saving} style={{ fontSize: "var(--text-xs)" }}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving} style={{ fontSize: "var(--text-xs)" }}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
          <div style={{ padding: "var(--sp-4) 0" }}>
            <FieldRow label="Name" value={client.name} editing={editing} editValue={name} onChange={setName} />
            <FieldRow label="Email" value={client.email || "—"} editing={editing} editValue={email} onChange={setEmail} type="email" />
            <FieldRow label="Phone" value={client.phone || "—"} editing={editing} editValue={phone} onChange={setPhone} type="tel" />
          </div>
        </div>

        {/* Assignment card */}
        <div style={{
          background: "var(--clr-surface-card)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--clr-divider)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "var(--sp-14) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
          }}>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)" }}>
              Assignment
            </div>
          </div>
          <div style={{ padding: "var(--sp-4) 0" }}>
            <FieldRow label="Manager" value={client.assigned_user_name || "Unassigned"} editing={false} editValue="" onChange={() => {}} />
            <FieldRow label="Status" value={client.is_active ? "Active" : "Inactive"} editing={false} editValue="" onChange={() => {}} />
          </div>
        </div>

        {/* Integration card */}
        <div style={{
          background: "var(--clr-surface-card)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--clr-divider)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "var(--sp-14) var(--sp-16)",
            borderBottom: "1px solid var(--clr-divider)",
          }}>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-muted)" }}>
              Xero Integration
            </div>
          </div>
          <div style={{ padding: "var(--sp-4) 0" }}>
            <FieldRow
              label="Connected"
              value={client.xero_contact_id ? "Yes" : "No"}
              editing={false}
              editValue=""
              onChange={() => {}}
            />
            {client.xero_files_inbox_email && (
              <FieldRow label="Files inbox" value={client.xero_files_inbox_email} editing={false} editValue="" onChange={() => {}} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  editing,
  editValue,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editing: boolean;
  editValue: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--sp-10) var(--sp-16)",
      borderBottom: "1px solid var(--clr-divider)",
      minHeight: 44,
    }}>
      <span style={{
        fontSize: "var(--text-sm)",
        color: "var(--clr-muted)",
        flexShrink: 0,
        width: 100,
      }}>
        {label}
      </span>
      {editing ? (
        <input
          type={type}
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: "var(--sp-6) var(--sp-10)",
            border: "1px solid var(--clr-divider-strong)",
            borderRadius: "var(--r-md)",
            fontSize: "var(--text-sm)",
            background: "var(--canvas-bg)",
            color: "var(--clr-primary)",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
      ) : (
        <span style={{
          fontSize: "var(--text-sm)",
          color: "var(--clr-primary)",
          fontWeight: "var(--fw-medium)",
          textAlign: "right",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {value}
        </span>
      )}
    </div>
  );
}
