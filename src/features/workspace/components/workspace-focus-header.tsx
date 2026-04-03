"use client";

import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import type { ListedClient } from "@/types/clients";

export type WorkspaceTab = "overview" | "contact" | "items" | "activity" | "settings";

type Props = {
  client: ListedClient;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
};

const TABS: { key: WorkspaceTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "contact", label: "Contact" },
  { key: "items", label: "Items" },
  { key: "activity", label: "Activity" },
  { key: "settings", label: "Settings" },
];

function isVip(client: ListedClient): boolean {
  return client.chase_frequency_days <= 7;
}

export function WorkspaceFocusHeader({
  client,
  activeTab,
  onTabChange,
  onBack,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: Props) {
  return (
    <div className="ws-focus-header ws-fade">
      <div className="ws-header-row1">
        <div className="ws-header-left">
          <button type="button" className="ws-back" onClick={onBack} aria-label="Back to list">
            <ArrowLeft size={16} />
          </button>
          <div className="ws-focus-identity">
            <div className="ws-focus-name">{client.name}</div>
            <div className="ws-focus-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {client.email || "No email"}
              {isVip(client) && (
                <span style={{ color: "var(--vip)", marginLeft: 6, fontSize: "var(--text-xs)" }}>
                  VIP
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="ws-header-right">
          <div className="ws-client-nav">
            <button
              type="button"
              className="ws-nav-btn"
              onClick={onPrev}
              disabled={!hasPrev}
              aria-label="Previous client"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              className="ws-nav-btn"
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Next client"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="ws-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`ws-tab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
