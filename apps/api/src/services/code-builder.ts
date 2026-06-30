import type { FeatureRequestAssessment } from "@vendo/shared";
import type { GitHubConfig, ShipFlowContext } from "@buildwithrenuka/jal";
import {
  githubConfigFromEnv,
  loadJalContext,
  runAiCodeBuilder as runBuilder,
  type AiBuildResult,
} from "@buildwithrenuka/jal";

export type { AiBuildResult };

export async function runAiCodeBuilder(
  env: Env,
  input: {
    featureId: string;
    featureTitle: string;
    description: string;
    assessment: FeatureRequestAssessment | null;
    taskTitles: string[];
    github?: GitHubConfig | null;
    jal?: ShipFlowContext;
  },
): Promise<AiBuildResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  const github = input.github ?? githubConfigFromEnv(env);
  if (!github) {
    throw new Error("GitHub not configured — set GITHUB_TOKEN and GITHUB_REPO (owner/repo)");
  }

  return runBuilder({
    openAiApiKey: env.OPENAI_API_KEY,
    github,
    shipflow: input.jal ?? loadJalContext(env),
    featureId: input.featureId,
    featureTitle: input.featureTitle,
    description: input.description,
    assessment: input.assessment,
    taskTitles: input.taskTitles,
  });
}
