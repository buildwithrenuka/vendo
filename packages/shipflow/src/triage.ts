import type {
  ClarificationMessage,
  FeatureRequestAssessment,
  FeatureRequestPrdOutline,
  FeatureRequestStatus,
} from "./types";
import {
  buildExistingFeaturesCatalog,
  getDefaultJalContext,
  looksOutOfScope,
  matchExistingFeature,
  type ShipFlowContext,
  type ShipFlowExistingFeature,
} from "./config";

export type TriageResult = {
  status: FeatureRequestStatus;
  feedback: string;
  declineReason?: string;
  existingFeatureUrl?: string;
  clarificationQuestions?: string[];
  assessment: FeatureRequestAssessment;
};

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "for", "to", "in", "on", "with", "from", "of", "is", "it", "be", "as", "at",
  "i", "we", "my", "our", "want", "need", "add", "feature", "request", "please", "would", "like", "can", "could",
  "buyer", "supplier", "vendo", "dashboard",
]);

function tokenizeForMatch(text: string): string[] {
  return normalizeForMatch(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function titleSimilarity(a: string, b: string): number {
  const left = normalizeForMatch(a);
  const right = normalizeForMatch(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;

  const tokensA = tokenizeForMatch(a);
  const tokensB = tokenizeForMatch(b);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setB = new Set(tokensB);
  const overlap = tokensA.filter((t) => setB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : overlap / union;
}

export type TriageContext = {
  /** Product context — pass as `jal` or legacy `shipflow` */
  jal?: ShipFlowContext;
  shipflow?: ShipFlowContext;
  excludeRequestId?: string;
  findPriorRequests?: (excludeRequestId?: string) => Promise<PriorRequestRow[]>;
};

type PriorRequestRow = {
  id: string;
  title: string;
  description: string;
  status: FeatureRequestStatus;
};

async function loadBuyerPriorRequests(ctx: TriageContext): Promise<PriorRequestRow[]> {
  if (!ctx.findPriorRequests) return [];
  return ctx.findPriorRequests(ctx.excludeRequestId);
}

async function findDuplicatePriorRequest(
  ctx: TriageContext,
  title: string,
  description: string,
): Promise<PriorRequestRow | null> {
  const combined = `${title}\n${description}`;
  const prior = await loadBuyerPriorRequests(ctx);

  for (const row of prior) {
    const titleScore = titleSimilarity(title, row.title);
    const descScore = titleSimilarity(combined, `${row.title}\n${row.description}`);
    const strongTitleMatch = titleScore >= 0.55;
    const strongCombinedMatch = descScore >= 0.45;
    const exactTitle = normalizeForMatch(title) === normalizeForMatch(row.title);

    if (exactTitle || strongTitleMatch || strongCombinedMatch) {
      return row;
    }
  }

  return null;
}

function buildBuyerHistoryPrompt(rows: PriorRequestRow[]): string {
  if (rows.length === 0) return "";
  return rows
    .slice(0, 8)
    .map((r) => `- [${r.status}] ${r.title}`)
    .join("\n");
}

function alreadyExistsFromCatalog(
  feature: ShipFlowExistingFeature,
  shipflow: ShipFlowContext,
): TriageResult {
  return {
    status: "already_exists",
    feedback: `This capability already exists as **${feature.name}**. ${feature.description}`,
    existingFeatureUrl: feature.url,
    assessment: defaultAssessment({
      businessFit: "strong",
      targetUser: "buyer",
      verdict: "Already available — no new build needed",
      reasoning: [
        `The request maps to an existing ${shipflow.productName} capability.`,
        "Building again would duplicate product surface area.",
      ],
      suggestedNextStep: `Use ${feature.name} from your dashboard today.`,
    }),
  };
}

function alreadyExistsFromPriorRequest(prior: PriorRequestRow, shipflow: ShipFlowContext): TriageResult {
  const feedbackUrl = shipflow.feedbackTabUrl;

  if (prior.status === "shipped") {
    return {
      status: "already_exists",
      feedback: `We already shipped this for you: **${prior.title}**. It's live in your workspace — no need to request it again.`,
      existingFeatureUrl: feedbackUrl,
      assessment: defaultAssessment({
        businessFit: "strong",
        targetUser: "buyer",
        verdict: "Already shipped — duplicate request",
        reasoning: [
          "This buyer submitted a matching request that was already delivered.",
          "Rebuilding would duplicate work already in production.",
        ],
        suggestedNextStep: "Use the shipped feature from your dashboard.",
      }),
    };
  }

  if (prior.status === "already_exists") {
    return {
      status: "already_exists",
      feedback: `This matches a prior request we already answered: **${prior.title}**. The capability exists in ${shipflow.productName} today.`,
      existingFeatureUrl: feedbackUrl,
      assessment: defaultAssessment({
        businessFit: "strong",
        targetUser: "buyer",
        verdict: "Already available — duplicate request",
        reasoning: [
          "The buyer previously received an already-exists answer for the same need.",
        ],
        suggestedNextStep: "Check your earlier request in the Feedback tab.",
      }),
    };
  }

  return {
    status: "already_exists",
    feedback: `You already have an open request for this: **${prior.title}** (${prior.status.replace(/_/g, " ")}). We're on it — no need to submit again.`,
    existingFeatureUrl: feedbackUrl,
    assessment: defaultAssessment({
      businessFit: "strong",
      targetUser: "buyer",
      verdict: "Duplicate of an in-flight request",
      reasoning: [
        "A similar request from this buyer is already in the pipeline.",
        "Duplicate submissions create confusion without changing priority.",
      ],
      suggestedNextStep: "Track your existing request in the Feedback tab.",
    }),
  };
}

async function detectExistingOrDuplicate(
  title: string,
  description: string,
  requestType: "feature" | "bug",
  shipflow: ShipFlowContext,
  ctx?: TriageContext,
): Promise<TriageResult | null> {
  if (requestType === "bug") return null;

  const catalogMatch = matchExistingFeature(`${title}\n${description}`, shipflow);
  if (catalogMatch) return alreadyExistsFromCatalog(catalogMatch, shipflow);

  if (ctx) {
    const duplicate = await findDuplicatePriorRequest(ctx, title, description);
    if (duplicate) return alreadyExistsFromPriorRequest(duplicate, shipflow);
  }

  return null;
}

function isTooVague(title: string, description: string): boolean {
  const combined = `${title} ${description}`.trim();
  return combined.length < 60;
}

function looksOutOfScopeForProduct(text: string, shipflow: ShipFlowContext): boolean {
  return looksOutOfScope(text, shipflow);
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

function ruleBasedTriage(
  title: string,
  description: string,
  shipflow: ShipFlowContext,
  requestType: "feature" | "bug" = "feature",
): TriageResult {
  const combined = `${title}\n${description}`;
  const userQuestion = shipflow.primaryUserLabels.join(", ");

  if (requestType === "bug") {
    if (isTooVague(title, description)) {
      return {
        status: "ai_review",
        feedback: "We need more detail to reproduce and prioritize this bug.",
        clarificationQuestions: [
          "What exact steps reproduce the issue?",
          "What did you expect vs what actually happened?",
          `Which browser/device and which page in ${shipflow.productName}?`,
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

  const existing = matchExistingFeature(combined, shipflow);
  if (existing) {
    return alreadyExistsFromCatalog(existing, shipflow);
  }

  if (looksOutOfScopeForProduct(combined, shipflow)) {
    return {
      status: "declined",
      feedback: `This falls outside ${shipflow.productName}'s product focus.`,
      declineReason: "Conflicts with product direction",
      assessment: defaultAssessment({
        businessFit: "out_of_scope",
        targetUser: "unknown",
        verdict: `Not aligned with ${shipflow.productName}'s business`,
        reasoning: [
          `The request targets a problem ${shipflow.productName} is not designed to solve.`,
          "Our roadmap prioritizes the core workflows described in the product context.",
        ],
        suggestedNextStep: "Describe how this ties to your core product workflow, or use a specialized tool for that domain.",
      }),
    };
  }

  if (isTooVague(title, description)) {
    return {
      status: "ai_review",
      feedback: "We need more business context before we can assess fit or write requirements.",
      clarificationQuestions: [
        `Who is the primary user — ${userQuestion}?`,
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
          `${shipflow.productName} standard plans target repeatable product workflows.`,
        ],
        suggestedNextStep: "Contact us about Enterprise if you need a bespoke integration.",
      }),
    };
  }

  const prdOutline: FeatureRequestPrdOutline = {
    problemStatement: description.split("\n")[0]?.slice(0, 280) ?? title,
    goals: [`Deliver "${title}" for users of ${shipflow.productName}`],
    userStories: [`As a user, I want ${title.toLowerCase()} so my workflow improves.`],
    acceptanceCriteria: ["Feature is usable from the product UI", "Does not break existing core flows"],
  };

  return {
    status: "planned",
    feedback: `This fits ${shipflow.productName}'s direction. We've captured initial requirements and queued it for build.`,
    assessment: defaultAssessment({
      businessFit: "strong",
      targetUser: lower.includes("supplier") && !lower.includes("buyer") ? "supplier" : "buyer",
      verdict: "Good fit — proceed to planning",
      reasoning: [
        "The request supports the product's core user workflows.",
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
  shipflow: ShipFlowContext,
  requestType: "feature" | "bug" = "feature",
  buyerHistoryPrompt = "",
): Promise<TriageResult | null> {
  const existingCatalog = buildExistingFeaturesCatalog(shipflow);
  const systemPrompt = `You are a senior product manager doing Phase 1 discovery for ${shipflow.productName}.
${shipflow.productContext}

Request type: ${requestType === "bug" ? "BUG REPORT — prioritize reproduction, severity, and fix scope" : "FEATURE REQUEST — evaluate business fit and roadmap"}

Known existing product capabilities — if the request matches any of these, you MUST respond with status=already_exists:
${existingCatalog}

${buyerHistoryPrompt ? `This customer's recent requests — if the new request duplicates a shipped or in-flight item, use status=already_exists:\n${buyerHistoryPrompt}\n` : ""}

Evaluate the request like Jal: business context first, not code.

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
- If feature already exists in ${shipflow.productName}, status=already_exists and educate where to find it.
- If vague (missing user, problem, or success metric), status=ai_review with targeted business questions.
- If out of scope for this product's focus, status=declined with honest reasoning.
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
  ctx?: TriageContext,
): Promise<TriageResult> {
  const shipflow = ctx?.jal ?? ctx?.shipflow ?? getDefaultJalContext();

  const existingOrDuplicate = await detectExistingOrDuplicate(title, description, requestType, shipflow, ctx);
  if (existingOrDuplicate) return existingOrDuplicate;

  const buyerHistoryPrompt = ctx
    ? buildBuyerHistoryPrompt(await loadBuyerPriorRequests(ctx))
    : "";

  if (apiKey) {
    const aiResult = await openAiTriage(apiKey, title, description, thread, shipflow, requestType, buyerHistoryPrompt);
    if (aiResult) {
      if (requestType !== "bug" && aiResult.status !== "already_exists") {
        const guardrail = await detectExistingOrDuplicate(title, description, requestType, shipflow, ctx);
        if (guardrail) return guardrail;
      }
      return aiResult;
    }
  }
  return ruleBasedTriage(title, description, shipflow, requestType);
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
