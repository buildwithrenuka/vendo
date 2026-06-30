import type {
  ClarificationMessage,
  FeatureRequestAssessment,
  FeatureRequestPrdOutline,
  FeatureRequestStatus,
} from "@vendo/shared";

/** Known Vendo capabilities for "already exists" detection */
const EXISTING_FEATURES: Array<{
  keywords: string[];
  name: string;
  url: string;
  description: string;
}> = [
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

export type TriageResult = {
  status: FeatureRequestStatus;
  feedback: string;
  declineReason?: string;
  existingFeatureUrl?: string;
  clarificationQuestions?: string[];
  assessment: FeatureRequestAssessment;
};

const VENDO_CONTEXT = `
Vendo is a B2B supplier onboarding platform for Indian mid-size buyers (procurement teams).
Core jobs-to-be-done:
- Invite suppliers and collect compliance data via customizable forms
- Review / auto-approve submissions with rules
- Track supplier pipeline, scorecards, GST reconciliation (Enterprise)
- WhatsApp-first outreach for suppliers who live on mobile

We do NOT build: generic CRM, full ERP, accounting, crypto, social networks, unrelated consumer apps.
`;

function matchExistingFeature(text: string): (typeof EXISTING_FEATURES)[number] | null {
  const lower = text.toLowerCase();
  let best: (typeof EXISTING_FEATURES)[number] | null = null;
  let bestScore = 0;

  for (const feature of EXISTING_FEATURES) {
    const score = feature.keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = feature;
    }
  }

  return bestScore > 0 ? best : null;
}

function isTooVague(title: string, description: string): boolean {
  const combined = `${title} ${description}`.trim();
  return combined.length < 60;
}

function looksOutOfScope(text: string): boolean {
  const lower = text.toLowerCase();
  const outOfScope = [
    "cryptocurrency", "crypto wallet", "dating app", "social media feed",
    "video streaming", "game engine", "blockchain nft", "payroll software",
  ];
  return outOfScope.some((term) => lower.includes(term));
}

function defaultAssessment(
  partial: Partial<FeatureRequestAssessment> & Pick<FeatureRequestAssessment, "verdict" | "reasoning" | "suggestedNextStep">,
): FeatureRequestAssessment {
  return {
    businessFit: partial.businessFit ?? "moderate",
    targetUser: partial.targetUser ?? "unknown",
    verdict: partial.verdict,
    reasoning: partial.reasoning,
    suggestedNextStep: partial.suggestedNextStep,
    prdOutline: partial.prdOutline,
  };
}

function ruleBasedTriage(title: string, description: string, requestType: "feature" | "bug" = "feature"): TriageResult {
  const combined = `${title}\n${description}`;

  if (requestType === "bug") {
    if (isTooVague(title, description)) {
      return {
        status: "ai_review",
        feedback: "We need more detail to reproduce and prioritize this bug.",
        clarificationQuestions: [
          "What exact steps reproduce the issue?",
          "What did you expect vs what actually happened?",
          "Which browser/device and which page in Vendo?",
        ],
        assessment: defaultAssessment({
          businessFit: "moderate",
          targetUser: "buyer",
          verdict: "Bug report needs reproduction steps",
          reasoning: ["Cannot prioritize without clear reproduction path."],
          suggestedNextStep: "Reply with steps to reproduce.",
        }),
      };
    }
    return {
      status: "planned",
      feedback: "Bug report accepted — engineering will investigate and fix.",
      assessment: defaultAssessment({
        businessFit: "strong",
        targetUser: "buyer",
        verdict: "Valid bug — queue for fix",
        reasoning: ["Customer reported broken behavior with enough context to investigate."],
        suggestedNextStep: "Track fix progress in your dashboard.",
        prdOutline: {
          problemStatement: description.split("\n")[0]?.slice(0, 280) ?? title,
          goals: [`Fix: ${title}`],
          userStories: [`As a user, I expect ${title.toLowerCase()} to work correctly.`],
          acceptanceCriteria: ["Bug no longer reproducible", "Regression covered if applicable"],
        },
      }),
    };
  }

  const existing = matchExistingFeature(combined);
  if (existing) {
    return {
      status: "already_exists",
      feedback: `This capability already exists as **${existing.name}**. ${existing.description}`,
      existingFeatureUrl: existing.url,
      assessment: defaultAssessment({
        businessFit: "strong",
        targetUser: "buyer",
        verdict: "Already available — no new build needed",
        reasoning: [
          "The request maps to an existing Vendo capability.",
          "Building again would duplicate product surface area.",
        ],
        suggestedNextStep: `Use ${existing.name} from your dashboard today.`,
      }),
    };
  }

  if (looksOutOfScope(combined)) {
    return {
      status: "declined",
      feedback: "This falls outside Vendo's procurement and supplier onboarding focus.",
      declineReason: "Conflicts with product direction",
      assessment: defaultAssessment({
        businessFit: "out_of_scope",
        targetUser: "unknown",
        verdict: "Not aligned with Vendo's business",
        reasoning: [
          "The request targets a problem Vendo is not designed to solve.",
          "Our roadmap prioritizes buyer–supplier onboarding workflows.",
        ],
        suggestedNextStep: "Consider a specialized tool for that domain, or describe an onboarding angle.",
      }),
    };
  }

  if (isTooVague(title, description)) {
    return {
      status: "ai_review",
      feedback: "We need more business context before we can assess fit or write requirements.",
      clarificationQuestions: [
        "Who is the primary user — buyer (procurement), supplier, or both?",
        "What painful workflow happens today without this feature?",
        "What would success look like in one measurable outcome (time saved, fewer errors, etc.)?",
      ],
      assessment: defaultAssessment({
        businessFit: "weak",
        targetUser: "unknown",
        verdict: "Insufficient context for product decision",
        reasoning: [
          "The request lacks enough detail to judge ROI for multiple buyers.",
          "Product discovery requires a clear user and problem statement.",
        ],
        suggestedNextStep: "Answer the clarification questions so we can complete the review.",
      }),
    };
  }

  const lower = combined.toLowerCase();
  if (lower.includes("niche") || lower.includes("only our company") || lower.includes("custom integration with our erp")) {
    return {
      status: "declined",
      feedback: "Highly company-specific — we prioritize features that help many buyers. Enterprise custom work may be possible separately.",
      declineReason: "Too niche for current roadmap",
      assessment: defaultAssessment({
        businessFit: "weak",
        targetUser: "buyer",
        verdict: "Too niche for standard roadmap",
        reasoning: [
          "The scope appears tailored to one organization's internal systems.",
          "Vendo standard plans target repeatable onboarding workflows.",
        ],
        suggestedNextStep: "Contact us about Enterprise if you need a bespoke integration.",
      }),
    };
  }

  const prdOutline: FeatureRequestPrdOutline = {
    problemStatement: description.split("\n")[0]?.slice(0, 280) ?? title,
    goals: [`Deliver "${title}" for procurement teams using Vendo`],
    userStories: [`As a buyer, I want ${title.toLowerCase()} so that my supplier onboarding improves.`],
    acceptanceCriteria: ["Feature is usable from the buyer dashboard", "Does not break existing invite or review flows"],
  };

  return {
    status: "planned",
    feedback: "This fits Vendo's direction. We've captured initial requirements and queued it for build.",
    assessment: defaultAssessment({
      businessFit: "strong",
      targetUser: lower.includes("supplier") && !lower.includes("buyer") ? "supplier" : "buyer",
      verdict: "Good fit — proceed to planning",
      reasoning: [
        "The request supports supplier onboarding or buyer procurement workflows.",
        "Scope appears reusable across customers, not one-off custom work.",
      ],
      suggestedNextStep: "Track status here as we move through development and ship.",
      prdOutline,
    }),
  };
}

async function openAiTriage(
  apiKey: string,
  title: string,
  description: string,
  thread: ClarificationMessage[],
  requestType: "feature" | "bug" = "feature",
): Promise<TriageResult | null> {
  const systemPrompt = `You are a senior product manager doing Phase 1 discovery for Vendo (supplier onboarding SaaS).
${VENDO_CONTEXT}

Request type: ${requestType === "bug" ? "BUG REPORT — prioritize reproduction, severity, and fix scope" : "FEATURE REQUEST — evaluate business fit and roadmap"}

Evaluate the request like ShipFlow: business context first, not code.

Respond with JSON only:
{
  "status": "already_exists" | "ai_review" | "planned" | "declined",
  "feedback": "2-3 sentence summary for the customer",
  "declineReason": "optional — Already available | Too niche for current roadmap | Conflicts with product direction",
  "existingFeatureUrl": "optional e.g. /dashboard?tab=feedback",
  "clarificationQuestions": ["1-3 questions if status is ai_review"],
  "assessment": {
    "businessFit": "strong" | "moderate" | "weak" | "out_of_scope",
    "targetUser": "buyer" | "supplier" | "both" | "unknown",
    "verdict": "short headline e.g. Good fit — proceed | Needs clarification | Already exists",
    "reasoning": ["2-4 bullet strings explaining business rationale"],
    "suggestedNextStep": "one clear action for the customer",
    "prdOutline": {
      "problemStatement": "only when status is planned",
      "goals": ["..."],
      "userStories": ["As a ..."],
      "acceptanceCriteria": ["..."],
      "nonGoals": ["optional"]
    }
  }
}

Rules:
- If feature already exists in Vendo, status=already_exists and educate where to find it.
- If vague (missing user, problem, or success metric), status=ai_review with targeted business questions.
- If out of scope for procurement/onboarding, status=declined with honest reasoning.
- If good fit with enough context, status=planned and fill prdOutline with realistic requirements.
- Never promise exact ship dates. Be honest like a PM, not a sales bot.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...thread.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: `Feature request:\nTitle: ${title}\n\nDetails:\n${description}` },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.error("[triage] OpenAI error", await response.text());
    return null;
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as TriageResult;
    const validStatuses: FeatureRequestStatus[] = [
      "already_exists", "ai_review", "planned", "declined",
    ];
    if (!validStatuses.includes(parsed.status) || !parsed.assessment?.verdict) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildRequestContext(input: {
  title: string;
  description: string;
  targetUser?: string;
  currentPain?: string;
}): string {
  const parts = [`Title: ${input.title}`, `Description: ${input.description}`];
  if (input.targetUser && input.targetUser !== "unknown") {
    parts.push(`Primary user: ${input.targetUser}`);
  }
  if (input.currentPain?.trim()) {
    parts.push(`Current pain / workaround: ${input.currentPain.trim()}`);
  }
  return parts.join("\n\n");
}

export async function triageFeatureRequest(
  apiKey: string | undefined,
  title: string,
  description: string,
  thread: ClarificationMessage[] = [],
  requestType: "feature" | "bug" = "feature",
): Promise<TriageResult> {
  if (apiKey) {
    const aiResult = await openAiTriage(apiKey, title, description, thread, requestType);
    if (aiResult) return aiResult;
  }
  return ruleBasedTriage(title, description, requestType);
}

export function appendClarification(
  thread: ClarificationMessage[],
  questions: string[],
): ClarificationMessage[] {
  const now = new Date().toISOString();
  return [
    ...thread,
    {
      role: "assistant",
      content: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      createdAt: now,
    },
  ];
}

export function appendUserReply(
  thread: ClarificationMessage[],
  reply: string,
): ClarificationMessage[] {
  return [
    ...thread,
    { role: "user", content: reply, createdAt: new Date().toISOString() },
  ];
}
