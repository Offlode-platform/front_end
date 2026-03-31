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
  const [form, setForm] = useState<Record<string, string>>({});

  function updateField(id: string, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  function handleSaveDraft() {
    const name = form.acmName?.trim() || "Untitled client";
    const id = `${Date.now()}`;
    onSaveDraft({ id, name });
    onClose();
  }

  async function handleSubmit() {
    const legalName = form.acmName?.trim();
    const email = form.acmContactEmail?.trim();
    if (!legalName || !email) {
      onClose();
      return;
    }

    const baseClient: any = {
      name: legalName,
      email,
      phone: form.acmContactPhone?.trim() ?? "",
      xero_contact_id: "",
      chase_enabled: true,
      chase_frequency_days: 7,
      escalation_days: 7,
      vat_tracking_enabled: false,
      vat_period_end_date: new Date().toISOString().slice(0, 10),
      chase_paused_until: new Date().toISOString(),
    };

    if (organizationId) {
      baseClient.organization_id = organizationId;
    }

    const payload = baseClient as Parameters<typeof clientsApi.create>[0];
    try {
      const created = await clientsApi.create(payload);
      onCreated(created);
      onClose();
      return;
    } catch {
      // fall through to mock client below if API fails
    }

    onCreated({
      ...(baseClient as any),
      id: `${Date.now()}`,
      vat_period_completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    });
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
          maxHeight: "calc(100vh - var(--sp-48))",
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
            <div className="acm-section-label">Business Details</div>
            <div className="acm-field">
              <label className="acm-label">
                Legal name <span className="acm-required">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Westbrook Holdings Ltd"
                value={form.acmName ?? ""}
                onChange={(e) => updateField("acmName", e.target.value)}
              />
            </div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Trading name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="If different from legal name"
                  value={form.acmTradingName ?? ""}
                  onChange={(e) =>
                    updateField("acmTradingName", e.target.value)
                  }
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Entity type</label>
                <select
                  className="select"
                  value={form.acmEntity ?? "Limited Company"}
                  onChange={(e) => updateField("acmEntity", e.target.value)}
                >
                  <option>Limited Company</option>
                  <option>LLP</option>
                  <option>Sole Trader</option>
                  <option>Partnership</option>
                  <option>Charity</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Company number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 06543210"
                  value={form.acmCompanyNo ?? ""}
                  onChange={(e) => updateField("acmCompanyNo", e.target.value)}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">UTR</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 4567890123"
                  value={form.acmUtr ?? ""}
                  onChange={(e) => updateField("acmUtr", e.target.value)}
                />
              </div>
            </div>

            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">SIC code</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 69201"
                  value={form.acmSic ?? ""}
                  onChange={(e) => updateField("acmSic", e.target.value)}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Industry</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Property & Investment"
                  value={form.acmIndustry ?? ""}
                  onChange={(e) => updateField("acmIndustry", e.target.value)}
                />
              </div>
            </div>

            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Employees</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 45"
                  value={form.acmEmployees ?? ""}
                  onChange={(e) => updateField("acmEmployees", e.target.value)}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Incorporation date</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 14 Mar 2012"
                  value={form.acmIncDate ?? ""}
                  onChange={(e) => updateField("acmIncDate", e.target.value)}
                />
              </div>
            </div>

            <div className="acm-section-label u-mt-20">Tax &amp; VAT</div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">VAT number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. GB 654 3210 98"
                  value={form.acmVat ?? ""}
                  onChange={(e) => updateField("acmVat", e.target.value)}
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">VAT scheme</label>
                <select
                  className="select"
                  value={form.acmVatScheme ?? "Standard"}
                  onChange={(e) => updateField("acmVatScheme", e.target.value)}
                >
                  <option>Standard</option>
                  <option>Flat Rate</option>
                  <option>Cash Accounting</option>
                  <option>Annual Accounting</option>
                  <option>Not VAT registered</option>
                </select>
              </div>
            </div>

            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">VAT quarter</label>
                <select
                  className="select"
                  value={form.acmVatQtr ?? ""}
                  onChange={(e) => updateField("acmVatQtr", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option>Q1 (Jan–Mar)</option>
                  <option>Q2 (Apr–Jun)</option>
                  <option>Q3 (Jul–Sep)</option>
                  <option>Q4 (Oct–Dec)</option>
                </select>
              </div>
              <div className="acm-field">
                <label className="acm-label">Year end</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 31 December"
                  value={form.acmYearEnd ?? ""}
                  onChange={(e) => updateField("acmYearEnd", e.target.value)}
                />
              </div>
            </div>

            <div className="acm-section-label u-mt-20">Addresses</div>
            <div className="acm-field">
              <label className="acm-label">Registered address</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 100 Mayfair Place, London W1K 4QT"
                value={form.acmRegAddress ?? ""}
                onChange={(e) => updateField("acmRegAddress", e.target.value)}
              />
            </div>
            <div className="acm-field">
              <label className="acm-label">Trading address</label>
              <input
                type="text"
                className="input"
                placeholder="Same as registered if blank"
                value={form.acmTradeAddress ?? ""}
                onChange={(e) => updateField("acmTradeAddress", e.target.value)}
              />
            </div>

            <div className="acm-section-label u-mt-20">
              Primary Contact <span className="acm-required">*</span>
            </div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">
                  Full name <span className="acm-required">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Catherine Westbrook"
                  value={form.acmContactName ?? ""}
                  onChange={(e) =>
                    updateField("acmContactName", e.target.value)
                  }
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Role</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Managing Director"
                  value={form.acmContactRole ?? ""}
                  onChange={(e) =>
                    updateField("acmContactRole", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">
                  Email <span className="acm-required">*</span>
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. catherine@westbrook.co.uk"
                  value={form.acmContactEmail ?? ""}
                  onChange={(e) =>
                    updateField("acmContactEmail", e.target.value)
                  }
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="e.g. 020 8765 4321"
                  value={form.acmContactPhone ?? ""}
                  onChange={(e) =>
                    updateField("acmContactPhone", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Mobile</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="e.g. 07700 900321"
                  value={form.acmContactMobile ?? ""}
                  onChange={(e) =>
                    updateField("acmContactMobile", e.target.value)
                  }
                />
              </div>
              <div className="acm-field">
                <label className="acm-label">Preferred channels</label>
                <select
                  className="select"
                  value={form.acmContactPref ?? "Email"}
                  onChange={(e) =>
                    updateField("acmContactPref", e.target.value)
                  }
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>SMS</option>
                  <option>WhatsApp</option>
                </select>
              </div>
            </div>

            <div className="acm-section-label u-mt-20">
              Financials &amp; Billing
            </div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Currency</label>
                <select
                  className="select"
                  value={form.acmCurrency ?? "GBP (£)"}
                  onChange={(e) => updateField("acmCurrency", e.target.value)}
                >
                  <option>GBP (£)</option>
                  <option>EUR (€)</option>
                  <option>USD ($)</option>
                </select>
              </div>
              <div className="acm-field">
                <label className="acm-label">Payment terms</label>
                <select
                  className="select"
                  value={form.acmTerms ?? "Use firm default"}
                  onChange={(e) => updateField("acmTerms", e.target.value)}
                >
                  <option>Use firm default</option>
                  <option>Net 7</option>
                  <option>Net 14</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                  <option>Net 60</option>
                </select>
              </div>
            </div>

            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Fee structure</label>
                <select
                  className="select"
                  value={form.acmFeeStructure ?? ""}
                  onChange={(e) =>
                    updateField("acmFeeStructure", e.target.value)
                  }
                >
                  <option value="">Select...</option>
                  <option>Fixed annual</option>
                  <option>Fixed annual + ad hoc</option>
                  <option>Time-based</option>
                  <option>Per project</option>
                  <option>Retainer</option>
                </select>
              </div>
              <div className="acm-field">
                <label className="acm-label">Annual fee</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. £12,000"
                  value={form.acmAnnualFee ?? ""}
                  onChange={(e) => updateField("acmAnnualFee", e.target.value)}
                />
              </div>
            </div>

            <div className="acm-field">
              <label className="acm-label">Billing frequency</label>
              <select
                className="select"
                style={{ maxWidth: 220 }}
                value={form.acmBillingFreq ?? "Monthly"}
                onChange={(e) => updateField("acmBillingFreq", e.target.value)}
              >
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Annually</option>
                <option>Ad hoc</option>
              </select>
            </div>

            <div className="acm-section-label u-mt-20">Services</div>
            <div className="acm-field">
              <label className="acm-label">Service lines</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Accounts preparation, Corporation tax, VAT returns, Payroll"
                value={form.acmServices ?? ""}
                onChange={(e) => updateField("acmServices", e.target.value)}
              />
              <div className="u-text-muted-xs u-mt-4">
                Separate multiple services with commas
              </div>
            </div>

            <div className="acm-section-label u-mt-20">
              Assignment &amp; Relationship
            </div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Primary manager</label>
                <select
                  className="select"
                  value={form.acmManager ?? ""}
                  onChange={(e) => updateField("acmManager", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option>Richard Morrison</option>
                  <option>Sarah O&apos;Brien</option>
                  <option>Priya Kapoor</option>
                </select>
              </div>
              <div className="acm-field">
                <label className="acm-label">Secondary manager</label>
                <select
                  className="select"
                  value={form.acmSecondary ?? ""}
                  onChange={(e) => updateField("acmSecondary", e.target.value)}
                >
                  <option value="">None</option>
                  <option>Richard Morrison</option>
                  <option>Sarah O&apos;Brien</option>
                  <option>Priya Kapoor</option>
                </select>
              </div>
            </div>

            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">Referral source</label>
                <select
                  className="select"
                  value={form.acmReferral ?? ""}
                  onChange={(e) => updateField("acmReferral", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option>Existing client referral</option>
                  <option>Website</option>
                  <option>Google</option>
                  <option>Accountancy body</option>
                  <option>Networking</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="acm-field">
                <label className="acm-label">Client since</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. March 2025"
                  value={form.acmSince ?? ""}
                  onChange={(e) => updateField("acmSince", e.target.value)}
                />
              </div>
            </div>

            <div className="acm-section-label u-mt-20">Compliance</div>
            <div className="acm-row-2">
              <div className="acm-field">
                <label className="acm-label">AML/KYC status</label>
                <select
                  className="select"
                  value={form.acmAml ?? "Pending"}
                  onChange={(e) => updateField("acmAml", e.target.value)}
                >
                  <option>Pending</option>
                  <option>Passed</option>
                  <option>Failed</option>
                  <option>Exempt</option>
                </select>
              </div>
              <div className="acm-field">
                <label className="acm-label">Engagement letter</label>
                <select
                  className="select"
                  value={form.acmEngagement ?? "Not sent"}
                  onChange={(e) => updateField("acmEngagement", e.target.value)}
                >
                  <option>Not sent</option>
                  <option>Sent</option>
                  <option>Signed</option>
                </select>
              </div>
            </div>

            <div className="acm-vip-row">
              <div
                className={`checkbox${
                  form.acmGdpr === "true" ? " checked" : ""
                }`}
                onClick={() =>
                  updateField(
                    "acmGdpr",
                    form.acmGdpr === "true" ? "false" : "true",
                  )
                }
              />
              <div>
                <div className="u-text-medium">
                  Data protection consent received
                </div>
                <div className="u-text-muted-xs">
                  Client has consented to data processing under GDPR
                </div>
              </div>
            </div>
            <div
              className="acm-vip-row"
              style={{
                borderTop: "1px solid rgba(0,0,0,0.04)",
                marginTop: "var(--sp-4)",
              }}
            >
              <div
                className={`checkbox${
                  form.acmVipCheck === "true" ? " checked" : ""
                }`}
                onClick={() =>
                  updateField(
                    "acmVipCheck",
                    form.acmVipCheck === "true" ? "false" : "true",
                  )
                }
              />
              <div>
                <div className="u-text-medium">VIP client</div>
                <div className="u-text-muted-xs">
                  Requires approval before any automated action
                </div>
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
          >
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}
