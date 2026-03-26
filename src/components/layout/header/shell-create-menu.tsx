"use client";

import { Plus } from "lucide-react";

const CREATE_ITEMS = [
  { label: "Add Client", hint: "New client record" },
  { label: "Create Invoice", hint: "Bill a client" },
  { label: "Information Set", hint: "Request documents" },
  { label: "New Event", hint: "Meeting or callback" },
];

export function ShellCreateMenu() {
  return (
    <div className="shell-create-wrap">
      <button type="button" className="offlode-shell__icon-btn" aria-label="Quick create">
        <Plus size={16} />
      </button>
      <div className="shell-create-menu">
        {CREATE_ITEMS.map((item) => (
          <button key={item.label} type="button" className="shell-create-item">
            <span className="shell-create-label">{item.label}</span>
            <span className="shell-create-hint">{item.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
