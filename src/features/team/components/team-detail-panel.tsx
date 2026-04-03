"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { User } from "@/types/users";
import type { ClientAssignment } from "@/types/client-assignments";
import { usersApi } from "@/lib/api/users";
import { TeamReassignPopup } from "./team-reassign-popup";
import {
  getInitials,
  getAvatarColor,
  getRoleBadgeStyles,
  formatRelativeTime,
  formatJoinDate,
  getPermissionLabel,
  getPermissionValueColor,
  formatPermissionValue,
  getRoleDescription,
} from "./team-utils";

export type TeamDetailPanelProps = {
  user: User;
  assignments: ClientAssignment[];
  allUsers: User[];
  assignmentsByUser: Map<string, ClientAssignment[]>;
  onClose: () => void;
  onDeactivated: () => void;
  onAssignmentChanged: () => void;
};

const PERMISSION_KEYS = [
  "client_visibility",
  "document_chasing",
  "ai_receptionist",
  "billing_module",
  "reporting",
  "firm_settings",
  "can_override_ai_validation",
] as const;

export function TeamDetailPanel({
  user,
  assignments,
  allUsers,
  assignmentsByUser,
  onClose,
  onDeactivated,
  onAssignmentChanged,
}: TeamDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [reassignPopup, setReassignPopup] = useState<{
    assignment: ClientAssignment;
    clientName: string;
    rect: DOMRect;
  } | null>(null);

  // Trigger open animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true));
  }, []);

  // Escape key
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.role);
  const roleBadge = getRoleBadgeStyles(user.role);
  const roleLabel =
    user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();

  const filteredAssignments = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((a) =>
      (a.client_name ?? "").toLowerCase().includes(q)
    );
  }, [assignments, clientSearch]);

  const otherUsers = useMemo(
    () => allUsers.filter((u) => u.id !== user.id && u.is_active),
    [allUsers, user.id]
  );

  const isOwner = user.role.toLowerCase() === "owner";

  // Build permission display values
  const permissionValues = useMemo(() => {
    const perm = user.manager_permission;
    if (!perm) {
      // Owner/Admin without explicit permissions -> show "Full" for all
      return PERMISSION_KEYS.map((key) => ({
        key,
        label: getPermissionLabel(key),
        value: key === "can_override_ai_validation" ? "Yes" : "Full",
        color: "var(--success)",
      }));
    }
    return PERMISSION_KEYS.map((key) => {
      const raw = perm[key as keyof typeof perm];
      const display = formatPermissionValue(key, raw);
      return {
        key,
        label: getPermissionLabel(key),
        value: display,
        color: getPermissionValueColor(display),
      };
    });
  }, [user.manager_permission]);

  async function handleDeactivate() {
    if (!confirm(`Remove ${user.name} from the team?`)) return;
    setIsDeactivating(true);
    try {
      await usersApi.deactivate(user.id, { reason: "Removed by team admin" });
      onDeactivated();
    } catch {
      console.error("[TeamDetailPanel] Failed to deactivate user");
    } finally {
      setIsDeactivating(false);
    }
  }

  function handleReassignClick(
    e: React.MouseEvent<HTMLButtonElement>,
    assignment: ClientAssignment
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    setReassignPopup({
      assignment,
      clientName: assignment.client_name ?? "Unknown",
      rect,
    });
  }

  return (
    <div
      ref={panelRef}
      className={`tm-panel${isOpen ? " open" : ""}`}
    >
      <div className="tm-panel-inner" id="tmPanelBody">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "sticky",
            top: 0,
            float: "right",
            width: 32,
            height: 32,
            borderRadius: "var(--r-sm)",
            background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: 18,
            color: "var(--clr-secondary)",
            lineHeight: 1,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            marginBottom: "-32px",
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--sp-6)",
            marginBottom: "var(--sp-20)",
            paddingTop: "var(--sp-4)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: avatarColor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "var(--fw-semibold)" as string,
              fontSize: "var(--text-lg)",
              letterSpacing: "0.02em",
            }}
          >
            {initials}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: "var(--fw-semibold)" as string,
              color: "var(--clr-secondary)",
              textAlign: "center",
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-8)",
            }}
          >
            <span
              style={{
                padding: "var(--sp-4) var(--sp-12)",
                borderRadius: "var(--r-full)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--fw-medium)" as string,
                background: roleBadge.background,
                color: roleBadge.color,
              }}
            >
              {roleLabel}
            </span>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--clr-muted)",
              }}
            >
              {user.email}
            </span>
          </div>
        </div>

        {/* Member Info card */}
        <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--fw-semibold)" as string,
              color: "var(--clr-secondary)",
              marginBottom: "var(--sp-12)",
            }}
          >
            Member Info
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 0,
            }}
          >
            <div className="ws-settings-row">
              <span className="ws-settings-label">Clients</span>
              <span className="ws-settings-value" style={{ fontWeight: "var(--fw-semibold)" as string }}>
                {assignments.length}
              </span>
            </div>
            <div className="ws-settings-row">
              <span className="ws-settings-label">Joined</span>
              <span className="ws-settings-value">
                {formatJoinDate(user.created_at)}
              </span>
            </div>
            <div className="ws-settings-row">
              <span className="ws-settings-label">Last active</span>
              <span className="ws-settings-value">
                {formatRelativeTime(user.last_login_at)}
              </span>
            </div>
            <div className="ws-settings-row">
              <span className="ws-settings-label">Email verified</span>
              <span
                className="ws-settings-value"
                style={{
                  color: user.email_verified
                    ? "var(--success)"
                    : "var(--clr-muted)",
                }}
              >
                {user.email_verified ? "Yes" : "No"}
              </span>
            </div>
            <div className="ws-settings-row">
              <span className="ws-settings-label">2FA</span>
              <span
                className="ws-settings-value"
                style={{
                  color: user.two_factor_enabled
                    ? "var(--success)"
                    : "var(--clr-muted)",
                }}
              >
                {user.two_factor_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Permissions card */}
        <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--fw-semibold)" as string,
              color: "var(--clr-secondary)",
              marginBottom: "var(--sp-12)",
            }}
          >
            Permissions
          </div>
          {permissionValues.map((p) => (
            <div key={p.key} className="ws-settings-row">
              <span className="ws-settings-label">{p.label}</span>
              <span className="ws-settings-value" style={{ color: p.color }}>
                {p.value}
              </span>
            </div>
          ))}
        </div>

        {/* Assigned Clients card */}
        <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--sp-12)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--fw-semibold)" as string,
                color: "var(--clr-secondary)",
              }}
            >
              Assigned Clients{" "}
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--clr-muted)",
                  fontWeight: "var(--fw-normal)" as string,
                }}
              >
                {assignments.length}
              </span>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "var(--sp-8)" }}>
            <svg
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                stroke: "var(--clr-muted)",
                fill: "none",
                strokeWidth: 2,
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="input"
              placeholder="Search clients..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              style={{ paddingLeft: 28, fontSize: "var(--text-xs)" }}
            />
          </div>

          {/* Client list */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {filteredAssignments.length === 0 ? (
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--clr-muted)",
                  padding: "var(--sp-12)",
                  textAlign: "center",
                }}
              >
                No assigned clients
              </div>
            ) : (
              filteredAssignments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-8)",
                    padding: "var(--sp-6) var(--sp-4)",
                    borderRadius: "var(--r-sm)",
                  }}
                >
                  {/* Health dot */}
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--success)",
                      flexShrink: 0,
                    }}
                  />
                  {/* Client name */}
                  <div
                    style={{
                      flex: 1,
                      fontSize: "var(--text-sm)",
                      color: "var(--clr-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.client_name ?? "Unknown client"}
                  </div>
                  {/* Reassign button */}
                  <button
                    type="button"
                    onClick={(e) => handleReassignClick(e, a)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "var(--r-sm)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--clr-muted)",
                      flexShrink: 0,
                    }}
                    title="Reassign client"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 3h5v5" />
                      <path d="M21 3 9 15" />
                      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Role Description card */}
        <div className="ws-card" style={{ marginBottom: "var(--sp-16)" }}>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--fw-semibold)" as string,
              color: "var(--clr-secondary)",
              marginBottom: "var(--sp-8)",
            }}
          >
            Role: {roleLabel}
          </div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--clr-muted)",
              lineHeight: 1.6,
            }}
          >
            {getRoleDescription(user.role)}
          </div>
        </div>

        {/* Account card (danger zone) - non-Owner only */}
        {!isOwner && (
          <div
            className="ws-card"
            style={{
              borderColor: "rgba(239,68,68,0.15)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--fw-semibold)" as string,
                color: "var(--danger)",
                marginBottom: "var(--sp-12)",
              }}
            >
              Account
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--clr-secondary)",
                  }}
                >
                  Remove from team
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--clr-muted)",
                  }}
                >
                  Clients will need reassigning
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm"
                disabled={isDeactivating}
                onClick={handleDeactivate}
                style={{
                  background: "rgba(239,68,68,0.08)",
                  color: "var(--danger)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                {isDeactivating ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reassign popup */}
      {reassignPopup && (
        <TeamReassignPopup
          clientName={reassignPopup.clientName}
          assignment={reassignPopup.assignment}
          otherUsers={otherUsers}
          assignmentsByUser={assignmentsByUser}
          anchorRect={reassignPopup.rect}
          onClose={() => setReassignPopup(null)}
          onReassigned={() => {
            setReassignPopup(null);
            onAssignmentChanged();
          }}
        />
      )}
    </div>
  );
}
