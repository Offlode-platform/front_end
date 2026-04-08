"use client";

import { useState } from "react";
import { ImportUploadStep } from "./components/import-upload-step";
import { ImportMappingStep } from "./components/import-mapping-step";
import { ImportPreviewStep } from "./components/import-preview-step";
import { ImportConfirmStep } from "./components/import-confirm-step";
import { ImportHistoryPanel } from "./components/import-history-panel";
import type { FieldDetectionResponse, ImportSessionResponse, ImportPreviewResponse } from "@/types/imports";

type ImportStep = "upload" | "mapping" | "preview" | "confirm" | "done";

export function ImportsPageView() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [showHistory, setShowHistory] = useState(false);
  const [detection, setDetection] = useState<FieldDetectionResponse | null>(null);
  const [session, setSession] = useState<ImportSessionResponse | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);

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
    setStep("done");
  }

  function handleReset() {
    setStep("upload");
    setDetection(null);
    setSession(null);
    setPreview(null);
  }

  const steps: { key: ImportStep; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "mapping", label: "Map Fields" },
    { key: "preview", label: "Validate" },
    { key: "confirm", label: "Confirm" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div style={{ padding: "var(--sp-24)", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-24)" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--fw-bold)", color: "var(--clr-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
            Financial Import
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginTop: "var(--sp-4)" }}>
            Import invoices, contacts, and payments from CSV
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--sp-8)" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowHistory(!showHistory)}
            style={{ fontSize: "var(--text-xs)" }}
          >
            {showHistory ? "New Import" : "Import History"}
          </button>
          {step !== "upload" && !showHistory && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleReset}
              style={{ fontSize: "var(--text-xs)" }}
            >
              Start Over
            </button>
          )}
        </div>
      </div>

      {showHistory ? (
        <ImportHistoryPanel />
      ) : (
        <>
          {/* Step indicator */}
          {step !== "done" && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-4)",
              marginBottom: "var(--sp-24)",
            }}>
              {steps.map((s, i) => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
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
                      width: 40,
                      height: 2,
                      background: i < currentStepIndex ? "var(--brand)" : "var(--clr-divider)",
                      borderRadius: 1,
                      marginLeft: "var(--sp-4)",
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step content */}
          {step === "upload" && (
            <ImportUploadStep onComplete={handleUploadComplete} />
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
          {step === "done" && session && (
            <div style={{
              background: "var(--clr-surface-card)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--clr-divider)",
              padding: "var(--sp-40)",
              textAlign: "center",
            }}>
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
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--fw-bold)", color: "var(--clr-primary)", marginBottom: "var(--sp-8)" }}>
                Import Complete
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--clr-muted)", marginBottom: "var(--sp-20)", lineHeight: "var(--lh-body)" }}>
                {session.records_created} records created
                {session.records_updated > 0 ? `, ${session.records_updated} updated` : ""}
                {session.records_skipped > 0 ? `, ${session.records_skipped} skipped` : ""}
              </p>
              <div style={{ display: "flex", gap: "var(--sp-8)", justifyContent: "center" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleReset}>
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
  );
}
