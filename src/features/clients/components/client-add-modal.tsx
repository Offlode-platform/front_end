import { useState } from "react";
import { clientsApi } from "@/lib/api/clients-api";
import type { ListedClient } from "@/types/clients";

export type ClientAddModalProps = {
  onClose: () => void;
  onSaveDraft: (draft: { id: string; name: string }) => void;
  onCreated: (client: ListedClient) => void;
  organizationId?: string;
};

export function ClientAddModal({
  onClose,
  onSaveDraft,
  onCreated,
  organizationId,
}: ClientAddModalProps) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    const localIsoMinute = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return {
      chase_enabled: "true",
      chase_frequency_days: "7",
      escalation_days: "14",
      vat_tracking_enabled: "false",
      vat_period_end_date: isoDate,
      chase_paused_until: localIsoMinute,
    };
  });

  function updateField(id: string, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  function handleSaveDraft() {
    const name = form.name?.trim() || "Untitled client";
    const id = `${Date.now()}`;
    onSaveDraft({ id, name });
    onClose();
  }

  async function handleSubmit() {
    // Basic guard + debug log so we can see when submit fires
    console.log("[ClientAddModal] Submit clicked", { form, organizationId });

    const legalName = form.name?.trim();
    const email = form.email?.trim();
    if (!legalName || !email) {
      onClose();
      return;
    }

    if (!organizationId) {
      console.error(
        "[ClientAddModal] Cannot create client – missing organizationId",
      );
      alert("Cannot create client: no organization is selected.");
      return;
    }

    const today = new Date();
    const payload: Parameters<typeof clientsApi.create>[0] = {
      name: legalName,
      email,
      phone: form.phone?.trim() ?? "",
      organization_id: organizationId,
      xero_contact_id: form.xero_contact_id?.trim() ?? "",
      xero_files_inbox_email: form.xero_files_inbox_email?.trim() ?? "",
      chase_enabled: form.chase_enabled === "false" ? false : true,
      chase_frequency_days: form.chase_frequency_days
        ? Number(form.chase_frequency_days)
        : 7,
      escalation_days: form.escalation_days
        ? Number(form.escalation_days)
        : 14,
      vat_tracking_enabled: form.vat_tracking_enabled === "true",
      vat_period_end_date:
        form.vat_period_end_date?.trim() ?? today.toISOString().slice(0, 10),
      chase_paused_until:
        form.chase_paused_until?.trim() ?? today.toISOString(),
    };
    console.log("[ClientAddModal] Creating client with payload", payload);
    try {
      const created = await clientsApi.create(payload);
      console.log("[ClientAddModal] Client created successfully", created);
      onCreated(created);
    } catch (err) {
      console.error("[ClientAddModal] Failed to create client", err);
      alert("Failed to create client. Check the console for details.");
      return;
    }
    onClose();
  }

  return (
    <div
      className="modal-overlay open "
      role="dialog"
      aria-label="Add client"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        style={{
          width: "100%",
          maxWidth: 540,
          margin: "var(--sp-24) auto",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="modal-header">
          <span className="modal-title">Add Client</span>
          <button className="modal-close" type="button" onClick={onClose}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div
          className="modal-body"
          style={{
            overflowY: "auto",
          }}
        >
          <div className="acm-step">
            <div className="acm-section-label">Client Details</div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">
                  Name <span className="acm-required">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Westbrook Holdings Ltd"
                  value={form.name ?? ""}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">
                  Email <span className="acm-required">*</span>
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. accounts@westbrook.co.uk"
                  value={form.email ?? ""}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
            </div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="e.g. 020 8765 4321"
                  value={form.phone ?? ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Organization ID</label>
                <input
                  type="text"
                  className="input"
                  value={organizationId ?? ""}
                  disabled
                />
              </div>
            </div>

            <div className="acm-section-label u-mt-20">Xero</div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Xero contact ID</label>
                <input
                  type="text"
                  className="input"
                  value={form.xero_contact_id ?? ""}
                  onChange={(e) => updateField("xero_contact_id", e.target.value)}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Xero files inbox email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. files+123@xero.com"
                  value={form.xero_files_inbox_email ?? ""}
                  onChange={(e) =>
                    updateField("xero_files_inbox_email", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="acm-section-label u-mt-20">Chasing</div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Chase enabled</label>
                <select
                  className="select"
                  value={form.chase_enabled ?? "true"}
                  onChange={(e) => updateField("chase_enabled", e.target.value)}
                >
                  <option value="true">On</option>
                  <option value="false">Off</option>
                </select>
              </div>
              <div className="acm-field">
                <label className="acm-label">VAT tracking enabled</label>
                <select
                  className="select"
                  value={form.vat_tracking_enabled ?? "false"}
                  onChange={(e) =>
                    updateField("vat_tracking_enabled", e.target.value)
                  }
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Chase frequency (days)</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={form.chase_frequency_days ?? "7"}
                  onChange={(e) =>
                    updateField("chase_frequency_days", e.target.value)
                  }
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Escalation days</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={form.escalation_days ?? "14"}
                  onChange={(e) => updateField("escalation_days", e.target.value)}
                />
              </div>
            </div>

            <div className="acm-section-label u-mt-20">Dates</div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">VAT period end date</label>
                <input
                  type="date"
                  className="input"
                  value={form.vat_period_end_date ?? ""}
                  onChange={(e) =>
                    updateField("vat_period_end_date", e.target.value)
                  }
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Chase paused until</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.chase_paused_until ?? ""}
                  onChange={(e) =>
                    updateField("chase_paused_until", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
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
          >
            Cancel
          </button>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={handleSaveDraft}
          >
            Save Draft
          </button>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={handleSubmit}
            disabled={!form.name?.trim() || !form.email?.trim()}
          >
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}
