"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Calendar, CircleUserRound, FileText, ReceiptText, UserPlus } from "lucide-react";

const CREATE_ITEMS = [
  { label: "Add Client", hint: "New client record", icon: CircleUserRound },
  { label: "Create Invoice", hint: "Bill a client", icon: ReceiptText },
  { label: "Information Set", hint: "Request documents from a client", icon: FileText },
  { label: "New Event", hint: "Meeting, scheduled call, or callback", icon: Calendar },
  { label: "Invite Team Member", hint: "Add someone to the practice", icon: UserPlus },
];

export function ShellCreateMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!wrapRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  return (
    <div className="shell-create-wrap" ref={wrapRef}>
      <button
        type="button"
        className="shell-create-btn"
        aria-label="Quick create"
        onClick={() => setOpen((v) => !v)}
      >
        <Plus size={16} />
      </button>
      <div className={`shell-create-menu ${open ? "open" : ""}`}>
        {CREATE_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              {index === 4 ? <div className="shell-create-sep" /> : null}
              <button type="button" className="shell-create-item">
                <Icon size={16} />
                <div className="shell-create-text">
                  <div className="shell-create-label">{item.label}</div>
                  <div className="shell-create-hint">{item.hint}</div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
