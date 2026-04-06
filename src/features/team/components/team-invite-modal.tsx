"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api/users";
import { clientsApi } from "@/lib/api/clients-api";
import { clientAssignmentsApi } from "@/lib/api/client-assignments-api";
import type { ListedClient } from "@/types/clients";

export type TeamInviteModalProps = {
  organizationId: string;
  onClose: () => void;
  onCreated: (newUser: import("@/types/users").User) => void;
};

type InviteRole = "manager" | "admin";
type ClientVisibility = "all_clients" | "assigned_clients_only";

const ROLE_DESCS: Record<InviteRole, { title: string; text: string }> = {
  manager: {
    title: "Manager",
    text: "Access to assigned clients only. Can manage documents, calls, and invoices for their portfolio. Cannot access firm-wide reports or settings.",
  },
  admin: {
    title: "Admin",
    text: "Full access to all clients, reports, and settings. Can manage team members except the Owner.",
  },
};

function generateTempPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 16; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export function TeamInviteModal({
  organizationId,
  onClose,
  onCreated,
}: TeamInviteModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<InviteRole>("admin");
  const [clientVisibility, setClientVisibility] =
    useState<ClientVisibility>("all_clients");
  const [selectedClients, setSelectedClients] = useState<
    { id: string; name: string }[]
  >([]);
  const [clients, setClients] = useState<ListedClient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Load available clients on mount
  useEffect(() => {
    clientsApi.list().then(setClients).catch(() => {});
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, boolean> = {};
    if (!firstName.trim()) newErrors.firstName = true;
    if (!lastName.trim()) newErrors.lastName = true;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`;
      const password = generateTempPassword();

      const newUser = await usersApi.create({
        user: {
          email: email.trim(),
          name,
          role,
          organization_id: organizationId,
          password,
        },
        permissions:
          role === "manager"
            ? {
                client_visibility: clientVisibility,
                document_chasing: "full",
                upload_portal: "upload",
                ai_receptionist: "full",
                billing_module: "full",
                reporting:
                  clientVisibility === "all_clients" ? "firm_wide" : "own_only",
                firm_settings: "view_only",
                can_override_ai_validation: false,
                user_id: "",
              }
            : undefined,
      });

      // Assign selected clients
      if (selectedClients.length > 0) {
        try {
          await clientAssignmentsApi.bulkAssign({
            client_ids: selectedClients.map((c) => c.id),
            user_id: newUser.id,
          });
        } catch {
          console.error("[TeamInviteModal] Failed to assign clients");
        }
      }

      onCreated(newUser);
    } catch (err) {
      console.error("[TeamInviteModal] Failed to create user", err);
      alert("Failed to create team member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAddClient(e: React.ChangeEvent<HTMLSelectElement>) {
    const clientId = e.target.value;
    if (!clientId) return;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    if (selectedClients.some((c) => c.id === clientId)) return;
    setSelectedClients((prev) => [...prev, { id: client.id, name: client.name }]);
    e.target.value = "";
  }

  function handleRemoveClient(clientId: string) {
    setSelectedClients((prev) => prev.filter((c) => c.id !== clientId));
  }

  const roleDesc = ROLE_DESCS[role];

  return (
    <div
      className="modal-overlay open"
      role="dialog"
      aria-label="Invite team member"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        style={{ width: 480 }}
      >
        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">Invite Team Member</span>
          <button className="modal-close" type="button" onClick={onClose}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: "auto" }}>
          {/* Person section */}
          <div className="acm-step">
            <div className="acm-section-label">Person</div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">
                  First name <span className="acm-required">*</span>
                </label>
                <input
                  type="text"
                  className={`input${errors.firstName ? " acm-error" : ""}`}
                  placeholder="e.g. Sarah"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setErrors((prev) => ({ ...prev, firstName: false }));
                  }}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">
                  Last name <span className="acm-required">*</span>
                </label>
                <input
                  type="text"
                  className={`input${errors.lastName ? " acm-error" : ""}`}
                  placeholder="e.g. O'Brien"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErrors((prev) => ({ ...prev, lastName: false }));
                  }}
                />
              </div>
            </div>
            <div className="acm-row-1" style={{ marginTop: "var(--sp-12)" }}>
              <div className="acm-field">
                <label className="acm-label">
                  Email <span className="acm-required">*</span>
                </label>
                <input
                  type="email"
                  className={`input${errors.email ? " acm-error" : ""}`}
                  placeholder="e.g. sarah@company.co.uk"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: false }));
                  }}
                />
              </div>
            </div>
            <div className="acm-row-1" style={{ marginTop: "var(--sp-12)" }}>
              <div className="acm-field">
                <label className="acm-label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="e.g. 020 7946 0001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Role & Access section */}
          <div className="acm-step" style={{ marginTop: "var(--sp-20)" }}>
            <div className="acm-section-label">Role &amp; Access</div>

            {/* Role toggle */}
            <div className="evt-seg-group" style={{ marginBottom: "var(--sp-12)" }}>
              <button
                type="button"
                className={`evt-seg${role === "manager" ? " active" : ""}`}
                onClick={() => setRole("manager")}
              >
                Manager
              </button>
              <button
                type="button"
                className={`evt-seg${role === "admin" ? " active" : ""}`}
                onClick={() => setRole("admin")}
              >
                Admin
              </button>
            </div>

            {/* Role description */}
            <div className="inv-role-desc">
              <div className="inv-role-desc-title">{roleDesc.title}</div>
              <div className="inv-role-desc-text">{roleDesc.text}</div>
            </div>

            {/* Client visibility */}
            <div style={{ marginTop: "var(--sp-12)" }}>
              <div
                className="acm-label"
                style={{ marginBottom: "var(--sp-6)" }}
              >
                Client visibility
              </div>
              <div className="evt-seg-group">
                <button
                  type="button"
                  className={`evt-seg${clientVisibility === "all_clients" ? " active" : ""}`}
                  onClick={() => setClientVisibility("all_clients")}
                >
                  All clients
                </button>
                <button
                  type="button"
                  className={`evt-seg${clientVisibility === "assigned_clients_only" ? " active" : ""}`}
                  onClick={() => setClientVisibility("assigned_clients_only")}
                >
                  Assigned only
                </button>
              </div>
            </div>
          </div>

          {/* Assign Clients section */}
          <div className="acm-step" style={{ marginTop: "var(--sp-20)" }}>
            <div className="acm-section-label">Assign Clients</div>
            <select
              className="select"
              onChange={handleAddClient}
              defaultValue=""
            >
              <option value="" disabled>
                Select clients to assign...
              </option>
              {clients
                .filter((c) => !selectedClients.some((s) => s.id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            {selectedClients.length > 0 && (
              <div className="inv-assigned-chips">
                {selectedClients.map((c) => (
                  <div key={c.id} className="inv-assigned-chip">
                    {c.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveClient(c.id)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info box */}
          <div
            style={{
              marginTop: "var(--sp-20)",
              display: "flex",
              gap: "var(--sp-8)",
              padding: "var(--sp-12)",
              background: "rgba(53,126,146,0.04)",
              borderRadius: "var(--r-md)",
              border: "1px solid rgba(53,126,146,0.08)",
              fontSize: "var(--text-xs)",
              color: "var(--clr-muted)",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "var(--brand)", flexShrink: 0 }}>&#10022;</span>
            <span>
              A new account will be created with a temporary password. The team
              member will need to reset their password on first login.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div
            style={{
              flex: 1,
              fontSize: "var(--text-xs)",
              color: "var(--text-muted-lt)",
            }}
          >
            <span className="acm-required">*</span> Required fields
          </div>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !firstName.trim() ||
              !lastName.trim() ||
              !email.trim()
            }
          >
            {isSubmitting ? "Creating..." : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
