import { useState } from "react";
import { organizationsApi } from "@/lib/api/organizations";
import type { Organization } from "@/types/organizations";

export type OrganizationAddModalProps = {
  onClose: () => void;
  onCreated: () => void;
};

export function OrganizationAddModal({ onClose, onCreated }: OrganizationAddModalProps) {
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    slug: "",
    subscription_tier: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(id: string, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit() {
    const name = form.name.trim();
    const slug = form.slug.trim();
    const subscriptionTier = form.subscription_tier.trim();

    if (!name || !slug || !subscriptionTier) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Parameters<typeof organizationsApi.create>[0] = {
        name,
        slug,
        subscription_tier: subscriptionTier,
      };
      await organizationsApi.create(payload);
      onCreated();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[OrganizationAddModal] Failed to create organization", err);
      alert("Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay open "
      role="dialog"
      aria-label="Add organization"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "var(--sp-24) auto",
          maxHeight: "60vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="modal-header">
          <span className="modal-title">Add Organization</span>
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
            <div className="acm-section-label">Organization Details</div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">
                  Name <span className="acm-required">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Acme Accounting Ltd"
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateField("name", value);
                    if (!form.slug) {
                      updateField(
                        "slug",
                        value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-+|-+$/g, ""),
                      );
                    }
                  }}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">
                  Slug <span className="acm-required">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. acme-accounting"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                />
              </div>
            </div>

            <div className="acm-row-1 u-mt-20">
              <div className="acm-field">
                <label className="acm-label">
                  Subscription tier <span className="acm-required">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. standard, pro"
                  value={form.subscription_tier}
                  onChange={(e) => updateField("subscription_tier", e.target.value)}
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
              !form.name.trim() ||
              !form.slug.trim() ||
              !form.subscription_tier.trim()
            }
          >
            Add Organization
          </button>
        </div>
      </div>
    </div>
  );
}

