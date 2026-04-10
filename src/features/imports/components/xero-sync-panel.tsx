"use client";

import { useEffect, useRef, useState } from "react";
import { importsApi } from "@/lib/api/imports-api";
import { integrationsApi, type XeroConnectionStatus } from "@/lib/api/integrations-api";
import type { ImportSessionResponse } from "@/types/imports";

type DataType = "invoices" | "contacts" | "payments";

type Props = {
  onComplete?: (session: ImportSessionResponse) => void;
};

export function XeroSyncPanel({ onComplete }: Props) {
  const [status, setStatus] = useState<XeroConnectionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [dataType, setDataType] = useState<DataType>("invoices");
  const [syncing, setSyncing] = useState(false);
  const [activeSession, setActiveSession] = useState<ImportSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const result = await integrationsApi.xeroStatus();
      setStatus(result);
      setStatusError(null);
    } catch {
      setStatusError("Could not load Xero connection status.");
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    void loadStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the user just returned from the Xero callback, refresh the status so
  // the panel flips from "not connected" to "connected" automatically.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const xero = params.get("xero");
    if (xero === "connected") {
      void loadStatus();
    } else if (xero === "error") {
      setError(`Connection failed: ${params.get("detail") || "unknown error"}`);
    }
    if (xero) {
      // Strip the query params so refresh doesn't re-trigger this branch.
      const url = new URL(window.location.href);
      url.searchParams.delete("xero");
      url.searchParams.delete("detail");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const result = await integrationsApi.getXeroAuthorizeUrl();
      // Hand off to Xero — the OAuth callback will redirect back to /imports
      window.location.href = result.authorization_url;
    } catch {
      setConnecting(false);
      setError("Failed to start Xero connection. Check that you have admin permissions and that Xero is configured on this server.");
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Xero? Imported data will stay in your ledger but you'll need to reconnect to sync new updates.")) {
      return;
    }
    setDisconnecting(true);
    setError(null);
    try {
      await integrationsApi.disconnectXero();
      await loadStatus();
    } catch {
      setError("Failed to disconnect Xero.");
    } finally {
      setDisconnecting(false);
    }
  }

  function startPolling(sessionId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const updated = await importsApi.getStatus(sessionId);
        setActiveSession(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setSyncing(false);
          if (updated.status === "completed" && onComplete) onComplete(updated);
        }
      } catch {
        // keep polling on transient errors
      }
    }, 2500);
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setActiveSession(null);
    try {
      const session = await importsApi.syncFromXero(dataType);
      setActiveSession(session);
      startPolling(session.id);
    } catch {
      setSyncing(false);
      setError("Failed to start Xero sync.");
    }
  }

  if (loadingStatus) {
    return (
      <div className="ws-card" style={{ textAlign: "center", color: "var(--clr-muted)", fontSize: "var(--text-sm)" }}>
        Checking Xero connection...
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="ws-card" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
        {statusError}
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="ws-card" style={{ padding: "var(--sp-40)", textAlign: "center" }}>
        {/* Xero logo placeholder — keeps the visual weight without depending on assets */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "var(--r-lg)",
          background: "linear-gradient(135deg, #13B5EA, #0078C8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto var(--sp-16)",
          fontSize: "var(--text-lg)",
          fontWeight: "var(--fw-bold)",
          color: "#fff",
          fontFamily: "var(--font-display)",
        }}>
          X
        </div>
        <div className="pg-title" style={{ marginBottom: "var(--sp-8)" }}>
          Connect Xero to start syncing
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", maxWidth: 420, margin: "0 auto var(--sp-20)", lineHeight: "var(--lh-body)" }}>
          Authorize Offlode to read invoices, contacts and payments from your Xero
          organization. You will be redirected to Xero to sign in, then sent back here.
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? "Redirecting to Xero..." : "Connect Xero"}
        </button>
        {status?.last_import_at && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-faint)", marginTop: "var(--sp-16)" }}>
            Last sync attempt: {new Date(status.last_import_at).toLocaleString("en-GB")} ({status.last_import_status})
          </div>
        )}
        {error && (
          <div style={{ marginTop: "var(--sp-16)", padding: "var(--sp-10) var(--sp-12)", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-xs)" }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Connection card */}
      <div className="ws-card">
        <div className="ws-card-title">Connected to Xero</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-16)" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-semibold)", color: "var(--clr-primary)" }}>
              {status.tenant_name || status.tenant_id}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
              {status.last_sync_at
                ? `Last synced ${new Date(status.last_sync_at).toLocaleString("en-GB")}`
                : "Never synced"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)", flexShrink: 0 }}>
            <div style={{
              fontSize: "var(--text-micro)",
              fontWeight: "var(--fw-medium)",
              color: status.is_expired ? "var(--danger)" : "var(--success)",
              background: status.is_expired ? "rgba(239,68,68,0.08)" : "rgba(34,160,107,0.08)",
              padding: "var(--sp-2) var(--sp-8)",
              borderRadius: "var(--r-full)",
            }}>
              {status.is_expired ? "Token expired" : status.sync_status || "active"}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleDisconnect}
              disabled={disconnecting || syncing}
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      </div>

      {/* Data type selector */}
      <div className="ws-card">
        <div className="ws-card-title">What do you want to sync?</div>
        <div className="ws-issue-filters">
          {(["invoices", "contacts", "payments"] as const).map((dt) => (
            <button
              key={dt}
              type="button"
              className={`ws-issue-filter${dataType === dt ? " active" : ""}`}
              onClick={() => setDataType(dt)}
              disabled={syncing}
            >
              {dt.charAt(0).toUpperCase() + dt.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "var(--sp-16)", display: "flex", gap: "var(--sp-8)", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync now"}
          </button>
          {syncing && activeSession && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)" }}>
              Status: {activeSession.status}
              {activeSession.records_created > 0 && ` · ${activeSession.records_created} records`}
            </span>
          )}
        </div>
      </div>

      {/* Result */}
      {activeSession?.status === "completed" && (
        <div className="ws-card" style={{ background: "rgba(34,160,107,0.08)", borderColor: "rgba(34,160,107,0.3)" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-semibold)", color: "var(--success)" }}>
            Sync complete
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-muted)", marginTop: 2 }}>
            {activeSession.records_created} records imported. View them in the Ledger or reconcile any unmatched contacts.
          </div>
        </div>
      )}

      {activeSession?.status === "failed" && (
        <div className="ws-card" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          Sync failed. Check Xero connection or try again.
        </div>
      )}

      {error && (
        <div className="ws-card" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      )}
    </>
  );
}
