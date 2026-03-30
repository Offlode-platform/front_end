import type { WorkspaceDemoClient } from "./types";

export type WorkspaceTaskAgent = "collect" | "respond" | "settle";
export type WorkspaceTaskCategory = "documents" | "calls" | "payments";
export type TaskSeverity =
  | "escalation_risk"
  | "due_today"
  | "needs_decision"
  | "waiting"
  | "handled";

export type WorkspaceTask = {
  id: string;
  category: WorkspaceTaskCategory;
  agent: WorkspaceTaskAgent;
  pill: string;
  headline: string;
  snippet?: string;
  severity: TaskSeverity;
  priority: number;
};

function firstNameFrom(client: WorkspaceDemoClient): string {
  const raw = client.contact ?? client.name;
  return raw.split(" ")[0] ?? "";
}

/** Mirrors `buildTaskStream` in offlode-v5-unified-111.html */
export function buildWorkspaceTaskStream(client: WorkspaceDemoClient): WorkspaceTask[] {
  const tasks: WorkspaceTask[] = [];
  const firstName = firstNameFrom(client);

  const docSets = client.collect?.documentSets;
  if (docSets && client.collect) {
    const cd = client.collect;
    const overdueItems: { item: { name: string; daysOverdue?: number }; set: { deadline?: string } }[] = [];
    const pendingItems: { item: { name: string }; set: unknown }[] = [];
    const reviewItems: { item: { name: string; aiCheck?: string; aiCheckNote?: string }; set: unknown }[] = [];
    let totalItems = 0;
    let receivedCount = 0;
    docSets.forEach((set) => {
      set.items?.forEach((item) => {
        totalItems += 1;
        if (item.status === "overdue") overdueItems.push({ item, set });
        else if (item.status === "pending") pendingItems.push({ item, set });
        else if (item.status === "review") reviewItems.push({ item, set });
        else if (item.status === "received") receivedCount += 1;
      });
    });
    const cc = cd.chaseCount ?? 0;
    let earliestDeadline: string | null = null;
    docSets.forEach((s) => {
      if (s.deadline && (!earliestDeadline || s.deadline < earliestDeadline)) earliestDeadline = s.deadline;
    });

    if (overdueItems.length > 0) {
      const maxOD = Math.max(...overdueItems.map((o) => o.item.daysOverdue ?? 0));
      tasks.push({
        id: "collect-overdue",
        category: "documents",
        agent: "collect",
        pill: "Documents overdue",
        headline: `${overdueItems.length} ${overdueItems.length === 1 ? "item" : "items"} still missing`,
        snippet: `${earliestDeadline ? `Deadline ${earliestDeadline}. ` : ""}Chase #${cc} sent${
          cd.lastChaseOpened === false ? ", not opened." : cd.lastChaseOpened ? ", opened but no response." : "."
        }`,
        severity: "escalation_risk",
        priority: maxOD > 14 ? 0 : 1,
      });
    }
    if (reviewItems.length > 0) {
      const hasWarning = reviewItems.some((r) => r.item.aiCheck === "warning");
      tasks.push({
        id: "collect-review",
        category: "documents",
        agent: "collect",
        pill: "Ready for review",
        headline: `${reviewItems.length} upload${reviewItems.length > 1 ? "s" : ""} received`,
        snippet: `${reviewItems
          .map((r) => r.item.name)
          .slice(0, 2)
          .join(", ")}${pendingItems.length > 0 ? `. ${pendingItems.length} still missing.` : ". Review needed."}`,
        severity: "needs_decision",
        priority: hasWarning ? 2 : 3,
      });
    }
    const wrongItems = reviewItems.filter((r) => r.item.aiCheck === "warning");
    if (wrongItems.length > 0) {
      tasks.push({
        id: "collect-wrong",
        category: "documents",
        agent: "collect",
        pill: "Wrong or incomplete",
        headline: `${wrongItems[0].item.name} needs correction`,
        snippet: wrongItems[0].item.aiCheckNote ?? "Upload issue detected. Corrected file needed.",
        severity: "needs_decision",
        priority: 2,
      });
    }
    if (pendingItems.length > 0 && overdueItems.length === 0) {
      const partial = receivedCount > 0 && pendingItems.length > 0;
      tasks.push({
        id: "collect-pending",
        category: "documents",
        agent: "collect",
        pill: partial ? "Partially complete" : "Awaiting upload",
        headline: partial
          ? `${receivedCount} of ${totalItems} items received`
          : `${pendingItems.length} document${pendingItems.length > 1 ? "s" : ""} requested`,
        snippet: partial
          ? `${pendingItems
              .map((p) => p.item.name)
              .slice(0, 2)
              .join(", ")} still missing.`
          : `Request sent${cc > 0 ? `. Chase #${cc} sent.` : ". Awaiting response."}`,
        severity: "waiting",
        priority: 5,
      });
    }
  }

  const r = client.respond;
  if (r && r.status !== "handled" && r.status !== "inactive") {
    const hasLinkedDispute =
      client.settle?.invoices?.some((inv) => inv.status === "disputed") ?? false;
    const linkedDisputeRef = hasLinkedDispute
      ? client.settle?.invoices?.find((inv) => inv.status === "disputed")
      : undefined;

    if (r.callbackOverdue) {
      const snippetParts: string[] = [];
      if (client.vip) snippetParts.push("VIP");
      snippetParts.push(`waiting since ${r.callTime ?? "yesterday"}`);
      if (hasLinkedDispute) snippetParts.push("about invoice dispute");
      else if (r.summary) snippetParts.push(`about ${r.summary.split(".")[0].toLowerCase()}`);
      tasks.push({
        id: "respond-callback-overdue",
        category: "calls",
        agent: "respond",
        pill: hasLinkedDispute ? "Complaint callback" : "Callback request overdue",
        headline: `Callback request — ${firstName} is waiting for a return call`,
        snippet: `${snippetParts.join(". ")}.`,
        severity: "escalation_risk",
        priority: 0,
      });
    } else if (r.pendingCallbacks && r.pendingCallbacks.length > 0) {
      tasks.push({
        id: "respond-callback-due",
        category: "calls",
        agent: "respond",
        pill: "Callback due today",
        headline: `Callback request — ${firstName} expects a return call today`,
        snippet: `${r.pendingCallbacks[0].reason ?? (r.summary ? r.summary.split(".")[0] : "General enquiry")}.`,
        severity: "due_today",
        priority: 2,
      });
    } else if (
      r.callType === "inbound" &&
      r.tags?.some((t) => t.includes("NEW") || t.toLowerCase().includes("enquiry") || t.includes("LEAD"))
    ) {
      tasks.push({
        id: "respond-enquiry",
        category: "calls",
        agent: "respond",
        pill: "New enquiry",
        headline: `Prospective client — ${firstName}`,
        snippet: `${r.summary ? r.summary.split(".")[0] : "New business enquiry"}.`,
        severity: "due_today",
        priority: 1,
      });
    } else if (r.callType === "voicemail" || r.callType === "inbound") {
      tasks.push({
        id: "respond-voicemail",
        category: "calls",
        agent: "respond",
        pill: r.callType === "voicemail" ? "Voicemail" : "Missed call",
        headline: `${r.callType === "voicemail" ? "Voicemail from " : "Missed call from "}${firstName}`,
        snippet: `${r.summary ? r.summary.split(".")[0] : "General enquiry"}. ${r.callTime ?? ""}.`,
        severity: "due_today",
        priority: 2,
      });
    } else if (r.callType === "meeting") {
      tasks.push({
        id: "respond-meeting",
        category: "calls",
        agent: "respond",
        pill: "Meeting follow-up",
        headline: `Meeting notes ready — ${firstName}`,
        snippet: `${r.summary ? r.summary.split(".")[0] : "Meeting recorded"}. ${r.callDuration ?? ""}.`,
        severity: "needs_decision",
        priority: 3,
      });
    }
  }

  const settleInvoices = client.settle?.invoices;
  if (settleInvoices) {
    const sd = client.settle;
    settleInvoices.forEach((inv) => {
      if (inv.status === "disputed") {
        tasks.push({
          id: `settle-dispute-${inv.id}`,
          category: "payments",
          agent: "settle",
          pill: "Payment dispute",
          headline: `£${inv.amount.toLocaleString("en-GB")} disputed — ${inv.id}`,
          snippet: `${inv.dispute?.reason ?? inv.description ?? ""}. ${
            inv.dispute?.raisedBy ? `Raised by ${inv.dispute.raisedBy}.` : ""
          }`,
          severity: "escalation_risk",
          priority: 0,
        });
      } else if (inv.status === "bounced") {
        tasks.push({
          id: `settle-bounced-${inv.id}`,
          category: "payments",
          agent: "settle",
          pill: "Payment bounced",
          headline: `Direct debit failed — £${inv.amount.toLocaleString("en-GB")}`,
          snippet: `${inv.description ?? ""}.`,
          severity: "escalation_risk",
          priority: 0,
        });
      } else if (inv.status === "overdue") {
        const remCount = inv.reminderCount ?? 0;
        tasks.push({
          id: `settle-overdue-${inv.id}`,
          category: "payments",
          agent: "settle",
          pill: "Payment overdue",
          headline: `£${inv.amount.toLocaleString("en-GB")} overdue ${inv.daysOverdue ?? "?"} days`,
          snippet: `${inv.id}. ${remCount > 0 ? `${remCount} reminder${remCount > 1 ? "s" : ""} sent` : "No reminders sent"}. ${inv.description ?? ""}.`,
          severity: "escalation_risk",
          priority: 1,
        });
      } else if (inv.status === "draft") {
        tasks.push({
          id: `settle-draft-${inv.id}`,
          category: "payments",
          agent: "settle",
          pill: "Draft invoice",
          headline: `£${Math.abs(inv.amount).toLocaleString("en-GB")} ready to send`,
          snippet: inv.description ?? inv.id,
          severity: "needs_decision",
          priority: 4,
        });
      } else if (inv.status === "sent") {
        tasks.push({
          id: `settle-sent-${inv.id}`,
          category: "payments",
          agent: "settle",
          pill: "Payment sent",
          headline: `£${inv.amount.toLocaleString("en-GB")} awaiting payment`,
          snippet: `${inv.id}. Due ${inv.dateDue ?? "within terms"}.`,
          severity: "waiting",
          priority: 6,
        });
      }
    });
  }

  tasks.sort((a, b) => a.priority - b.priority);
  return tasks;
}

export function getClientWorkspaceTaskCount(client: WorkspaceDemoClient): number {
  let count = 0;
  if (client.collect?.documentSets) {
    client.collect.documentSets.forEach((set) => {
      set.items?.forEach((item) => {
        if (item.status !== "received" && item.status !== "complete") count += 1;
      });
    });
  }
  if (client.respond && client.respond.status !== "handled" && client.respond.status !== "inactive") {
    if (client.respond.pendingCallbacks && client.respond.pendingCallbacks.length > 0) {
      count += client.respond.pendingCallbacks.length;
    } else if (client.respond.summary) count += 1;
  }
  if (client.settle?.invoices) {
    client.settle.invoices.forEach((inv) => {
      if (inv.status === "overdue" || inv.status === "disputed" || inv.status === "bounced" || inv.status === "draft") {
        count += 1;
      }
    });
  }
  return count;
}

export function listSeverityRaw(client: WorkspaceDemoClient): "action" | "review" | "handled" {
  const raw = client.urgentItem?.severity ?? "handled";
  if (raw === "action" || raw === "review") return raw;
  return "handled";
}
