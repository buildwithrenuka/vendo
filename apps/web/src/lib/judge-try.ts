export const JUDGE_TRY_STORAGE_KEY = "jal-judge-try-draft";

export type JudgeTryDraft = {
  path: "vendo" | "studio";
  title: string;
  description: string;
  requestType: "feature" | "bug";
  targetUser?: "buyer" | "supplier" | "both" | "unknown";
  currentPain?: string;
};

export type JudgeTryIdea = Omit<JudgeTryDraft, "path"> & {
  id: string;
  tag: string;
  seconds: string;
};

export const JAL_STUDIO_TRY_IDEAS: JudgeTryIdea[] = [
  {
    id: "studio-changelog",
    tag: "Ship loop",
    seconds: "~2 min",
    title: "Public changelog from shipped feedback",
    description:
      "When a feature ships from the Feedback River, auto-publish a customer-facing changelog entry with the original request title and merge link.",
    requestType: "feature",
  },
  {
    id: "studio-slack",
    tag: "Integrations",
    seconds: "~2 min",
    title: "Slack ping when PR is ready for review",
    description:
      "Notify the project channel when AI Build opens a PR and AI Review marks it ready_for_approval — include Dual Lens link.",
    requestType: "feature",
  },
  {
    id: "studio-dedupe",
    tag: "River UX",
    seconds: "~1 min",
    title: "Merge duplicate droplets on the river",
    description:
      "If two widget submissions describe the same feature, combine them into one droplet and preserve both customer emails in activity.",
    requestType: "feature",
  },
  {
    id: "studio-widget-theme",
    tag: "Widget",
    seconds: "~1 min",
    title: "Widget theme matches host site brand colors",
    description:
      "Read primary accent from the embed parent page or config JSON so the Jal widget feels native on any SaaS marketing site.",
    requestType: "feature",
  },
];

export const VENDO_DEMO_TRY_IDEAS: JudgeTryIdea[] = [
  {
    id: "vendo-bulk-invite",
    tag: "Buyer workflow",
    seconds: "~2 min",
    title: "Bulk invite suppliers from CSV",
    description:
      "Upload a CSV of supplier emails and phone numbers, send WhatsApp + email invites in one action, and track acceptance in the dashboard.",
    requestType: "feature",
    targetUser: "buyer",
    currentPain: "Inviting suppliers one-by-one before a sourcing deadline.",
  },
  {
    id: "vendo-gst-match",
    tag: "Finance",
    seconds: "~2 min",
    title: "Auto-match GST invoices to PO line items",
    description:
      "When a supplier uploads a GST invoice, match line items against the purchase order and flag mismatches for buyer review.",
    requestType: "feature",
    targetUser: "buyer",
  },
  {
    id: "vendo-whatsapp-nudge",
    tag: "Supplier onboarding",
    seconds: "~1 min",
    title: "WhatsApp reminder if onboarding is incomplete",
    description:
      "Send an automated WhatsApp nudge 48 hours after invite if the supplier has not submitted the onboarding form.",
    requestType: "feature",
    targetUser: "supplier",
  },
  {
    id: "vendo-scorecard-export",
    tag: "Reporting",
    seconds: "~1 min",
    title: "Export supplier scorecard as PDF",
    description:
      "One-click PDF export of green/yellow/red scorecard history for audit and vendor review meetings.",
    requestType: "feature",
    targetUser: "buyer",
  },
];

export function saveJudgeTryDraft(draft: JudgeTryDraft) {
  sessionStorage.setItem(JUDGE_TRY_STORAGE_KEY, JSON.stringify(draft));
}

export function loadJudgeTryDraft(): JudgeTryDraft | null {
  try {
    const raw = sessionStorage.getItem(JUDGE_TRY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JudgeTryDraft;
  } catch {
    return null;
  }
}

export function clearJudgeTryDraft() {
  sessionStorage.removeItem(JUDGE_TRY_STORAGE_KEY);
}

export function judgeTryToVendoDraft(idea: JudgeTryIdea): JudgeTryDraft {
  return { path: "vendo", ...idea };
}

export function judgeTryToStudioDraft(idea: JudgeTryIdea): JudgeTryDraft {
  return { path: "studio", ...idea };
}
