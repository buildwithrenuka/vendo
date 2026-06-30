import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../middleware/auth";
import { requireAuth, requireRole } from "../middleware/auth";
import type { ClarificationMessage, FeatureRequest, FeatureRequestAssessment, FeatureRequestStatus } from "@vendo/shared";
import { parseJson } from "../lib/utils";
import {
  appendClarification,
  appendUserReply,
  buildRequestContext,
  triageFeatureRequest,
} from "@buildwithrenuka/jal";
import { getJalContext } from "../lib/jal-env";
import { enqueueFeatureForDevelopment } from "../services/task-generator";
import { logFeatureActivity } from "../services/activity-log";

export const featureRequestRoutes = new Hono<AppEnv>();

type DbRow = {
  id: string;
  buyer_id: string;
  title: string;
  description: string;
  request_type: FeatureRequest["requestType"];
  current_pain: string | null;
  status: FeatureRequestStatus;
  dev_queue_status: FeatureRequest["devQueueStatus"];
  decline_reason: string | null;
  existing_feature_url: string | null;
  ai_feedback: string | null;
  ai_assessment_json: string | null;
  clarification_thread: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DbRow): FeatureRequest {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    title: row.title,
    description: row.description,
    requestType: row.request_type ?? "feature",
    currentPain: row.current_pain,
    status: row.status,
    devQueueStatus: row.dev_queue_status ?? null,
    declineReason: row.decline_reason,
    existingFeatureUrl: row.existing_feature_url,
    aiFeedback: row.ai_feedback,
    aiAssessment: parseJson<FeatureRequestAssessment | null>(row.ai_assessment_json, null),
    clarificationThread: parseJson<ClarificationMessage[]>(row.clarification_thread, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function applyTriage(
  env: Env,
  db: D1Database,
  id: string,
  title: string,
  description: string,
  thread: ClarificationMessage[],
  apiKey: string | undefined,
  requestType: FeatureRequest["requestType"],
  buyerEmail?: string,
  buyerId?: string,
): Promise<FeatureRequest> {
  const jal = getJalContext(env);
  const result = await triageFeatureRequest(apiKey, title, description, thread, requestType, buyerId
    ? {
        shipflow: jal,
        excludeRequestId: id,
        findPriorRequests: async (excludeRequestId) => {
          const { results } = await db
            .prepare(
              `SELECT id, title, description, status
               FROM feature_requests
               WHERE buyer_id = ?
                 AND id != COALESCE(?, '')
                 AND status IN ('shipped', 'already_exists', 'planned', 'in_development', 'ai_review')
               ORDER BY updated_at DESC
               LIMIT 25`,
            )
            .bind(buyerId, excludeRequestId ?? null)
            .all<{ id: string; title: string; description: string; status: FeatureRequestStatus }>();
          return results ?? [];
        },
      }
    : undefined);

  let updatedThread = thread;
  if (result.clarificationQuestions?.length) {
    updatedThread = appendClarification(thread, result.clarificationQuestions);
  }

  await db
    .prepare(
      `UPDATE feature_requests SET
         status = ?,
         decline_reason = ?,
         existing_feature_url = ?,
         ai_feedback = ?,
         ai_assessment_json = ?,
         clarification_thread = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      result.status,
      result.declineReason ?? null,
      result.existingFeatureUrl ?? null,
      result.feedback,
      JSON.stringify(result.assessment),
      JSON.stringify(updatedThread),
      id,
    )
    .run();

  await logFeatureActivity(db, id, "ai", "ai_triage", result.feedback, {
    metadata: {
      status: result.status,
      verdict: result.assessment.verdict,
      businessFit: result.assessment.businessFit,
      requestType,
    },
  });

  if (result.clarificationQuestions?.length) {
    await logFeatureActivity(
      db,
      id,
      "ai",
      "ai_clarification",
      result.clarificationQuestions.join("\n"),
      { metadata: { questions: result.clarificationQuestions } },
    );
  }

  const row = await db
    .prepare("SELECT * FROM feature_requests WHERE id = ?")
    .bind(id)
    .first<DbRow>();

  if (result.status === "planned") {
    await enqueueFeatureForDevelopment(
      env,
      db,
      id,
      title,
      JSON.stringify(result.assessment),
      apiKey,
      buyerEmail,
    );
    const refreshed = await db.prepare("SELECT * FROM feature_requests WHERE id = ?").bind(id).first<DbRow>();
    return mapRow(refreshed!);
  }

  return mapRow(row!);
}

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  requestType: z.enum(["feature", "bug"]).default("feature"),
  targetUser: z.enum(["buyer", "supplier", "both", "unknown"]).optional(),
  currentPain: z.string().max(2000).optional(),
});

const clarifySchema = z.object({
  reply: z.string().min(5).max(5000),
});

featureRequestRoutes.get("/", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const { results } = await c.env.DB
    .prepare(
      `SELECT * FROM feature_requests WHERE buyer_id = ? ORDER BY created_at DESC`,
    )
    .bind(user.id)
    .all<DbRow>();

  return c.json({ requests: results.map(mapRow) });
});

featureRequestRoutes.post("/", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const body = createSchema.parse(await c.req.json());
  const id = crypto.randomUUID();
  const contextDescription = buildRequestContext(body);

  await c.env.DB
    .prepare(
      `INSERT INTO feature_requests (id, buyer_id, title, description, request_type, current_pain, status)
       VALUES (?, ?, ?, ?, ?, ?, 'received')`,
    )
    .bind(id, user.id, body.title, contextDescription, body.requestType, body.currentPain ?? null)
    .run();

  await logFeatureActivity(c.env.DB, id, "customer", "submitted", `Customer submitted ${body.requestType}: ${body.title}`, {
    actorEmail: user.email,
    metadata: { requestType: body.requestType, targetUser: body.targetUser },
  });

  const request = await applyTriage(
    c.env,
    c.env.DB,
    id,
    body.title,
    contextDescription,
    [],
    c.env.OPENAI_API_KEY,
    body.requestType,
    user.email,
    user.id,
  );

  return c.json({ request }, 201);
});

featureRequestRoutes.post("/:id/clarify", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const body = clarifySchema.parse(await c.req.json());

  const row = await c.env.DB
    .prepare("SELECT * FROM feature_requests WHERE id = ? AND buyer_id = ?")
    .bind(id, user.id)
    .first<DbRow>();

  if (!row) {
    return c.json({ error: "Feature request not found" }, 404);
  }

  if (row.status !== "ai_review") {
    return c.json({ error: "This request is not awaiting clarification" }, 400);
  }

  const thread = appendUserReply(
    parseJson<ClarificationMessage[]>(row.clarification_thread, []),
    body.reply,
  );

  await logFeatureActivity(c.env.DB, id, "customer", "clarification_reply", body.reply, {
    actorEmail: user.email,
  });

  const request = await applyTriage(
    c.env,
    c.env.DB,
    id,
    row.title,
    `${row.description}\n\nAdditional context from customer:\n${body.reply}`,
    thread,
    c.env.OPENAI_API_KEY,
    row.request_type ?? "feature",
    user.email,
    user.id,
  );

  return c.json({ request });
});

featureRequestRoutes.patch("/:id/status", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const body = z.object({
    status: z.enum([
      "planned", "in_development", "shipped", "declined",
    ]),
    declineReason: z.string().optional(),
  }).parse(await c.req.json());

  const row = await c.env.DB
    .prepare("SELECT id FROM feature_requests WHERE id = ? AND buyer_id = ?")
    .bind(id, user.id)
    .first();

  if (!row) {
    return c.json({ error: "Feature request not found" }, 404);
  }

  await c.env.DB
    .prepare(
      `UPDATE feature_requests SET
         status = ?,
         decline_reason = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(body.status, body.declineReason ?? null, id)
    .run();

  const updated = await c.env.DB
    .prepare("SELECT * FROM feature_requests WHERE id = ?")
    .bind(id)
    .first<DbRow>();

  return c.json({ request: mapRow(updated!) });
});
