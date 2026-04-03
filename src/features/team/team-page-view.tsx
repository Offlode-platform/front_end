"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usersApi } from "@/lib/api/users";
import { clientAssignmentsApi } from "@/lib/api/client-assignments-api";
import type { User } from "@/types/users";
import type { ClientAssignment } from "@/types/client-assignments";
import { TeamList } from "./components/team-list";
import { TeamDetailPanel } from "./components/team-detail-panel";
import { TeamInviteModal } from "./components/team-invite-modal";

export function TeamPageView() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [assignments, setAssignments] = useState<ClientAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, assignmentsData] = await Promise.all([
        usersApi.list(),
        clientAssignmentsApi.list(),
      ]);
      setUsers(usersData);
      setAssignments(assignmentsData);
    } catch {
      setError("Unable to load team. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Group assignments by user_id
  const assignmentsByUser = useMemo(() => {
    const map = new Map<string, ClientAssignment[]>();
    for (const a of assignments) {
      if (!a.user_id || !a.is_assigned) continue;
      const list = map.get(a.user_id);
      if (list) {
        list.push(a);
      } else {
        map.set(a.user_id, [a]);
      }
    }
    return map;
  }, [assignments]);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users.filter((u) => u.is_active);
    return users.filter(
      (u) =>
        u.is_active &&
        (u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q))
    );
  }, [users, search]);

  // Active member count
  const activeCount = useMemo(
    () => users?.filter((u) => u.is_active).length ?? 0,
    [users]
  );

  // Selected user for detail panel
  const selectedUser = useMemo(
    () => users?.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  // Organization ID from first user (for invite modal)
  const organizationId = users?.[0]?.organization_id ?? "";

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId);
  }

  function handleClosePanel() {
    setSelectedUserId(null);
  }

  async function handleInviteCreated() {
    setIsInviteOpen(false);
    await loadData();
  }

  async function handleUserDeactivated() {
    setSelectedUserId(null);
    await loadData();
  }

  async function handleAssignmentChanged() {
    try {
      const newAssignments = await clientAssignmentsApi.list();
      setAssignments(newAssignments);
    } catch {
      console.error("[TeamPageView] Failed to reload assignments");
    }
  }

  return (
    <div
      className="page active"
      id="page-team"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Scrollable content: page-bar + team list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 0,
            background: "var(--canvas-bg)",
          }}
        >
          {/* Page bar (scrolls with content) */}
          <div
            className="page-bar"
            style={{
              padding: "var(--sp-16) var(--sp-32)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="pg-subtitle" style={{ margin: 0 }}>
              {activeCount} member{activeCount !== 1 ? "s" : ""} &middot; All
              active
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)", flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsInviteOpen(true)}
              >
                Invite
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ padding: "0 var(--sp-32)", marginBottom: "var(--sp-8)" }}>
            <div className="ws-search" style={{ maxWidth: 320 }}>
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Team member cards */}
          <TeamList
            users={filteredUsers}
            isLoading={isLoading}
            error={error}
            assignmentsByUser={assignmentsByUser}
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
            onOpenInvite={() => setIsInviteOpen(true)}
          />
        </div>

        {/* Detail panel */}
        {selectedUser && (
          <TeamDetailPanel
            user={selectedUser}
            assignments={assignmentsByUser.get(selectedUser.id) ?? []}
            allUsers={users ?? []}
            assignmentsByUser={assignmentsByUser}
            onClose={handleClosePanel}
            onDeactivated={handleUserDeactivated}
            onAssignmentChanged={handleAssignmentChanged}
          />
        )}
      </div>

      {/* Invite modal */}
      {isInviteOpen && (
        <TeamInviteModal
          organizationId={organizationId}
          onClose={() => setIsInviteOpen(false)}
          onCreated={handleInviteCreated}
        />
      )}
    </div>
  );
}
