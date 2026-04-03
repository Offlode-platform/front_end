export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(role: string): string {
  switch (role.toLowerCase()) {
    case "owner":
      return "var(--brand)";
    case "admin":
      return "#8b5cf6";
    case "manager":
      return "#22a06b";
    default:
      return "var(--brand)";
  }
}

export function getRoleBadgeStyles(role: string): {
  background: string;
  color: string;
} {
  switch (role.toLowerCase()) {
    case "owner":
      return {
        background: "rgba(53,126,146,0.08)",
        color: "var(--brand)",
      };
    case "admin":
      return {
        background: "rgba(139,92,246,0.08)",
        color: "#8b5cf6",
      };
    case "manager":
      return {
        background: "var(--clr-divider)",
        color: "var(--clr-secondary)",
      };
    default:
      return {
        background: "var(--clr-divider)",
        color: "var(--clr-secondary)",
      };
  }
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return "Just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function formatJoinDate(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

const PERMISSION_LABELS: Record<string, string> = {
  client_visibility: "Client visibility",
  document_chasing: "Documents",
  upload_portal: "Upload Portal",
  ai_receptionist: "AI Receptionist",
  billing_module: "Payments",
  reporting: "Reports",
  firm_settings: "Settings",
  can_override_ai_validation: "AI override",
};

export function getPermissionLabel(key: string): string {
  return PERMISSION_LABELS[key] ?? key;
}

export function getPermissionValueColor(value: string): string {
  const lower = value.toLowerCase();
  if (
    lower === "full" ||
    lower === "all_clients" ||
    lower === "all clients" ||
    lower === "firm_wide" ||
    lower === "firm-wide" ||
    lower === "configure" ||
    lower === "upload" ||
    lower === "yes"
  ) {
    return "var(--success)";
  }
  if (lower === "none" || lower === "no") {
    return "var(--clr-faint)";
  }
  return "var(--clr-secondary)";
}

export function formatPermissionValue(key: string, value: unknown): string {
  if (key === "can_override_ai_validation") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string") {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return String(value);
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner:
    "Full platform access. Can add and remove any user, assign clients to any team member, and view all client portfolios across the firm.",
  admin:
    "Can view all client portfolios, assign clients to other users, and add or remove team members. Cannot remove the Owner.",
  manager:
    "Can only view their own assigned client portfolio. Cannot add or remove users, or reassign clients.",
};

export function getRoleDescription(role: string): string {
  return ROLE_DESCRIPTIONS[role.toLowerCase()] ?? "";
}
