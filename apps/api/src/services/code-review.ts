import type { CodeReviewFinding, FeatureRequestAssessment } from "@vendo/shared";
import { openAiJson } from "../lib/openai";

export type AiCodeReviewResult = {
  verdict: "pass" | "fix_needed" | "reject";
  summary: string;
  findings: CodeReviewFinding[];
};

export async function reviewPullRequestAgainstPrd(
  apiKey: string | undefined,
  input: {
    featureTitle: string;
    assessment: FeatureRequestAssessment | null;
    prDiff: string;
    taskTitles: string[];
  },
): Promise<AiCodeReviewResult> {
  if (!apiKey) {
    return {
      verdict: "fix_needed",
      summary: "OPENAI_API_KEY not configured — cannot run AI code review.",
      findings: [{
        severity: "blocking",
        category: "configuration",
        message: "Set OPENAI_API_KEY in apps/api/.dev.vars",
      }],
    };
  }

  const systemPrompt = `You are ShipFlow QA Agent. Review a GitHub pull request against the product requirements.
Evaluate whether the implementation satisfies the PRD — not just syntax.

Respond JSON only:
{
  "verdict": "pass" | "fix_needed" | "reject",
  "summary": "2-3 sentences for engineers",
  "findings": [
    {
      "severity": "blocking" | "non_blocking",
      "category": "requirements" | "security" | "performance" | "edge_case" | "quality",
      "message": "actionable issue",
      "file": "optional path"
    }
  ]
}

Rules:
- blocking = must fix before ship (missing acceptance criteria, security, broken requirement)
- non_blocking = nice to fix
- pass only if PR reasonably satisfies PRD and tasks
- reject if fundamentally wrong direction`;

  const userContent = JSON.stringify({
    feature: input.featureTitle,
    prd: input.assessment?.prdOutline ?? null,
    acceptanceCriteria: input.assessment?.prdOutline?.acceptanceCriteria ?? [],
    engineeringTasks: input.taskTitles,
    pullRequestDiff: input.prDiff.slice(0, 24000),
  });

  const result = await openAiJson<AiCodeReviewResult>(apiKey, systemPrompt, userContent);
  if (!result?.verdict) {
    return {
      verdict: "fix_needed",
      summary: "AI review could not complete — manual review required.",
      findings: [],
    };
  }
  return result;
}
