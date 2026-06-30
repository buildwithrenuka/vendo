export type ShipFlowExistingFeature = {
  keywords: string[];
  name: string;
  url: string;
  description: string;
};

export type ShipFlowProfile = "vendo" | "travel" | "generic";

export type ShipFlowContext = {
  profile: ShipFlowProfile;
  productName: string;
  productContext: string;
  stackContext: string;
  existingFeatures: ShipFlowExistingFeature[];
  outOfScopeTerms: string[];
  primaryUserLabels: string[];
  feedbackTabUrl: string;
};

const VENDO_EXISTING: ShipFlowExistingFeature[] = [
  {
    keywords: ["whatsapp", "wa.me", "invite link", "share invite"],
    name: "WhatsApp invite & reminders",
    url: "/dashboard#invites",
    description: "Share supplier invites and form reminders via WhatsApp from your buyer dashboard.",
  },
  {
    keywords: ["gst", "itc", "gstr", "2a", "2b", "reconcil", "input tax"],
    name: "GST / ITC reconciliation",
    url: "/dashboard?tab=setup",
    description: "Match supplier invoices against onboarded GST numbers (Enterprise).",
  },
  {
    keywords: ["verified badge", "verify once", "reuse", "supplier profile"],
    name: "Verified Once, Reuse Everywhere",
    url: "/dashboard",
    description: "Suppliers verify once and reuse their profile with new buyers.",
  },
  {
    keywords: ["scorecard", "rating", "supplier score", "traffic light", "reliable"],
    name: "Supplier scorecard",
    url: "/dashboard?tab=suppliers",
    description: "Green / yellow / red ratings based on onboarding and review history.",
  },
  {
    keywords: ["form builder", "custom form", "onboarding form", "compliance form"],
    name: "Custom onboarding forms",
    url: "/dashboard?tab=setup",
    description: "Build versioned supplier onboarding forms with custom fields.",
  },
  {
    keywords: ["auto-approv", "approval rule", "rule based"],
    name: "Rule-based auto-approval",
    url: "/dashboard?tab=setup",
    description: "Describe rules in plain language; clear submissions auto-approve.",
  },
  {
    keywords: ["invite", "supplier invite", "7-day link"],
    name: "Invite-first onboarding",
    url: "/dashboard",
    description: "Send secure invite links to suppliers via email or WhatsApp.",
  },
  {
    keywords: ["ai prefill", "prefill", "suggest"],
    name: "AI prefill for suppliers",
    url: "/dashboard",
    description: "AI suggests field values; suppliers review and confirm before submit.",
  },
  {
    keywords: ["feature request", "product feedback", "roadmap"],
    name: "Feature request & AI product review",
    url: "/dashboard?tab=feedback",
    description: "Submit ideas; AI reviews business fit and tracks delivery status.",
  },
];

const TRAVEL_EXISTING: ShipFlowExistingFeature[] = [
  {
    keywords: ["search flight", "flight search", "compare fare", "book flight"],
    name: "Flight search & booking",
    url: "/search/flights",
    description: "Search, compare, and book flights with live fare rules.",
  },
  {
    keywords: ["hotel", "stay", "room", "accommodation"],
    name: "Hotel booking",
    url: "/search/hotels",
    description: "Find and book hotels with cancellation policies shown upfront.",
  },
  {
    keywords: ["itinerary", "trip plan", "day plan", "schedule"],
    name: "Trip itinerary builder",
    url: "/trips",
    description: "Build and share day-by-day itineraries for a trip.",
  },
  {
    keywords: ["payment", "checkout", "wallet", "pay now"],
    name: "Checkout & payments",
    url: "/checkout",
    description: "Secure checkout with saved payment methods.",
  },
  {
    keywords: ["cancellation", "refund", "modify booking", "reschedule"],
    name: "Booking changes & refunds",
    url: "/bookings",
    description: "Cancel, modify, or reschedule from the bookings hub.",
  },
  {
    keywords: ["feature request", "product feedback", "roadmap"],
    name: "Feature request & AI product review",
    url: "/feedback",
    description: "Submit ideas; AI reviews fit and tracks delivery status.",
  },
];

const GENERIC_EXISTING: ShipFlowExistingFeature[] = [
  {
    keywords: ["feature request", "product feedback", "roadmap", "bug report"],
    name: "Feature request & feedback",
    url: "/feedback",
    description: "Submit product ideas and track delivery status.",
  },
  {
    keywords: ["dashboard", "home", "overview"],
    name: "User dashboard",
    url: "/dashboard",
    description: "Main workspace for day-to-day product usage.",
  },
  {
    keywords: ["settings", "profile", "account"],
    name: "Account settings",
    url: "/settings",
    description: "Manage profile, preferences, and account security.",
  },
];

const PRESETS: Record<ShipFlowProfile, Omit<ShipFlowContext, "profile">> = {
  vendo: {
    productName: "Vendo",
    productContext: `Vendo is a B2B supplier onboarding platform for mid-size buyers (procurement teams).
Core jobs-to-be-done:
- Invite suppliers and collect compliance data via customizable forms
- Review / auto-approve submissions with rules
- Track supplier pipeline, scorecards, GST reconciliation (Enterprise)
- WhatsApp-first outreach for suppliers who live on mobile

We do NOT build: generic CRM, full ERP, accounting, crypto, social networks, unrelated consumer apps.`,
    stackContext: `Vendo monorepo stack:
- apps/api: Cloudflare Workers + Hono + D1 SQLite
- apps/web: React + Vite + TypeScript
- packages/shared: shared types
- Use existing patterns: routes in apps/api/src/routes, UI in apps/web/src
- Prefer minimal, focused changes (max 4 files)`,
    existingFeatures: VENDO_EXISTING,
    outOfScopeTerms: [
      "cryptocurrency", "crypto wallet", "dating app", "social media feed",
      "video streaming", "game engine", "blockchain nft", "payroll software",
    ],
    primaryUserLabels: ["buyer (procurement)", "supplier", "both"],
    feedbackTabUrl: "/dashboard?tab=feedback",
  },
  travel: {
    productName: "Travel app",
    productContext: `This is a consumer/travel-agent travel booking product.
Core jobs-to-be-done:
- Search and book flights, hotels, and packages
- Manage itineraries, travelers, and documents
- Handle payments, cancellations, and refunds
- Send booking confirmations and trip updates

We do NOT build: supplier onboarding, GST compliance, procurement ERP, crypto, social networks.`,
    stackContext: `Travel app monorepo (adapt to repo layout from code samples):
- Backend API service + relational or edge database
- React web or mobile-friendly frontend
- Booking, search, and payments modules
- Prefer minimal, focused changes (max 4 files)`,
    existingFeatures: TRAVEL_EXISTING,
    outOfScopeTerms: [
      "supplier onboarding", "gst", "procurement", "vendor compliance",
      "cryptocurrency", "dating app", "payroll software",
    ],
    primaryUserLabels: ["traveler", "agent", "admin"],
    feedbackTabUrl: "/feedback",
  },
  generic: {
    productName: "Product",
    productContext: `This is a SaaS product. Evaluate feature requests against the product's core user workflows,
not against a fixed industry template. Prefer reusable capabilities over one-off custom work.`,
    stackContext: `Application monorepo — infer stack from repository code samples.
Prefer minimal, focused changes (max 4 files). Match existing patterns in apps/ and packages/.`,
    existingFeatures: GENERIC_EXISTING,
    outOfScopeTerms: [
      "cryptocurrency", "crypto wallet", "blockchain nft",
    ],
    primaryUserLabels: ["end user", "admin", "both"],
    feedbackTabUrl: "/feedback",
  },
};

function parseProfile(raw: string | undefined): ShipFlowProfile {
  const value = raw?.trim().toLowerCase();
  if (value === "travel" || value === "generic" || value === "vendo") return value;
  return "vendo";
}

function parseJsonFeatures(raw: string | undefined): ShipFlowExistingFeature[] | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as ShipFlowExistingFeature[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.filter(
      (f) => f.name && f.url && Array.isArray(f.keywords) && f.description,
    );
  } catch {
    console.warn("[jal] Invalid JAL_EXISTING_FEATURES JSON — using preset catalog");
    return null;
  }
}

function parseList(raw: string | undefined, fallback: string[]): string[] {
  if (!raw?.trim()) return fallback;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export type JalEnvConfig = {
  JAL_PROFILE?: string;
  JAL_PRODUCT_NAME?: string;
  JAL_PRODUCT_CONTEXT?: string;
  JAL_STACK_CONTEXT?: string;
  JAL_EXISTING_FEATURES?: string;
  JAL_OUT_OF_SCOPE?: string;
  JAL_USER_LABELS?: string;
  JAL_FEEDBACK_URL?: string;
  /** @deprecated use JAL_* — still read for backward compatibility */
  SHIPFLOW_PROFILE?: string;
  SHIPFLOW_PRODUCT_NAME?: string;
  SHIPFLOW_PRODUCT_CONTEXT?: string;
  SHIPFLOW_STACK_CONTEXT?: string;
  SHIPFLOW_EXISTING_FEATURES?: string;
  SHIPFLOW_OUT_OF_SCOPE?: string;
  SHIPFLOW_USER_LABELS?: string;
  SHIPFLOW_FEEDBACK_URL?: string;
};

/** @deprecated use JalEnvConfig */
export type ShipFlowEnvConfig = JalEnvConfig;

function envStr(config: JalEnvConfig, jalKey: keyof JalEnvConfig, legacyKey: keyof JalEnvConfig): string | undefined {
  const v = config[jalKey] ?? config[legacyKey];
  return typeof v === "string" ? v : undefined;
}

/** Load Jal product context from env vars or a config record. */
export function loadJalContext(config: JalEnvConfig): ShipFlowContext {
  const profile = parseProfile(envStr(config, "JAL_PROFILE", "SHIPFLOW_PROFILE"));
  const preset = PRESETS[profile];

  const customFeatures = parseJsonFeatures(envStr(config, "JAL_EXISTING_FEATURES", "SHIPFLOW_EXISTING_FEATURES"));
  const productName = envStr(config, "JAL_PRODUCT_NAME", "SHIPFLOW_PRODUCT_NAME")?.trim() || preset.productName;

  return {
    profile,
    productName,
    productContext: envStr(config, "JAL_PRODUCT_CONTEXT", "SHIPFLOW_PRODUCT_CONTEXT")?.trim() || preset.productContext,
    stackContext: envStr(config, "JAL_STACK_CONTEXT", "SHIPFLOW_STACK_CONTEXT")?.trim() || preset.stackContext,
    existingFeatures: customFeatures ?? preset.existingFeatures,
    outOfScopeTerms: parseList(envStr(config, "JAL_OUT_OF_SCOPE", "SHIPFLOW_OUT_OF_SCOPE"), preset.outOfScopeTerms),
    primaryUserLabels: parseList(envStr(config, "JAL_USER_LABELS", "SHIPFLOW_USER_LABELS"), preset.primaryUserLabels),
    feedbackTabUrl: envStr(config, "JAL_FEEDBACK_URL", "SHIPFLOW_FEEDBACK_URL")?.trim() || preset.feedbackTabUrl,
  };
}

/** @deprecated use loadJalContext */
export const loadShipFlowContext = loadJalContext;

export function getJalContext(config: JalEnvConfig): ShipFlowContext {
  return loadJalContext(config);
}

/** @deprecated use getJalContext */
export const getShipFlowContext = getJalContext;

/** Fallback when triage runs without env (tests / legacy callers). */
export function getDefaultJalContext(): ShipFlowContext {
  return { profile: "vendo", ...PRESETS.vendo };
}

/** @deprecated use getDefaultJalContext */
export const getDefaultShipFlowContext = getDefaultJalContext;

export function buildExistingFeaturesCatalog(ctx: ShipFlowContext): string {
  return ctx.existingFeatures.map(
    (f) => `- ${f.name} (${f.url}): ${f.description} [keywords: ${f.keywords.join(", ")}]`,
  ).join("\n");
}

export function matchExistingFeature(
  text: string,
  ctx: ShipFlowContext,
): ShipFlowExistingFeature | null {
  const lower = text.toLowerCase();
  let best: ShipFlowExistingFeature | null = null;
  let bestScore = 0;

  for (const feature of ctx.existingFeatures) {
    const score = feature.keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = feature;
    }
  }

  return bestScore > 0 ? best : null;
}

export function looksOutOfScope(text: string, ctx: ShipFlowContext): boolean {
  const lower = text.toLowerCase();
  return ctx.outOfScopeTerms.some((term) => lower.includes(term));
}

export function jalBranding(_ctx?: ShipFlowContext): string {
  return "Jal";
}

/** @deprecated use jalBranding */
export const shipFlowBranding = jalBranding;
