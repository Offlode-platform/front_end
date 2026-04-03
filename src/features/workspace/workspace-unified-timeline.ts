import type { WorkspaceDemoClient } from "./types";

export type TimelineAgent = "documents" | "calls" | "payments";

export type UnifiedTimelineEvent = {
  time: string;
  text: string;
  detail: string;
  agent: TimelineAgent;
  sortKey: number;
};

function timeToSort(timeStr: string): number {
  if (!timeStr) return 0;
  const t = timeStr.toLowerCase();
  if (t.includes("just") || t.includes("now")) return 100;
  if (t.includes("hour")) {
    const h = parseInt(t, 10) || 1;
    return 90 - h;
  }
  if (t === "today") return 80;
  if (t === "yesterday") return 70;
  if (t.includes("day")) {
    const d = parseInt(t, 10) || 1;
    return 60 - d;
  }
  if (t.includes("week")) {
    const w = parseInt(t, 10) || 1;
    return 40 - w * 7;
  }
  if (t.includes("recently")) return 50;
  return 30;
}

/** Mirrors `_buildUnifiedTimeline` event collection from offlode-v5-unified-111.html */
export function buildUnifiedTimelineEvents(client: WorkspaceDemoClient, firstName: string): UnifiedTimelineEvent[] {
  const events: UnifiedTimelineEvent[] = [];

  const agentDataCollect = client.collect;
  if (agentDataCollect?.documentSets) {
    agentDataCollect.documentSets.forEach((set) => {
      set.items?.forEach((item) => {
        if (item.status === "received" || item.status === "review") {
          const time = item.receivedDate ?? "2 hours ago";
          events.push({
            time,
            text: `${item.name} uploaded`,
            detail: set.name ?? "",
            agent: "documents",
            sortKey: timeToSort(time),
          });
        }
      });
    });
    const cc = agentDataCollect.chaseCount ?? 0;
    if (cc > 0) {
      const time = agentDataCollect.lastChaseDate ?? "3 days ago";
      events.push({
        time,
        text: `Chase #${cc} sent`,
        detail: agentDataCollect.lastChaseOpened ? "Opened by client" : "Not yet opened",
        agent: "documents",
        sortKey: timeToSort(time),
      });
    }
  }

  const agentDataRespond = client.respond;
  if (agentDataRespond?.callHistory) {
    agentDataRespond.callHistory.forEach((call) => {
      const desc = `${call.type === "callback" ? "Callback request" : call.type === "meeting" ? "Meeting" : "Call"} — ${call.outcome ?? call.duration ?? ""}`;
      const time = call.time ?? "Recently";
      events.push({
        time,
        text: desc,
        detail: `Handled by ${call.handler ?? "AI"}`,
        agent: "calls",
        sortKey: timeToSort(time),
      });
    });
  }
  if (agentDataRespond?.callTime && !(agentDataRespond.callHistory?.length ?? 0)) {
    const time = agentDataRespond.callTime ?? "Recently";
    events.push({
      time,
      text: `${agentDataRespond.callType === "callback" ? "Callback request" : "Call received"} from ${firstName}`,
      detail: (agentDataRespond.summary ?? "").split(".")[0] ?? "",
      agent: "calls",
      sortKey: timeToSort(time),
    });
  }
  if (agentDataRespond?.pendingCallbacks) {
    agentDataRespond.pendingCallbacks.forEach((cb) => {
      const time = cb.addedTime ?? cb.requestedTime ?? "Recently";
      events.push({
        time,
        text: `Callback requested by ${firstName}`,
        detail: cb.reason ?? "",
        agent: "calls",
        sortKey: timeToSort(time),
      });
    });
  }

  const agentDataSettle = client.settle;
  if (agentDataSettle?.invoices) {
    agentDataSettle.invoices.forEach((inv) => {
      const time = inv.sentDate ?? inv.dateIssued ?? "Recently";
      events.push({
        time,
        text: `${inv.id} — £${inv.amount.toLocaleString("en-GB")} ${inv.status ?? ""}`,
        detail: inv.description ?? "",
        agent: "payments",
        sortKey: timeToSort(time),
      });
      if ((inv.reminderCount ?? 0) > 0) {
        const rt = inv.lastReminderDate ?? inv.lastReminder ?? "1 week ago";
        events.push({
          time: rt,
          text: `Payment reminder sent for ${inv.id}`,
          detail: `Reminder #${inv.reminderCount}`,
          agent: "payments",
          sortKey: timeToSort(rt),
        });
      }
      if (inv.dispute) {
        const dt = inv.dispute.raisedDate ?? "Recently";
        events.push({
          time: dt,
          text: `Invoice ${inv.id} disputed by ${inv.dispute.raisedBy ?? "client"}`,
          detail: inv.dispute.reason ? inv.dispute.reason.split(".")[0] : "",
          agent: "payments",
          sortKey: timeToSort(dt),
        });
      }
    });
  }

  events.sort((a, b) => b.sortKey - a.sortKey);
  return events;
}
