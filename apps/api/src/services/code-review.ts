import type { FeatureRequestAssessment } from "@vendo/shared";
import { loadJalContext, reviewPullRequestAgainstPrd as reviewPr } from "@buildwithrenuka/jal";

export type AiCodeReviewResult = Awaited<ReturnType<typeof reviewPr>>;

export async function reviewPullRequestAgainstPrd(
  apiKey: string | undefined,
  env: Env,
  input: {
    featureTitle: string;
    assessment: FeatureRequestAssessment | null;
    prDiff: string;
    taskTitles: string[];
  },
): Promise<AiCodeReviewResult> {
  return reviewPr(apiKey, loadJalContext(env), input);
}
