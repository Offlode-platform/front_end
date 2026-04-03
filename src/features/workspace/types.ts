export type WorkspaceZone = "documents" | "calls" | "payments";

export type WorkspaceTaskSummary = {
  id: string;
  headline: string;
  status: "escalation" | "due-today" | "normal";
};

export type WorkspaceZoneSummary = {
  zone: WorkspaceZone;
  label: string;
  color: string;
  count: number;
  topTask?: WorkspaceTaskSummary;
};

export type WorkspaceClient = {
  id: string;
  name: string;
  subtitle: string;
  urgency: "red" | "amber" | "green";
  vip?: boolean;
  status: "needs-input" | "handled";
  contact: {
    name: string;
    email: string;
    phone: string;
    manager: string;
  };
  automation: string[];
  financials: {
    outstanding: string;
    thisYear: string;
    lifetime: string;
  };
  keyDates: {
    vatDue: string;
    yearEnd: string;
    lastContact: string;
  };
  preferences: string[];
  zoneSummary: WorkspaceZoneSummary[];
};

export type DemoDocumentItem = {
  id?: string;
  name: string;
  status?: string;
  daysOverdue?: number;
  receivedDate?: string;
  aiCheck?: string;
  aiCheckNote?: string;
};

export type DemoDocumentSet = {
  id?: string;
  name?: string;
  deadline?: string;
  items?: DemoDocumentItem[];
  progress?: number;
  chaseCount?: number;
  lastChase?: string;
  lastChaseOpened?: boolean;
  status?: string;
  daysOverdue?: number;
};

export type DemoCallTranscriptLine = {
  speaker: string;
  text: string;
};

export type DemoInvoice = {
  id: string;
  amount: number;
  description?: string;
  dateIssued?: string | null;
  sentDate?: string;
  dateDue?: string;
  daysOverdue?: number;
  status?: string;
  reminderCount?: number;
  lastReminder?: string;
  lastReminderDate?: string;
  dispute?: {
    reason?: string;
    raisedBy?: string;
    raisedDate?: string;
    amount?: number;
  } | null;
};

export type WorkspaceDemoClient = {
  id: number | string;
  name: string;
  intent?: string;
  intentDetail?: string;
  legalEntity?: string;
  urgentItem?: {
    agent?: string;
    desc?: string;
    severity?: string;
  };
  aiLearned?: {
    bestContactTime?: string;
    avgResponseTime?: string;
    preferredChannel?: string;
    paymentPattern?: string;
    documentPattern?: string;
    callPattern?: string;
  } | null;
  vip?: boolean;
  contact?: string;
  email?: string;
  phone?: string;
  outstanding?: string;
  thisYear?: string;
  lifetime?: string;
  prefs?: string[];
  status?: string;
  assignedManager?: { name?: string; initials?: string };
  keyDates?: {
    yearEnd?: string;
    vatQuarterEnd?: string;
    nextInvoiceDue?: string;
    nextMeeting?: string | null;
    lastContact?: string;
  };
  collect?: {
    status?: string;
    chaseCount?: number;
    lastChaseDate?: string;
    lastChaseOpened?: boolean;
    nextEscalation?: string;
    documentSets?: DemoDocumentSet[];
    pendingReview?: Array<{
      name: string;
      uploadedTime?: string;
      aiCheck?: string;
      aiCheckNote?: string;
    }>;
  };
  respond?: {
    status?: string;
    callbackOverdue?: boolean;
    callType?: string;
    callDuration?: string;
    callTime?: string;
    sentiment?: string;
    summary?: string;
    tags?: string[];
    transcript?: DemoCallTranscriptLine[] | string;
    callHistory?: Array<{
      type?: string;
      outcome?: string;
      duration?: string;
      time?: string;
      handler?: string;
    }>;
    pendingCallbacks?: Array<{
      reason?: string;
      requestedTime?: string;
      addedTime?: string;
      overdue?: boolean;
    }>;
    draftResponse?: { type?: string; subject?: string; body?: string; aiNotes?: string };
  };
  settle?: {
    status?: string;
    totalOutstanding?: number;
    totalOverdue?: number;
    invoices?: DemoInvoice[];
    draftInvoice?: {
      ready?: boolean;
      type?: string;
      note?: string;
      totalQuote?: number;
      period?: string;
      lineItems?: Array<{ description?: string; amount?: number }>;
    };
  };
  /** Reference panels (records / activity / notes) — from HTML demo */
  services?: string[];
  contacts?: Array<{ name: string; role?: string; email?: string; primary?: boolean }>;
  timeline?: Array<{ type?: string; title?: string; body?: string; time?: string; date?: string; agent?: string }>;
  notes?: Array<{ id?: string; text: string; author?: string; time?: string; type?: string }>;
  pinnedNote?: { text: string; author?: string; time?: string } | string;
};
