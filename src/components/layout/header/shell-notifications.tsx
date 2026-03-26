"use client";

import { Bell } from "lucide-react";

const NOTIFICATIONS = [
  "TechCorp Solutions uploaded 3 documents",
  "Sarah Mitchell requested a callback",
  "Green Building Co paid invoice #2024-087",
];

export function ShellNotifications() {
  return (
    <div className="shell-dropdown-wrap">
      <button type="button" className="offlode-shell__icon-btn" aria-label="Notifications">
        <Bell size={16} />
      </button>
      <div className="shell-dropdown">
        <div className="shell-dropdown-title">Notifications</div>
        <div className="shell-dropdown-list">
          {NOTIFICATIONS.map((item) => (
            <div key={item} className="shell-dropdown-row">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
