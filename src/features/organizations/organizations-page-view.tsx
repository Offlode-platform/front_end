"use client";

import { useEffect, useMemo, useState } from "react";
import { organizationsApi } from "@/lib/api/organizations";
import type { Organization } from "@/types/organizations";
import { OrganizationAddModal } from "./components/organization-add-modal";

export function OrganizationsPageView() {
  const [organizations, setOrganizations] = useState<Organization[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredOrganizations = useMemo(() => {
    if (!organizations) return [];
    const q = search.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter((org) => {
      return (
        org.name.toLowerCase().includes(q) ||
        org.slug.toLowerCase().includes(q) ||
        org.subscription_tier.toLowerCase().includes(q)
      );
    });
  }, [organizations, search]);

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
            <div className="ws-search">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
                  {filteredOrganizations.length}
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

            {!isLoading && !error && filteredOrganizations.length === 0 && (
              <div className="ws-empty-watermark">
                <div className="ws-empty-title">No organizations found</div>
                <div className="ws-empty-desc">
                  Try adjusting your search term or add a new organization.
                </div>
              </div>
            )}

            {filteredOrganizations.map((org) => {
              const status =
                org.subscription_status?.toLowerCase() === "active"
                  ? "Active"
                  : org.subscription_status?.toLowerCase() === "trialing"
                    ? "Trial"
                    : org.subscription_status || "Unknown";
              const hasXero = org.xero_connected;
              return (
                <div key={org.id} className="ws-item">
                  <span className="ws-item-bar green" />
                  <div className="ws-item-info">
                    <div className="ws-item-name">
                      {org.name}
                      {hasXero ? (
                        <span
                          className="pill pill-xs"
                          style={{ marginLeft: "var(--sp-6)" }}
                        >
                          Xero connected
                        </span>
                      ) : null}
                    </div>
                    <div className="ws-item-meta">
                      <span>{org.slug}</span>
                      <span style={{ margin: "0 var(--sp-4)" }}>·</span>
                      <span>{org.subscription_tier}</span>
                      <span style={{ margin: "0 var(--sp-4)" }}>·</span>
                      <span>{status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ws-list-footer">
            {filteredOrganizations.length} organization
            {filteredOrganizations.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}

