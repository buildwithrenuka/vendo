import type { FeatureRequestAssessment } from "./types";
import type { ShipFlowContext } from "./config";
import { jalBranding } from "./config";
import {
  createPullRequestFromChanges,
  defaultBranchName,
  fetchRepoContext,
  type CodeChange,
  type CreatePrResult,
  type GitHubConfig,
} from "./github";
import { openAiJson } from "./openai";

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

export async function runAiCodeBuilder(input: {
  openAiApiKey: string;
  github: GitHubConfig;
  shipflow: ShipFlowContext;
  featureId: string;
  featureTitle: string;
  description: string;
  assessment: FeatureRequestAssessment | null;
  taskTitles: string[];
}): Promise<AiBuildResult> {
  const repoContext = await fetchRepoContext(input.github, 10);

  const systemPrompt = `You are Jal AI Builder for ${input.shipflow.productName}. Write production-ready code changes and open a pull request.
${input.shipflow.stackContext}

Product context (build features that fit this domain):
${input.shipflow.productContext}

Return JSON only:
{
  "summary": "what you implemented in 1-2 sentences",
  "prTitle": "conventional commit style title",
  "prBody": "markdown PR description with ## Summary, ## Changes, ## Test plan",
  "branchName": "optional short branch slug without jal/ prefix",
  "files": [
    { "path": "relative/path/from/repo/root.ts", "content": "FULL file content", "action": "create" | "modify" }
  ]
}

Rules:
- Max 4 files. Small, shippable slice of the feature — not the entire product.
- For "modify", output the COMPLETE updated file content (not a diff).
- Paths must exist in repo or be sensible new files under apps/ or packages/.
- Match patterns from sample files in the repository.
- Include migration SQL if schema changes needed.
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

  const plan = await openAiJson<AiBuildPlan>(input.openAiApiKey, systemPrompt, userContent);
  if (!plan?.files?.length) {
    throw new Error("AI builder did not produce code changes — try again or implement manually");
  }

  const changes: CodeChange[] = plan.files.slice(0, 4).map((f) => ({
    path: f.path.replace(/^\/+/, ""),
    content: f.content,
    action: f.action ?? "modify",
  }));

  const branchName = plan.branchName ?? defaultBranchName(input.featureId, input.featureTitle);

  const pr = await createPullRequestFromChanges(input.github, {
    featureId: input.featureId,
    featureTitle: input.featureTitle,
    prTitle: plan.prTitle ?? `feat: ${input.featureTitle}`,
    prBody: `${plan.prBody ?? plan.summary}\n\n---\n_Automated by ${jalBranding(input.shipflow)} AI Builder_`,
    branchName,
    changes,
  });

  return {
    ...pr,
    summary: plan.summary ?? `Opened PR #${pr.prNumber} with ${changes.length} file(s)`,
    files: changes.map((c) => c.path),
  };
}
