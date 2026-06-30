import type { FeatureRequestAssessment, FeatureRequestPrdOutline } from "@vendo/shared";
import { openAiJson } from "../lib/openai";
import { logFeatureActivity } from "./activity-log";

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

export async function generateTasksFromAssessment(
  apiKey: string | undefined,
  title: string,
  assessment: FeatureRequestAssessment | null,
): Promise<GeneratedTask[]> {
  const outline = assessment?.prdOutline;
  if (!apiKey) {
    return fallbackFromOutline(outline, title);
  }

  const prompt = `Generate 4-8 engineering tasks for a Kanban board from this feature request.
Return JSON: { "tasks": [{ "title": "...", "description": "..." }] }
Tasks should be ordered for implementation: design → backend → frontend → tests → PR.
Be specific to the feature, not generic agile fluff.`;

  const userContent = JSON.stringify({
    featureTitle: title,
    prdOutline: outline ?? { problemStatement: title },
    assessment: assessment?.verdict,
  });

  const result = await openAiJson<{ tasks: GeneratedTask[] }>(apiKey, prompt, userContent);
  if (result?.tasks?.length) {
    return result.tasks.slice(0, 10);
  }
  return fallbackFromOutline(outline, title);
}

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

export async function insertDevTasks(
  db: D1Database,
  featureRequestId: string,
  tasks: GeneratedTask[],
): Promise<void> {
  await db.prepare("DELETE FROM feature_dev_tasks WHERE feature_request_id = ?").bind(featureRequestId).run();

  const statements = tasks.map((task, index) =>
    db.prepare(
      `INSERT INTO feature_dev_tasks (id, feature_request_id, title, description, status, sort_order)
       VALUES (?, ?, ?, ?, 'backlog', ?)`,
    ).bind(crypto.randomUUID(), featureRequestId, task.title, task.description, index),
  );

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export async function enqueueFeatureForDevelopment(
  db: D1Database,
  featureRequestId: string,
  title: string,
  assessmentJson: string | null,
  apiKey: string | undefined,
  actorEmail?: string,
): Promise<void> {
  const assessment = assessmentJson ? JSON.parse(assessmentJson) as FeatureRequestAssessment : null;

  await db
    .prepare(
      `UPDATE feature_requests SET
         dev_queue_status = 'queued',
         status = CASE WHEN status = 'planned' THEN 'in_development' ELSE status END,
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(featureRequestId)
    .run();

  const tasks = await generateTasksFromAssessment(apiKey, title, assessment);
  await insertDevTasks(db, featureRequestId, tasks);

  await logFeatureActivity(db, featureRequestId, "system", "enqueued", "AI generated engineering tasks and added to ShipFlow queue", {
    actorEmail: actorEmail ?? null,
    metadata: { taskCount: tasks.length, tasks: tasks.map((t) => t.title) },
  });
}
