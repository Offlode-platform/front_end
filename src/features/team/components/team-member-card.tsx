import type { User } from "@/types/users";
import {
  getInitials,
  getAvatarColor,
  getRoleBadgeStyles,
  formatRelativeTime,
} from "./team-utils";

export type TeamMemberCardProps = {
  user: User;
  clientCount: number;
  isSelected: boolean;
  onClick: () => void;
  animationDelay?: number;
};

export function TeamMemberCard({
  user,
  clientCount,
  isSelected,
  onClick,
  animationDelay = 0,
}: TeamMemberCardProps) {
  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.role);
  const roleBadge = getRoleBadgeStyles(user.role);
  const roleLabel =
    user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();

  return (
    <div
      className="ws-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-16)",
        padding: "var(--sp-12) var(--sp-16)",
        cursor: "pointer",
        animation: `tmFadeIn 0.2s ease ${animationDelay}ms both`,
        borderColor: isSelected ? "var(--brand)" : undefined,
        boxShadow: isSelected
          ? "0 0 0 1px var(--brand), 0 2px 8px rgba(53,126,146,0.08)"
          : undefined,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: avatarColor,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "var(--fw-semibold)" as string,
          fontSize: "var(--text-sm)",
          flexShrink: 0,
          letterSpacing: "0.02em",
        }}
      >
        {initials}
      </div>

      {/* Name + Email */}
      <div style={{ minWidth: 120, maxWidth: 220, flex: "1 1 170px", overflow: "hidden" }}>
        <div
          style={{
            fontWeight: "var(--fw-medium)" as string,
            color: "var(--clr-secondary)",
            fontSize: "var(--text-sm)",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.name}
        </div>
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--clr-muted)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.email}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 28,
          background: "var(--clr-divider-strong)",
          flexShrink: 0,
        }}
      />

      {/* Stats */}
      <div style={{ display: "flex", flex: "0 0 auto", minWidth: 180 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--fw-semibold)" as string,
              color: "var(--clr-secondary)",
            }}
          >
            {clientCount}
          </div>
          <div
            style={{
              fontSize: "var(--text-2xs)",
              color: "var(--clr-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--sp-2)",
            }}
          >
            Clients
          </div>
        </div>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--fw-semibold)" as string,
              color: "var(--clr-secondary)",
            }}
          >
            {formatRelativeTime(user.last_login_at)}
          </div>
          <div
            style={{
              fontSize: "var(--text-2xs)",
              color: "var(--clr-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--sp-2)",
            }}
          >
            Last active
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 28,
          background: "var(--clr-divider-strong)",
          flexShrink: 0,
        }}
      />

      {/* Role badge */}
      <div
        style={{
          padding: "var(--sp-4) var(--sp-12)",
          borderRadius: "var(--r-full)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--fw-medium)" as string,
          background: roleBadge.background,
          color: roleBadge.color,
          flexShrink: 0,
        }}
      >
        {roleLabel}
      </div>
    </div>
  );
}
