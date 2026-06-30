import type { FeatureRequestAssessment } from "@vendo/shared";
import {
  createPullRequestFromChanges,
  defaultBranchName,
  fetchRepoContext,
  type CodeChange,
  type CreatePrResult,
} from "../lib/github";
import { openAiJson } from "../lib/openai";

export type AiBuildResult = CreatePrResult & {
  summary: string;
  files: string[];
};

type AiBuildPlan = {
  summary: string;
  prTitle: string;
  prBody: string;
  branchName?: string;
  files: Array<{ path: string; content: string; action: "create" | "modify" }>;
};

const VENDO_STACK = `
Vendo monorepo stack:
- apps/api: Cloudflare Workers + Hono + D1 SQLite
- apps/web: React + Vite + TypeScript
- packages/shared: shared types
- Use existing patterns: routes in apps/api/src/routes, UI in apps/web/src
- Prefer minimal, focused changes (max 4 files)
`;

export async function runAiCodeBuilder(
  env: Env,
  input: {
    featureId: string;
    featureTitle: string;
    description: string;
    assessment: FeatureRequestAssessment | null;
    taskTitles: string[];
  },
): Promise<AiBuildResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    throw new Error("GitHub not configured — set GITHUB_TOKEN and GITHUB_REPO (owner/repo)");
  }

  const repoContext = await fetchRepoContext(env, 10);

  const systemPrompt = `You are ShipFlow AI Builder for Vendo. Write production-ready code changes and open a pull request.
${VENDO_STACK}

Return JSON only:
{
  "summary": "what you implemented in 1-2 sentences",
  "prTitle": "conventional commit style title",
  "prBody": "markdown PR description with ## Summary, ## Changes, ## Test plan",
  "branchName": "optional short branch slug without shipflow/ prefix",
  "files": [
    { "path": "relative/path/from/repo/root.ts", "content": "FULL file content", "action": "create" | "modify" }
  ]
}

Rules:
- Max 4 files. Small, shippable slice of the feature — not the entire product.
- For "modify", output the COMPLETE updated file content (not a diff).
- Paths must exist in repo or be sensible new files under apps/ or packages/.
- Match TypeScript, Hono, React patterns from sample files.
- Include migration SQL in apps/api/migrations/ if schema changes needed.
- Do not invent packages or paths outside the monorepo structure.`;

  const userContent = JSON.stringify({
    feature: {
      id: input.featureId,
      title: input.featureTitle,
      description: input.description,
    },
    prd: input.assessment?.prdOutline ?? null,
    engineeringTasks: input.taskTitles,
    repoTreeSample: repoContext.treePaths.slice(0, 40),
    codeSamples: repoContext.fileSamples,
  });

  const plan = await openAiJson<AiBuildPlan>(env.OPENAI_API_KEY, systemPrompt, userContent);
  if (!plan?.files?.length) {
    throw new Error("AI builder did not produce code changes — try again or implement manually");
  }

  const changes: CodeChange[] = plan.files.slice(0, 4).map((f) => ({
    path: f.path.replace(/^\/+/, ""),
    content: f.content,
    action: f.action ?? "modify",
  }));

  const branchName = plan.branchName ?? defaultBranchName(input.featureId, input.featureTitle);

  const pr = await createPullRequestFromChanges(env, {
    featureId: input.featureId,
    featureTitle: input.featureTitle,
    prTitle: plan.prTitle ?? `feat: ${input.featureTitle}`,
    prBody: `${plan.prBody ?? plan.summary}\n\n---\n_Automated by Vendo ShipFlow AI Builder_`,
    branchName,
    changes,
  });

  return {
    ...pr,
    summary: plan.summary ?? `Opened PR #${pr.prNumber} with ${changes.length} file(s)`,
    files: changes.map((c) => c.path),
  };
}
