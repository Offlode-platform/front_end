import type { WorkspaceDemoClient, WorkspaceZone } from "../types";

type WorkspaceZoneContentProps = {
  client: WorkspaceDemoClient;
  zone: WorkspaceZone;
};

function fmtCurrency(amount?: number) {
  if (typeof amount !== "number") return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(amount);
}

export function WorkspaceZoneContent({ client, zone }: WorkspaceZoneContentProps) {
  if (zone === "documents") {
    const collect = client.collect;
    const sets = collect?.documentSets ?? [];
    const allItems = sets.flatMap((set) => set.items ?? []);
    const pending = allItems.filter((item) => item.status !== "received");
    const received = allItems.filter((item) => item.status === "received" || item.status === "review");
    return (
      <>
        <div className="ws-section-divider ws-section-primary">Actions</div>
        <div className="ws-card">
          <div className="ws-card-title">Collection status</div>
          <p className="ws-help-text">Status: {collect?.status ?? "—"} · Chases: {collect?.chaseCount ?? 0}</p>
          {collect?.nextEscalation ? <p className="ws-help-text">{collect.nextEscalation}</p> : null}
        </div>

        <div className="ws-section-divider">Document Status</div>
        <div className="ws-card">
          <p className="ws-help-text">
            {received.length} collected · {pending.length} outstanding
          </p>
          {sets.map((set) => (
            <div key={set.id ?? set.name} style={{ padding: "var(--sp-8) 0", borderTop: "1px solid var(--clr-divider)" }}>
              <div className="ws-item-name">{set.name}</div>
              <div className="ws-item-meta">
                Due {set.deadline ?? "—"} · Progress {set.progress ?? 0}% · Chases {set.chaseCount ?? 0}
              </div>
            </div>
          ))}
        </div>

        <div className="ws-section-divider">Outstanding Requests</div>
        <div className="ws-card">
          {pending.length === 0 ? <p className="ws-help-text">No outstanding requests.</p> : null}
          {pending.map((item) => (
            <div key={item.id ?? item.name} style={{ padding: "var(--sp-8) 0", borderTop: "1px solid var(--clr-divider)" }}>
              <div className="ws-item-name">{item.name}</div>
              <div className="ws-item-meta">
                {item.status ?? "pending"}
                {item.daysOverdue ? ` · ${item.daysOverdue}d overdue` : ""}
                {item.aiCheckNote ? ` · ${item.aiCheckNote}` : ""}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (zone === "calls") {
    const respond = client.respond;
    const transcript = respond?.transcript;
    const transcriptLines = Array.isArray(transcript)
      ? transcript
      : typeof transcript === "string"
        ? [{ speaker: "Transcript", text: transcript }]
        : [];

    return (
      <>
        <div className="ws-section-divider ws-section-primary">Communication Context</div>
        <div className="ws-card">
          <div className="ws-card-title">{respond?.callType ?? "Call"}</div>
          <p className="ws-help-text">{respond?.summary ?? "No summary available."}</p>
          <p className="ws-item-meta">
            {respond?.callTime ?? "—"} · {respond?.callDuration ?? "—"} · Sentiment: {respond?.sentiment ?? "—"}
          </p>
        </div>

        <div className="ws-section-divider">Conversation Transcript</div>
        <div className="ws-card">
          {transcriptLines.length === 0 ? <p className="ws-help-text">No transcript available.</p> : null}
          {transcriptLines.map((line, idx) => (
            <div key={`${line.speaker}-${idx}`} style={{ padding: "var(--sp-8) 0", borderTop: "1px solid var(--clr-divider)" }}>
              <div className="ws-item-meta" style={{ fontWeight: "var(--fw-semibold)" }}>{line.speaker}</div>
              <div className="ws-help-text">{line.text}</div>
            </div>
          ))}
        </div>

        <div className="ws-section-divider">Tags & Follow-up</div>
        <div className="ws-card">
          <div className="ws-ctx-tags">
            {(respond?.tags ?? []).map((tag) => (
              <span key={tag} className="chip">{tag}</span>
            ))}
          </div>
          {(respond?.pendingCallbacks ?? []).map((callback, idx) => (
            <p key={idx} className="ws-help-text" style={{ marginTop: "var(--sp-8)" }}>
              {callback.reason ?? "Callback"} · {callback.requestedTime ?? "—"}{callback.overdue ? " · overdue" : ""}
            </p>
          ))}
        </div>
      </>
    );
  }

  const settle = client.settle;
  const invoices = settle?.invoices ?? [];
  const disputed = invoices.find((invoice) => invoice.status === "disputed");

  return (
    <>
      <div className="ws-section-divider ws-section-primary">Invoice Overview</div>
      <div className="ws-card">
        <div className="ws-card-title">{fmtCurrency(settle?.totalOutstanding)} outstanding</div>
        <p className="ws-item-meta">{fmtCurrency(settle?.totalOverdue)} overdue</p>
        {invoices.map((invoice) => (
          <div key={invoice.id} style={{ padding: "var(--sp-8) 0", borderTop: "1px solid var(--clr-divider)" }}>
            <div className="ws-item-name">{invoice.id}</div>
            <div className="ws-item-meta">
              {fmtCurrency(invoice.amount)} · {invoice.status ?? "—"}
              {invoice.daysOverdue ? ` · ${invoice.daysOverdue}d overdue` : ""}
            </div>
            {invoice.description ? <p className="ws-help-text">{invoice.description}</p> : null}
          </div>
        ))}
      </div>

      {disputed?.dispute ? (
        <>
          <div className="ws-section-divider">Dispute Details</div>
          <div className="ws-card">
            <div className="ws-card-title">{disputed.id}</div>
            <p className="ws-help-text">{disputed.dispute.reason ?? "No dispute reason provided."}</p>
            <p className="ws-item-meta">
              Raised by {disputed.dispute.raisedBy ?? "—"} · {disputed.dispute.raisedDate ?? "—"}
            </p>
          </div>
        </>
      ) : null}

      {settle?.draftInvoice?.ready ? (
        <>
          <div className="ws-section-divider">Draft Invoice / Quote</div>
          <div className="ws-card">
            <p className="ws-help-text">
              {settle.draftInvoice.type ?? "Draft"} {settle.draftInvoice.period ? `· ${settle.draftInvoice.period}` : ""}
            </p>
            {typeof settle.draftInvoice.totalQuote === "number" ? (
              <p className="ws-card-title">{fmtCurrency(settle.draftInvoice.totalQuote)}</p>
            ) : null}
            {settle.draftInvoice.note ? <p className="ws-help-text">{settle.draftInvoice.note}</p> : null}
          </div>
        </>
      ) : null}
    </>
  );
}
