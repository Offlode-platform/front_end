"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

const NOTIFICATIONS = [
  { text: "TechCorp Solutions uploaded 3 documents", time: "5 minutes ago" },
  { text: "Sarah Mitchell requested a callback", time: "12 minutes ago" },
  { text: "Green Building Co paid invoice #2024-087", time: "1 hour ago" },
];

export function ShellNotifications() {
  const [open, setOpen] = useState(false);

  return (
    <div className="shell-notif-wrap">
      <button
        type="button"
        className="shell-notif"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={16} />
        <span className="shell-notif-badge" />
      </button>
      <div className={`shell-notif-dropdown ${open ? "open" : ""}`}>
        <div className="shell-notif-dd-header">
          <span className="shell-notif-dd-title">Notifications</span>
        </div>
        <div className="shell-notif-list">
          {NOTIFICATIONS.map((item) => (
            <div key={item.text} className="shell-notif-item unread">
              <span className="shell-notif-dot-indicator" />
              <div className="shell-notif-body">
                <div className="shell-notif-text">{item.text}</div>
                <div className="shell-notif-time">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
