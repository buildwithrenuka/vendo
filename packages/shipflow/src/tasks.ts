import type { FeatureRequestAssessment, FeatureRequestPrdOutline } from "./types";
import type { ShipFlowContext } from "./config";
import { openAiJson } from "./openai";

export type GeneratedTask = {
  title: string;
  description: string;
};

const FALLBACK_TASKS: GeneratedTask[] = [
  { title: "Schema & API design", description: "Define data model and API endpoints for the feature." },
  { title: "Backend implementation", description: "Implement server logic and validation." },
  { title: "Frontend UI", description: "Build user-facing screens and wire to API." },
  { title: "AI / integration hooks", description: "Connect any external services or AI flows." },
  { title: "QA & PR review", description: "Open PR, run AI review against PRD, address findings." },
];

function fallbackFromOutline(outline: FeatureRequestPrdOutline | undefined, title: string): GeneratedTask[] {
  if (!outline) {
    return FALLBACK_TASKS.map((t) => ({
      ...t,
      description: `${t.description} (${title})`,
    }));
  }
  const tasks: GeneratedTask[] = [
    { title: "Implement core flow", description: outline.problemStatement },
    ...outline.userStories.slice(0, 3).map((s, i) => ({
      title: `User story ${i + 1}`,
      description: s,
    })),
    ...outline.acceptanceCriteria.slice(0, 2).map((c) => ({
      title: `Acceptance: ${c.slice(0, 60)}`,
      description: c,
    })),
    { title: "Open PR & AI review", description: "Link GitHub PR and run QA agent against PRD." },
  ];
  return tasks.slice(0, 8);
}

export async function generateTasksFromAssessment(
  openAiApiKey: string | undefined,
  shipflow: ShipFlowContext,
  title: string,
  assessment: FeatureRequestAssessment | null,
): Promise<GeneratedTask[]> {
  const outline = assessment?.prdOutline;
  if (!openAiApiKey) {
    return fallbackFromOutline(outline, title);
  }

  const prompt = `Generate 4-8 engineering tasks for a Kanban board from this feature request for ${shipflow.productName}.
${shipflow.productContext}

Return JSON: { "tasks": [{ "title": "...", "description": "..." }] }
Tasks should be ordered for implementation: design → backend → frontend → tests → PR.
Be specific to the feature and product domain, not generic agile fluff.`;

  const userContent = JSON.stringify({
    featureTitle: title,
    prdOutline: outline ?? { problemStatement: title },
    assessment: assessment?.verdict,
  });

  const result = await openAiJson<{ tasks: GeneratedTask[] }>(openAiApiKey, prompt, userContent);
  if (result?.tasks?.length) {
    return result.tasks.slice(0, 10);
  }
  return fallbackFromOutline(outline, title);
}
