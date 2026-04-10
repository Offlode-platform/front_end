"use client";

import { useEffect, useState } from "react";
import { ImportUploadStep } from "./components/import-upload-step";
import { ImportMappingStep } from "./components/import-mapping-step";
import { ImportPreviewStep } from "./components/import-preview-step";
import { ImportConfirmStep } from "./components/import-confirm-step";
import { ImportHistoryPanel } from "./components/import-history-panel";
import { ContactReconciliationPanel } from "./components/contact-reconciliation-panel";
import { XeroSyncPanel } from "./components/xero-sync-panel";
import type { FieldDetectionResponse, ImportSessionResponse, ImportPreviewResponse } from "@/types/imports";

type ImportStep = "upload" | "mapping" | "preview" | "confirm" | "reconcile" | "done";
type ImportSource = "csv" | "xero";

export function ImportsPageView() {
  const [source, setSource] = useState<ImportSource>("csv");
  const [step, setStep] = useState<ImportStep>("upload");
  const [showHistory, setShowHistory] = useState(false);
  const [detection, setDetection] = useState<FieldDetectionResponse | null>(null);
  const [session, setSession] = useState<ImportSessionResponse | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);

  // When the Xero OAuth callback redirects back to /imports?xero=connected,
  // pre-select the Xero source so the panel (which reads the same query
  // params) renders in the correct context.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("xero")) {
      setSource("xero");
      setStep("upload");
    }
  }, []);

  function handleXeroSyncComplete(result: ImportSessionResponse) {
    setSession(result);
    setStep("reconcile");
  }

  function handleUploadComplete(result: FieldDetectionResponse) {
    setDetection(result);
    setStep("mapping");
  }

  function handleMappingComplete(result: ImportSessionResponse) {
    setSession(result);
    setStep("preview");
  }

  function handlePreviewReady(result: ImportPreviewResponse) {
    setPreview(result);
    setStep("confirm");
  }

  function handleConfirmComplete(result: ImportSessionResponse) {
    setSession(result);
    if (result.status === "completed") {
      setStep("reconcile");
    } else {
      setStep("done");
    }
  }

  function handleReconcileDone() {
    setStep("done");
  }

  function handleReset() {
    setStep("upload");
    setSource("csv");
    setDetection(null);
    setSession(null);
    setPreview(null);
  }

  const steps: { key: ImportStep; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "mapping", label: "Map Fields" },
    { key: "preview", label: "Validate" },
    { key: "confirm", label: "Confirm" },
    { key: "reconcile", label: "Reconcile" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div
      className="page active"
      id="page-imports"
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      {/* Top page bar — matches Dashboard / Clients / Organizations */}
      <div className="page-bar" style={{ flexShrink: 0 }}>
        <div className="page-bar-left">
          <div>
            <div className="pg-title">Financial Import</div>
            <div className="pg-subtitle">
              Import invoices, contacts, and payments from CSV or sync from Xero.
            </div>
          </div>
        </div>
        <div className="page-bar-right">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "New Import" : "Import History"}
          </button>
          {step !== "upload" && !showHistory && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleReset}
            >
              Start Over
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content area — same paddings as Dashboard's dash-content */}
      <div className="dash-content">
        {showHistory ? (
          <div className="ws-card" style={{ padding: 0, overflow: "hidden" }}>
            <ImportHistoryPanel />
          </div>
        ) : (
          <>
            {/* Source selector — only on the first step of the wizard */}
            {step === "upload" && (
              <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
                <div className="ws-card-title">Import source</div>
                <div className="ws-issue-filters">
                  <button
                    type="button"
                    className={`ws-issue-filter${source === "csv" ? " active" : ""}`}
                    onClick={() => setSource("csv")}
                  >
                    CSV upload
                  </button>
                  <button
                    type="button"
                    className={`ws-issue-filter${source === "xero" ? " active" : ""}`}
                    onClick={() => setSource("xero")}
                  >
                    Xero sync
                  </button>
                  <button
                    type="button"
                    className="ws-issue-filter"
                    disabled
                    title="Coming soon"
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  >
                    QuickBooks
                  </button>
                  <button
                    type="button"
                    className="ws-issue-filter"
                    disabled
                    title="Coming soon"
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  >
                    Sage
                  </button>
                </div>
              </div>
            )}

            {/* Step indicator — only relevant to the CSV wizard */}
            {step !== "done" && source === "csv" && (
              <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
                <div className="ws-card-title">Progress</div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)", flexWrap: "wrap" }}>
                  {steps.map((s, i) => (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "var(--sp-6)" }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--fw-bold)",
                        background: i <= currentStepIndex ? "var(--brand)" : "var(--clr-surface-subtle)",
                        color: i <= currentStepIndex ? "#fff" : "var(--clr-muted)",
                        transition: "all 0.2s",
                      }}>
                        {i < currentStepIndex ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: i === currentStepIndex ? "var(--fw-semibold)" : "var(--fw-normal)",
                        color: i <= currentStepIndex ? "var(--clr-primary)" : "var(--clr-muted)",
                      }}>
                        {s.label}
                      </span>
                      {i < steps.length - 1 && (
                        <div style={{
                          width: 32,
                          height: 2,
                          background: i < currentStepIndex ? "var(--brand)" : "var(--clr-divider)",
                          borderRadius: 1,
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step content */}
            {step === "upload" && source === "csv" && (
              <ImportUploadStep onComplete={handleUploadComplete} />
            )}
            {step === "upload" && source === "xero" && (
              <XeroSyncPanel onComplete={handleXeroSyncComplete} />
            )}
            {step === "mapping" && detection && (
              <ImportMappingStep detection={detection} onComplete={handleMappingComplete} />
            )}
            {step === "preview" && session && (
              <ImportPreviewStep session={session} onPreviewReady={handlePreviewReady} />
            )}
            {step === "confirm" && session && preview && (
              <ImportConfirmStep session={session} preview={preview} onComplete={handleConfirmComplete} />
            )}
            {step === "reconcile" && session && (
              <>
                <div className="ws-card">
                  <div className="ws-card-title">Reconcile imported contacts</div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", margin: 0, lineHeight: "var(--lh-body)" }}>
                    Imported invoices only enter the chase workflow once their contact is linked to a client.
                    Resolve any unmatched contacts below — or skip and come back later from the import history.
                  </p>
                </div>
                <ContactReconciliationPanel embedded onAllResolved={handleReconcileDone} />
                <div style={{ display: "flex", gap: "var(--sp-8)", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleReconcileDone}>
                    Done
                  </button>
                </div>
              </>
            )}
            {step === "done" && session && (
              <div className="ws-card" style={{ padding: "var(--sp-40)", textAlign: "center" }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(34,160,107,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto var(--sp-16)",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="pg-title" style={{ marginBottom: "var(--sp-8)" }}>
                  Import Complete
                </div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginBottom: "var(--sp-20)", lineHeight: "var(--lh-body)" }}>
                  {session.records_created} records created
                  {session.records_updated > 0 ? `, ${session.records_updated} updated` : ""}
                  {session.records_skipped > 0 ? `, ${session.records_skipped} skipped` : ""}
                </p>
                <div style={{ display: "flex", gap: "var(--sp-8)", justifyContent: "center" }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleReset}>
                    Import Another
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHistory(true)}>
                    View History
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
