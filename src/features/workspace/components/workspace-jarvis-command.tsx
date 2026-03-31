"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { WorkspaceDemoClient } from "../types";
import type { WorkspaceTask } from "../workspace-task-stream";

const AGENT_LABEL: Record<string, string> = {
  collect: "Documents",
  respond: "Calls",
  settle: "Payments",
};

const AGENT_COLOR: Record<string, string> = {
  collect: "var(--collect)",
  respond: "var(--respond)",
  settle: "var(--settle)",
};

type WorkspaceJarvisCommandProps = {
  client: WorkspaceDemoClient;
  tasks: WorkspaceTask[];
  firstName: string;
  onOpenWorkspace: () => void;
};


type Slide = {
  key: string;
  tag: string;
  tagClass: string;
  children: ReactNode;
};

function buildSlides(client: WorkspaceDemoClient, tasks: WorkspaceTask[], firstName: string): Slide[] {
  const slides: Slide[] = [];
  const agentKeys = ["collect", "respond", "settle"] as const;
  const totalItems = tasks.length;

  const summaryChildren = (
    <>
      <div className="jarvis-signal" style={{ marginLeft: "-13px" }}>
        {firstName} has {totalItems} item{totalItems !== 1 ? "s" : ""} that need your attention
      </div>
      <div className="jarvis-situation" style={{ marginBottom: "var(--sp-8)" }}>
        {agentKeys.map((key) => {
          const catTasks = tasks.filter((t) => t.agent === key);
          if (catTasks.length === 0) return null;
          const top = catTasks[0];
          return (
            <div key={key} className="jarvis-bullet">
              <span className="jarvis-bullet-dot" style={{ background: AGENT_COLOR[key], opacity: 1 }} />
              <span>
                <strong>{AGENT_LABEL[key]}:</strong> {top.headline}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  const hasCallbackAndDispute =
    Boolean(client.respond?.callbackOverdue) &&
    Boolean(client.settle?.invoices?.some((inv) => inv.status === "disputed"));

  let recoText = "";
  if (hasCallbackAndDispute) {
    recoText = `Call ${firstName} and resolve the invoice dispute and callback together.`;
  } else if (tasks.length > 0) {
    const topTask = tasks[0];
    recoText = `Start with ${firstName}'s ${AGENT_LABEL[topTask.agent]} — ${topTask.headline}.`;
  }

  const summaryBody = (
    <>
      {summaryChildren}
      {recoText ? (
        <div className="jarvis-recommendation" style={{ marginTop: "var(--sp-12)" }}>
          <div className="jarvis-recommendation-icon">✦</div>
          <div>
            <div className="jarvis-recommendation-label">Recommended action</div>
            <div className="jarvis-recommendation-text">{recoText}</div>
          </div>
        </div>
      ) : null}
    </>
  );

  slides.push({
    key: "summary",
    tag: "Summary",
    tagClass: "tag-insight",
    children: summaryBody,
  });

  if (client.aiLearned) {
    const al = client.aiLearned;
    const patLines: string[] = [];
    if (al.bestContactTime) patLines.push(`Best contact time: ${al.bestContactTime}`);
    if (al.avgResponseTime) patLines.push(`Avg response: ${al.avgResponseTime}`);
    if (al.paymentPattern) patLines.push(`Payment: ${al.paymentPattern}`);
    if (al.documentPattern) patLines.push(`Documents: ${al.documentPattern}`);
    if (al.callPattern) patLines.push(al.callPattern);
    if (patLines.length > 0) {
      slides.push({
        key: "pattern",
        tag: "Pattern",
        tagClass: "tag-pattern",
        children: (
          <>
            <div className="jarvis-signal">{firstName}&apos;s communication patterns</div>
            <div className="jarvis-situation">
              {patLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
            <div className="jarvis-evidence">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              Based on historical interaction data
            </div>
          </>
        ),
      });
    }
  }

  return slides;
}

export function WorkspaceJarvisCommand({
  client,
  tasks,
  firstName,
  onOpenWorkspace,
}: WorkspaceJarvisCommandProps) {
  const slides = useMemo(() => buildSlides(client, tasks, firstName), [client, tasks, firstName]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [client.id]);
  const slide = slides[index] ?? slides[0];
  const total = slides.length;

  if (!slide) return null;

  const prevDisabled = index === 0;
  const nextDisabled = index >= total - 1;

  return (
    <div className="jarvis-panel" style={{ marginBottom: "var(--sp-16)" }}>
      <div className="jarvis-header">
        <div className="jarvis-logo">
          <span className="jarvis-sparkle">✦</span>Insight
        </div>
        {total > 1 ? (
          <div className="jarvis-nav">
            <button
              type="button"
              className="jarvis-nav-btn"
              disabled={prevDisabled}
              aria-label="Previous insight"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="jarvis-counter">
              {index + 1} / {total}
            </span>
            <button
              type="button"
              className="jarvis-nav-btn"
              disabled={nextDisabled}
              aria-label="Next insight"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
      <div className="jarvis-body">
        {slide.tag !== "Summary" ? <span className={`jarvis-tag ${slide.tagClass}`}>{slide.tag}</span> : null}
        {slide.children}
        <div className="jarvis-actions">
          <button type="button" className="jarvis-dismiss">
            Dismiss
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenWorkspace}>
            Open Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
