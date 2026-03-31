"use client";

import { useEffect, useState } from "react";
import { organizationsApi } from "@/lib/api/organizations";
import type { Organization } from "@/types/organizations";
import { OrganizationAddModal } from "./components/organization-add-modal";

export function OrganizationsPageView() {
  const [organizations, setOrganizations] = useState<Organization[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  async function loadOrganizations() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizationsApi.list();
      setOrganizations(data);
    } catch {
      setError("Unable to load organizations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOrganizations();
  }, []);

  async function handleCreated() {
    await loadOrganizations();
    setIsAddOpen(false);
  }

  return (
    <div
      className="page active"
      id="page-organizations"
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div className="page-bar-left">
          <div>
            <div className="pg-title">Organizations</div>
            <div className="pg-subtitle">
              View and manage the organizations in your account.
            </div>
          </div>
        </div>
        <div className="page-bar-right">
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => setIsAddOpen(true)}
          >
            Add Organization
          </button>
        </div>
      </div>

      {isAddOpen && (
        <OrganizationAddModal
          onClose={() => setIsAddOpen(false)}
          onCreated={handleCreated}
        />
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div
          className="ws-list"
          style={{ minWidth: 0, height: "100%", alignSelf: "stretch" }}
        >
          <div className="ws-list-header">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-6)",
                width: "100%",
              }}
            >
              <div className="ws-list-section">
                Organizations
                <span className="ws-list-section-count">
                  {organizations?.length ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="ws-items" aria-label="Organizations list">
            {isLoading && !organizations ? (
              <div className="ws-empty-watermark">
                <div className="ws-empty-title">Loading organizations…</div>
              </div>
            ) : null}

            {error ? (
              <div className="ws-empty-watermark">
                <div className="ws-empty-title">Unable to load organizations</div>
                <div className="ws-empty-desc">{error}</div>
              </div>
            ) : null}

            {!isLoading && !error && (organizations?.length ?? 0) === 0 ? (
              <div className="ws-empty-watermark">
                <div className="ws-empty-title">No organizations yet</div>
                <div className="ws-empty-desc">
                  Get started by adding your first organization.
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "var(--sp-12)" }}
                  onClick={() => setIsAddOpen(true)}
                >
                  Add Organization
                </button>
              </div>
            ) : null}

            {organizations?.map((org) => (
              <div key={org.id} className="ws-item">
                <span className="ws-item-bar green" />
                <div className="ws-item-info">
                  <div className="ws-item-name">{org.name}</div>
                  <div className="ws-item-meta">
                    {org.slug} · {org.subscription_tier} ·{" "}
                    {org.subscription_status || "status unknown"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ws-list-footer">
            {(organizations?.length ?? 0)} organization
            {(organizations?.length ?? 0) === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}

