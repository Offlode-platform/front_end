"use client";

import { Bell } from "lucide-react";

const NOTIFICATIONS = [
  { text: "TechCorp Solutions uploaded 3 documents", time: "5 minutes ago" },
  { text: "Sarah Mitchell requested a callback", time: "12 minutes ago" },
  { text: "Green Building Co paid invoice #2024-087", time: "1 hour ago" },
];

export function ShellNotifications() {
  return (
    <div className="shell-dropdown-wrap">
      <button type="button" className="shell-notif offlode-shell__icon-btn" aria-label="Notifications">
        <Bell size={16} />
        <span className="shell-notif-badge" />
      </button>
      <div className="shell-dropdown">
        <div className="shell-dropdown-title">Notifications</div>
        <div className="shell-dropdown-list">
          {NOTIFICATIONS.map((item) => (
            <div key={item.text} className="shell-dropdown-row">
              <div>{item.text}</div>
              <div className="shell-create-hint">{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
