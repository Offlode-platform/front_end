"use client";

import { Plus } from "lucide-react";

const CREATE_ITEMS = [
  { label: "Add Client", hint: "New client record" },
  { label: "Create Invoice", hint: "Bill a client" },
  { label: "Information Set", hint: "Request documents from a client" },
  { label: "New Event", hint: "Meeting, scheduled call, or callback" },
  { label: "Invite Team Member", hint: "Add someone to the practice" },
];

export function ShellCreateMenu() {
  return (
    <div className="shell-create-wrap">
      <button type="button" className="shell-create-btn offlode-shell__icon-btn" aria-label="Quick create">
        <Plus size={16} />
      </button>
      <div className="shell-create-menu">
        {CREATE_ITEMS.map((item) => (
          <button key={item.label} type="button" className="shell-create-item">
            <div className="shell-create-text">
              <div className="shell-create-label">{item.label}</div>
              <div className="shell-create-hint">{item.hint}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
