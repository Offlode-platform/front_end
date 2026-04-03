"use client";

type Props = {
  needsCount: number;
  totalClients: number;
};

export function WorkspaceBrief({ needsCount, totalClients }: Props) {
  const allClear = needsCount === 0 && totalClients > 0;

  return (
    <div className="ws-brief ws-fade">
      <div style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: allClear ? "rgba(34,160,107,0.08)" : "rgba(53,126,146,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "var(--sp-16)",
      }}>
        {allClear ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        )}
      </div>

      <div className="ws-brief-greeting">
        {totalClients === 0
          ? "Welcome"
          : allClear
            ? "All clear"
            : "Needs your input"}
      </div>
      <div className="ws-brief-sub">
        {totalClients === 0
          ? "No clients yet. Add clients to get started."
          : allClear
            ? `All ${totalClients} client${totalClients !== 1 ? "s" : ""} are handled.`
            : `${needsCount} of ${totalClients} client${totalClients !== 1 ? "s" : ""} need your input.`}
      </div>
      <div className="ws-brief-sub" style={{ marginTop: "var(--sp-8)", fontSize: "var(--text-xs)", color: "var(--clr-faint)" }}>
        Select a client from the list to get started.
      </div>
    </div>
  );
}
