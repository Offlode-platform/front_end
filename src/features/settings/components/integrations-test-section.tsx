"use client";

import { useEffect, useState } from "react";
import { Mail, MessageSquare, Phone, CheckCircle, XCircle, Loader, Send } from "lucide-react";
import { integrationsApi } from "@/lib/api/integrations-api";
import type { IntegrationsConfigStatus, TestResult } from "@/lib/api/integrations-api";
import {
  SectionHeader,
  inputStyle,
  primaryBtnStyle,
} from "./profile-section";

const BRAND = "#357e92";

type ServiceKey = "email" | "sms" | "whatsapp";

const SERVICES: {
  key: ServiceKey;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  placeholder: string;
  inputLabel: string;
}[] = [
  {
    key: "email",
    label: "Email",
    icon: Mail,
    placeholder: "you@example.com",
    inputLabel: "Recipient email address",
  },
  {
    key: "sms",
    label: "SMS",
    icon: Phone,
    placeholder: "+447700900000",
    inputLabel: "Recipient phone (E.164 format)",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    placeholder: "+447700900000",
    inputLabel: "Recipient phone (E.164 format)",
  },
];

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        background: configured ? "rgba(34,160,107,0.12)" : "rgba(239,68,68,0.1)",
        color: configured ? "var(--success)" : "var(--danger)",
        border: `1px solid ${configured ? "rgba(34,160,107,0.3)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      {configured ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {configured ? "Configured" : "Not configured"}
    </div>
  );
}

function ResultBanner({ result }: { result: TestResult | null }) {
  if (!result) return null;

  const ok = result.status === "sent";
  const mocked = result.status === "mocked";
  const color = ok ? "rgba(34,160,107,0.12)" : mocked ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)";
  const border = ok ? "rgba(34,160,107,0.3)" : mocked ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)";
  const textColor = ok ? "var(--success)" : mocked ? "#ca8a04" : "var(--danger)";
  const Icon = ok ? CheckCircle : mocked ? Loader : XCircle;

  const detailText = result.detail
    ? JSON.stringify(result.detail, null, 2)
    : null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 14px",
        borderRadius: 10,
        background: color,
        border: `1px solid ${border}`,
        color: textColor,
        fontSize: 12.5,
        fontWeight: 500,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Icon size={14} style={{ flexShrink: 0 }} />
        <span style={{ textTransform: "capitalize" }}>
          Status: <strong>{result.status}</strong>
        </span>
      </div>
      {detailText && (
        <pre
          style={{
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 7,
            background: "rgba(0,0,0,0.06)",
            fontSize: 11,
            overflowX: "auto",
            color: "var(--clr-secondary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {detailText}
        </pre>
      )}
    </div>
  );
}

export function IntegrationsTestSection() {
  const [configStatus, setConfigStatus] = useState<IntegrationsConfigStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [recipients, setRecipients] = useState<Record<ServiceKey, string>>({
    email: "",
    sms: "",
    whatsapp: "",
  });
  const [sending, setSending] = useState<Record<ServiceKey, boolean>>({
    email: false,
    sms: false,
    whatsapp: false,
  });
  const [results, setResults] = useState<Record<ServiceKey, TestResult | null>>({
    email: null,
    sms: null,
    whatsapp: null,
  });

  useEffect(() => {
    integrationsApi
      .testStatus()
      .then((s) => setConfigStatus(s))
      .catch((e) => {
        const msg = (e as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail;
        setStatusError(msg || "Could not load integration status.");
      })
      .finally(() => setLoadingStatus(false));
  }, []);

  async function handleSend(key: ServiceKey) {
    const to = recipients[key].trim();
    if (!to) return;

    setSending((s) => ({ ...s, [key]: true }));
    setResults((r) => ({ ...r, [key]: null }));

    try {
      let result: TestResult;
      if (key === "email") result = await integrationsApi.testEmail(to);
      else if (key === "sms") result = await integrationsApi.testSms(to);
      else result = await integrationsApi.testWhatsapp(to);
      setResults((r) => ({ ...r, [key]: result }));
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setResults((r) => ({
        ...r,
        [key]: {
          service: key,
          status: "failed",
          detail: { error: detail || String(e) },
        },
      }));
    } finally {
      setSending((s) => ({ ...s, [key]: false }));
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <SectionHeader
        title="Integrations"
        description="Send a test message to verify that your WhatsApp, SMS, and email credentials are working correctly."
      />

      {loadingStatus && (
        <div style={{ fontSize: 13, color: "var(--clr-muted)", marginBottom: 24 }}>
          Checking configuration…
        </div>
      )}
      {statusError && (
        <div
          style={{
            fontSize: 13,
            color: "var(--danger)",
            marginBottom: 24,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          {statusError}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {SERVICES.map((svc) => {
          const Icon = svc.icon;
          const configured = configStatus ? configStatus[svc.key] : false;
          const isSending = sending[svc.key];
          const canSend = !isSending && recipients[svc.key].trim().length > 0;

          return (
            <div
              key={svc.key}
              style={{
                padding: "18px 20px",
                borderRadius: 14,
                border: `1px solid ${configured ? `${BRAND}35` : "var(--clr-divider)"}`,
                background: configured
                  ? `linear-gradient(135deg, ${BRAND}0a, ${BRAND}05)`
                  : "var(--clr-surface-card)",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: configured ? `${BRAND}20` : "var(--clr-surface-subtle)",
                    color: configured ? BRAND : "var(--clr-muted)",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--clr-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {svc.label}
                  </div>
                  {!loadingStatus && <StatusBadge configured={configured} />}
                </div>
              </div>

              {/* Credential detail */}
              {configStatus && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--clr-muted)",
                    marginBottom: 14,
                  }}
                >
                  {svc.key === "email" && configStatus.email_from && (
                    <>Sending from: <strong>{configStatus.email_from}</strong></>
                  )}
                  {svc.key === "sms" && configStatus.sms_from && (
                    <>Twilio number: <strong>{configStatus.sms_from}</strong></>
                  )}
                  {svc.key === "whatsapp" && configStatus.whatsapp_phone_number_id && (
                    <>Phone Number ID: <strong>{configStatus.whatsapp_phone_number_id}</strong></>
                  )}
                  {svc.key === "email" && !configStatus.email_from && "No Postmark sender configured."}
                  {svc.key === "sms" && !configStatus.sms_from && "Twilio credentials not found."}
                  {svc.key === "whatsapp" && !configStatus.whatsapp_phone_number_id && "Meta WhatsApp credentials not found."}
                </div>
              )}

              {/* Input + send */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: "var(--clr-muted)",
                      marginBottom: 5,
                    }}
                  >
                    {svc.inputLabel}
                  </label>
                  <input
                    type={svc.key === "email" ? "email" : "tel"}
                    value={recipients[svc.key]}
                    onChange={(e) =>
                      setRecipients((r) => ({ ...r, [svc.key]: e.target.value }))
                    }
                    placeholder={svc.placeholder}
                    disabled={isSending}
                    style={{
                      ...inputStyle,
                      opacity: isSending ? 0.6 : 1,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSend) void handleSend(svc.key);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleSend(svc.key)}
                  disabled={!canSend}
                  style={{
                    ...primaryBtnStyle(!canSend),
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                    marginBottom: 0,
                  }}
                >
                  {isSending ? (
                    <Loader size={13} style={{ animation: "spin 0.7s linear infinite" }} />
                  ) : (
                    <Send size={13} />
                  )}
                  {isSending ? "Sending…" : "Send test"}
                </button>
              </div>

              <ResultBanner result={results[svc.key]} />
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{
          marginTop: 20,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(53,126,146,0.06)",
          border: "1px solid rgba(53,126,146,0.18)",
          fontSize: 12,
          color: "var(--clr-muted)",
          lineHeight: 1.6,
        }}
      >
        Test messages are sent directly via the service API — no chase records or audit entries are created.
        A <strong>mocked</strong> status means credentials are missing so the call was skipped.
      </div>
    </div>
  );
}
