export type ActivityActorType = "customer" | "ai" | "employee" | "system";

export async function logFeatureActivity(
  db: D1Database,
  featureRequestId: string,
  actorType: ActivityActorType,
  event: string,
  message: string,
  options?: {
    actorEmail?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO feature_request_activity_log
       (id, feature_request_id, actor_type, actor_email, event, message, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      featureRequestId,
      actorType,
      options?.actorEmail ?? null,
      event,
      message,
      JSON.stringify(options?.metadata ?? {}),
    )
    .run();
}

export function mapActivityRow(row: Record<string, unknown>) {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse((row.metadata_json as string) || "{}") as Record<string, unknown>;
  } catch {
    metadata = {};
  }
  return {
    id: row.id as string,
    featureRequestId: row.feature_request_id as string,
    actorType: row.actor_type as ActivityActorType,
    actorEmail: (row.actor_email as string) ?? null,
    event: row.event as string,
    message: row.message as string,
    metadata,
    createdAt: row.created_at as string,
  };
}

export async function loadActivityLog(db: D1Database, featureRequestId: string) {
  const { results } = await db
    .prepare(
      "SELECT * FROM feature_request_activity_log WHERE feature_request_id = ? ORDER BY created_at ASC",
    )
    .bind(featureRequestId)
    .all();
  return (results ?? []).map(mapActivityRow);
}
