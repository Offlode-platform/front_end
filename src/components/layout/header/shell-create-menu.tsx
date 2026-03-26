"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CREATE_ITEMS = [
  { label: "Add Client", hint: "New client record" },
  { label: "Create Invoice", hint: "Bill a client" },
  { label: "Information Set", hint: "Request documents from a client" },
  { label: "New Event", hint: "Meeting, scheduled call, or callback" },
  { label: "Invite Team Member", hint: "Add someone to the practice" },
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
