import type { FeatureRequestAssessment } from "@vendo/shared";
import { generateTasksFromAssessment as generateTasks, loadJalContext } from "@jal_ai/jal";
import { logFeatureActivity } from "./activity-log";

export type GeneratedTask = Awaited<ReturnType<typeof generateTasks>>[number];

export async function generateTasksFromAssessment(
  env: Env,
  title: string,
  assessment: FeatureRequestAssessment | null,
) {
  return generateTasks(env.OPENAI_API_KEY, loadJalContext(env), title, assessment);
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
  env: Env,
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

  const tasks = await generateTasksFromAssessment(env, title, assessment);
  await insertDevTasks(db, featureRequestId, tasks);

  await logFeatureActivity(db, featureRequestId, "system", "enqueued", "AI generated engineering tasks and added to Jal queue", {
    actorEmail: actorEmail ?? null,
    metadata: { taskCount: tasks.length, tasks: tasks.map((t) => t.title) },
  });
}
