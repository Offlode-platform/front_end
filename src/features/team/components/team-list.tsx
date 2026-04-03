import type { User } from "@/types/users";
import type { ClientAssignment } from "@/types/client-assignments";
import { TeamMemberCard } from "./team-member-card";

export type TeamListProps = {
  users: User[] | null;
  isLoading: boolean;
  error: string | null;
  assignmentsByUser: Map<string, ClientAssignment[]>;
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  onOpenInvite: () => void;
};

export function TeamList({
  users,
  isLoading,
  error,
  assignmentsByUser,
  selectedUserId,
  onSelectUser,
  onOpenInvite,
}: TeamListProps) {
  if (isLoading && !users) {
    return (
      <div className="ws-empty-watermark">
        <div className="ws-empty-title">Loading team members...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ws-empty-watermark">
        <div className="ws-empty-title">Unable to load team</div>
        <div className="ws-empty-desc">{error}</div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="ws-empty-watermark">
        <div className="ws-empty-title">No team members yet</div>
        <div className="ws-empty-desc">
          Get started by inviting your first team member.
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ marginTop: "var(--sp-12)" }}
          onClick={onOpenInvite}
        >
          Invite
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-8)",
        padding: "var(--sp-16) var(--sp-32) var(--sp-48)",
      }}
    >
      {users.map((user, idx) => (
        <TeamMemberCard
          key={user.id}
          user={user}
          clientCount={assignmentsByUser.get(user.id)?.length ?? 0}
          isSelected={selectedUserId === user.id}
          onClick={() => onSelectUser(user.id)}
          animationDelay={idx * 40}
        />
      ))}
    </div>
  );
}
