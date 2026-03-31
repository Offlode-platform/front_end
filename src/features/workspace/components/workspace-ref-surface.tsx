"use client";

import type { ReactNode } from "react";
import type { WorkspaceDemoClient } from "../types";
import { WorkspaceUnifiedTimeline } from "./workspace-unified-timeline";

export type RefSurface = "records" | "activity" | "notes" | "settings";

type WorkspaceRefSurfaceProps = {
  client: WorkspaceDemoClient;
  surface: RefSurface;
  firstName: string;
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--sp-24)" }}>
      <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--fw-semibold)", color: "var(--clr-primary)" }}>
        {children}
      </span>
    </div>
  );
}

export function WorkspaceRefSurface({ client, surface, firstName }: WorkspaceRefSurfaceProps) {
  if (surface === "records") {
    return (
      <>
        <SectionTitle>Client Records</SectionTitle>
        <div className="ws-card">
          <div className="ws-card-title">Profile</div>
          <div className="ws-ctx-row">
            <span className="ws-ctx-label">Legal name</span>
            <span className="ws-ctx-value">{client.name}</span>
          </div>
          {client.legalEntity ? (
            <div className="ws-ctx-row">
              <span className="ws-ctx-label">Entity</span>
              <span className="ws-ctx-value">{client.legalEntity}</span>
            </div>
          ) : null}
          {client.email ? (
            <div className="ws-ctx-row">
              <span className="ws-ctx-label">Email</span>
              <span className="ws-ctx-value">{client.email}</span>
            </div>
          ) : null}
          {client.phone ? (
            <div className="ws-ctx-row">
              <span className="ws-ctx-label">Phone</span>
              <span className="ws-ctx-value">{client.phone}</span>
            </div>
          ) : null}
        </div>
        {client.contacts && client.contacts.length > 0 ? (
          <div className="ws-card" style={{ marginTop: "var(--sp-16)" }}>
            <div className="ws-card-title">Contacts</div>
            {client.contacts.map((c) => (
              <div key={c.email ?? c.name} className="ws-ctx-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--sp-4)" }}>
                <span className="ws-ctx-value" style={{ fontWeight: "var(--fw-medium)" }}>
                  {c.name}
                  {c.primary ? " · Primary" : ""}
                </span>
                <span className="ws-item-meta">{c.role}</span>
                <span className="ws-item-meta">{c.email}</span>
              </div>
            ))}
          </div>
        ) : null}
        {client.services && client.services.length > 0 ? (
          <div className="ws-card" style={{ marginTop: "var(--sp-16)" }}>
            <div className="ws-card-title">Services</div>
            <div className="ws-ctx-tags">
              {client.services.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </>
    );
  }

  if (surface === "activity") {
    return <WorkspaceUnifiedTimeline client={client} firstName={firstName} />;
  }

  if (surface === "notes") {
    const pinned = client.pinnedNote;
    const pinnedText = typeof pinned === "string" ? pinned : pinned?.text;
    return (
      <>
        <SectionTitle>Notes</SectionTitle>
        {pinnedText ? (
          <div
            className="ws-card"
            style={{
              marginBottom: "var(--sp-16)",
              borderLeft: "3px solid var(--warning)",
              background: "rgba(224, 148, 34, 0.04)",
            }}
          >
            <div className="ws-card-title">Pinned</div>
            <p className="ws-item-meta" style={{ color: "var(--clr-secondary)", lineHeight: "var(--lh-relaxed)" }}>
              {pinnedText}
            </p>
            {typeof pinned !== "string" && pinned?.author ? (
              <p className="ws-item-meta">
                {pinned.author}
                {pinned.time ? ` · ${pinned.time}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="ws-card">
          <div className="ws-card-title">Notes</div>
          {(client.notes ?? []).length === 0 ? (
            <p className="ws-item-meta">No notes yet.</p>
          ) : (
            (client.notes ?? []).map((n) => (
              <div key={n.id ?? n.text} style={{ padding: "var(--sp-12) 0", borderBottom: "1px solid var(--clr-divider)" }}>
                <p className="ws-item-meta" style={{ color: "var(--clr-secondary)", lineHeight: "var(--lh-relaxed)" }}>
                  {n.text}
                </p>
                <p className="ws-item-meta">
                  {n.author}
                  {n.time ? ` · ${n.time}` : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <SectionTitle>Client settings</SectionTitle>
      <div className="ws-card">
        <div className="ws-card-title">Preferences</div>
        <div className="ws-ctx-tags" style={{ marginBottom: "var(--sp-16)" }}>
          {(client.prefs ?? []).map((p) => (
            <span key={p} className="chip">
              {p}
            </span>
          ))}
        </div>
        {client.aiLearned ? (
          <>
            <div className="ws-section-divider">AI context</div>
            {client.aiLearned.bestContactTime ? (
              <div className="ws-ctx-row">
                <span className="ws-ctx-label">Best contact</span>
                <span className="ws-ctx-value">{client.aiLearned.bestContactTime}</span>
              </div>
            ) : null}
            {client.aiLearned.avgResponseTime ? (
              <div className="ws-ctx-row">
                <span className="ws-ctx-label">Avg response</span>
                <span className="ws-ctx-value">{client.aiLearned.avgResponseTime}</span>
              </div>
            ) : null}
            {client.aiLearned.preferredChannel ? (
              <div className="ws-ctx-row">
                <span className="ws-ctx-label">Channel</span>
                <span className="ws-ctx-value">{client.aiLearned.preferredChannel}</span>
              </div>
            ) : null}
          </>
        ) : (
          <p className="ws-item-meta">No additional settings for this client.</p>
        )}
      </div>
    </>
  );
}
