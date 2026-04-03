import { useEffect, useRef } from "react";
import type { User } from "@/types/users";
import type { ClientAssignment } from "@/types/client-assignments";
import { clientAssignmentsApi } from "@/lib/api/client-assignments-api";
import { getInitials, getAvatarColor } from "./team-utils";

export type TeamReassignPopupProps = {
  clientName: string;
  assignment: ClientAssignment;
  otherUsers: User[];
  assignmentsByUser: Map<string, ClientAssignment[]>;
  anchorRect: DOMRect;
  onClose: () => void;
  onReassigned: () => void;
};

export function TeamReassignPopup({
  clientName,
  assignment,
  otherUsers,
  assignmentsByUser,
  anchorRect,
  onClose,
  onReassigned,
}: TeamReassignPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleOutsideClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  // Position below trigger, right-aligned
  let top = anchorRect.bottom + 4;
  let left = anchorRect.right - 260;
  if (left < 16) left = 16;
  if (top + 300 > window.innerHeight - 16) {
    top = anchorRect.top - 300 - 4;
  }

  async function handleReassign(targetUserId: string) {
    try {
      await clientAssignmentsApi.assign({
        client_id: assignment.client_id,
        user_id: targetUserId,
      });
      onReassigned();
    } catch {
      console.error("[TeamReassignPopup] Failed to reassign client");
    }
    onClose();
  }

  return (
    <div
      ref={popupRef}
      className="dropdown open"
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 200,
        minWidth: 240,
        maxWidth: 280,
      }}
    >
      <div
        style={{
          padding: "var(--sp-8) var(--sp-12)",
          fontSize: "var(--text-2xs)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--clr-muted)",
          fontWeight: "var(--fw-medium)" as string,
        }}
      >
        Reassign {clientName}
      </div>
      <div
        style={{
          height: 1,
          background: "var(--clr-divider)",
          margin: "0 var(--sp-8)",
        }}
      />
      <div style={{ maxHeight: 240, overflowY: "auto" }}>
        {otherUsers.map((member) => {
          const memberClientCount =
            assignmentsByUser.get(member.id)?.length ?? 0;
          return (
            <div
              key={member.id}
              className="dropdown-item"
              role="button"
              tabIndex={0}
              onClick={() => handleReassign(member.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleReassign(member.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-8)",
                padding: "var(--sp-8) var(--sp-12)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: getAvatarColor(member.role),
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--fw-semibold)" as string,
                  flexShrink: 0,
                }}
              >
                {getInitials(member.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: "var(--fw-semibold)" as string,
                    fontSize: "var(--text-sm)",
                    color: "var(--clr-secondary)",
                  }}
                >
                  {member.name}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--clr-muted)",
                  }}
                >
                  {memberClientCount} client
                  {memberClientCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
