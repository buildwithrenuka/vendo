import { Hono } from "hono";
import { z } from "zod";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import type {
  CodeReviewFinding,
  DevFeatureDetail,
  DevQueueStatus,
  DevTaskStatus,
  FeatureCodeReview,
  FeatureDevTask,
  FeaturePullRequest,
  FeatureRequest,
  FeatureRequestAssessment,
  PrReviewStatus,
} from "@vendo/shared";
import { isVendoEmployeeUser } from "../lib/dev-access";
import { fetchPullRequest, fetchPullRequestDiff, githubConfigured, repoDisplayName } from "../lib/github";
import { sendFeatureShippedEmailOrLog } from "../lib/email";
import { parseJson } from "../lib/utils";
import { reviewPullRequestAgainstPrd } from "../services/code-review";
import { runAiCodeBuilder } from "../services/code-builder";
import { enqueueFeatureForDevelopment, generateTasksFromAssessment, insertDevTasks } from "../services/task-generator";
import { loadActivityLog, logFeatureActivity } from "../services/activity-log";

export const devQueueRoutes = new Hono<AppEnv>();

function requireVendoEmployee() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const ok = await isVendoEmployeeUser(c.env.DB, user, c.env);
    if (!ok) {
      return c.json({
        error: "Vendo employee access only — sign in at /internal/login",
        code: "EMPLOYEE_FORBIDDEN",
      }, 403);
    }
    await next();
  });
}

devQueueRoutes.use("*", requireAuth(), requireVendoEmployee());

type FeatureRow = {
  id: string;
  buyer_id: string;
  title: string;
  description: string;
  request_type: FeatureRequest["requestType"];
  current_pain: string | null;
  status: FeatureRequest["status"];
  dev_queue_status: DevQueueStatus | null;
  decline_reason: string | null;
  existing_feature_url: string | null;
  ai_feedback: string | null;
  ai_assessment_json: string | null;
  clarification_thread: string;
  created_at: string;
  updated_at: string;
  buyer_email?: string;
  buyer_name?: string | null;
  company_name?: string | null;
};

function mapFeature(row: FeatureRow): FeatureRequest {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    title: row.title,
    description: row.description,
    requestType: row.request_type ?? "feature",
    currentPain: row.current_pain,
    status: row.status,
    devQueueStatus: row.dev_queue_status,
    declineReason: row.decline_reason,
    existingFeatureUrl: row.existing_feature_url,
    aiFeedback: row.ai_feedback,
    aiAssessment: parseJson<FeatureRequestAssessment | null>(row.ai_assessment_json, null),
    clarificationThread: parseJson(row.clarification_thread, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row: Record<string, unknown>): FeatureDevTask {
  return {
    id: row.id as string,
    featureRequestId: row.feature_request_id as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    status: row.status as DevTaskStatus,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapPr(row: Record<string, unknown>): FeaturePullRequest {
  return {
    id: row.id as string,
    featureRequestId: row.feature_request_id as string,
    prNumber: row.pr_number as number,
    prUrl: row.pr_url as string,
    branch: (row.branch as string) ?? null,
    headSha: (row.head_sha as string) ?? null,
    reviewStatus: row.review_status as PrReviewStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapReview(row: Record<string, unknown>): FeatureCodeReview {
  return {
    id: row.id as string,
    featureRequestId: row.feature_request_id as string,
    prId: (row.pr_id as string) ?? null,
    reviewerType: row.reviewer_type as "ai" | "human",
    verdict: row.verdict as FeatureCodeReview["verdict"],
    summary: row.summary as string,
    findings: parseJson<CodeReviewFinding[]>(row.findings_json as string, []),
    createdAt: row.created_at as string,
  };
}

async function loadFeatureDetail(db: D1Database, id: string): Promise<DevFeatureDetail | null> {
  const row = await db
    .prepare(
      `SELECT fr.*, u.email as buyer_email, u.name as buyer_name, u.company_name
       FROM feature_requests fr
       JOIN users u ON u.id = fr.buyer_id
       WHERE fr.id = ?`,
    )
    .bind(id)
    .first<FeatureRow>();

  if (!row) return null;

  const [tasks, prs, reviews, activityLog] = await Promise.all([
    db.prepare("SELECT * FROM feature_dev_tasks WHERE feature_request_id = ? ORDER BY sort_order").bind(id).all(),
    db.prepare("SELECT * FROM feature_pull_requests WHERE feature_request_id = ? ORDER BY created_at DESC").bind(id).all(),
    db.prepare("SELECT * FROM feature_code_reviews WHERE feature_request_id = ? ORDER BY created_at DESC").bind(id).all(),
    loadActivityLog(db, id),
  ]);

  return {
    ...mapFeature(row),
    buyerEmail: row.buyer_email,
    buyerName: row.company_name ?? row.buyer_name,
    tasks: (tasks.results ?? []).map(mapTask),
    pullRequests: (prs.results ?? []).map(mapPr),
    reviews: (reviews.results ?? []).map(mapReview),
    activityLog,
  };
}

async function notifyCustomerShipped(
  env: Env,
  db: D1Database,
  detail: DevFeatureDetail,
  actorEmail?: string,
) {
  if (!detail.buyerEmail) return { sent: false as const, emailError: "Customer email not found" };

  const emailResult = await sendFeatureShippedEmailOrLog(env.RESEND_API_KEY, env.FROM_EMAIL, {
    to: detail.buyerEmail,
    customerName: detail.buyerName,
    title: detail.title,
    requestType: detail.requestType,
    appUrl: env.APP_URL,
  });

  await logFeatureActivity(
    db,
    detail.id,
    "system",
    emailResult.sent ? "customer_notified" : "customer_notify_failed",
    emailResult.sent
      ? `Ship notification email sent to ${detail.buyerEmail}`
      : `Could not email customer: ${emailResult.emailError ?? "unknown error"}`,
    { actorEmail, metadata: { emailSent: emailResult.sent, to: detail.buyerEmail } },
  );

  return emailResult;
}

devQueueRoutes.get("/config", (c) =>
  c.json({
    githubConfigured: githubConfigured(c.env),
    githubRepo: repoDisplayName(c.env),
  }),
);

devQueueRoutes.get("/stats", async (c) => {
  const row = await c.env.DB
    .prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN request_type = 'feature' THEN 1 ELSE 0 END) as features,
         SUM(CASE WHEN request_type = 'bug' THEN 1 ELSE 0 END) as bugs,
         SUM(CASE WHEN dev_queue_status IS NOT NULL AND dev_queue_status != 'shipped' THEN 1 ELSE 0 END) as in_pipeline,
         SUM(CASE WHEN dev_queue_status = 'ready_for_approval' THEN 1 ELSE 0 END) as awaiting_approval
       FROM feature_requests`,
    )
    .first<{ total: number; features: number; bugs: number; in_pipeline: number; awaiting_approval: number }>();

  return c.json({
    stats: {
      total: row?.total ?? 0,
      features: row?.features ?? 0,
      bugs: row?.bugs ?? 0,
      inPipeline: row?.in_pipeline ?? 0,
      awaitingApproval: row?.awaiting_approval ?? 0,
    },
  });
});

devQueueRoutes.get("/inbox", async (c) => {
  const type = c.req.query("type");
  const sql = type === "feature" || type === "bug"
    ? `SELECT fr.*, u.email as buyer_email, u.name as buyer_name, u.company_name
       FROM feature_requests fr
       JOIN users u ON u.id = fr.buyer_id
       WHERE fr.request_type = ?
       ORDER BY fr.updated_at DESC`
    : `SELECT fr.*, u.email as buyer_email, u.name as buyer_name, u.company_name
       FROM feature_requests fr
       JOIN users u ON u.id = fr.buyer_id
       ORDER BY fr.updated_at DESC`;

  const { results } = type === "feature" || type === "bug"
    ? await c.env.DB.prepare(sql).bind(type).all<FeatureRow>()
    : await c.env.DB.prepare(sql).all<FeatureRow>();

  return c.json({
    items: (results ?? []).map((row) => ({
      ...mapFeature(row),
      buyerEmail: row.buyer_email,
      buyerName: row.company_name ?? row.buyer_name,
    })),
  });
});

devQueueRoutes.get("/queue", async (c) => {
  const { results } = await c.env.DB
    .prepare(
      `SELECT fr.*, u.email as buyer_email, u.name as buyer_name, u.company_name
       FROM feature_requests fr
       JOIN users u ON u.id = fr.buyer_id
       WHERE fr.dev_queue_status IS NOT NULL
       ORDER BY
         CASE fr.dev_queue_status
           WHEN 'fix_needed' THEN 0
           WHEN 'ready_for_approval' THEN 1
           WHEN 'in_review' THEN 2
           WHEN 'building' THEN 3
           WHEN 'queued' THEN 4
           ELSE 5
         END,
         fr.updated_at DESC`,
    )
    .all<FeatureRow>();

  return c.json({
    items: (results ?? []).map((row) => ({
      ...mapFeature(row),
      buyerEmail: row.buyer_email,
      buyerName: row.company_name ?? row.buyer_name,
    })),
  });
});

devQueueRoutes.get("/features/:id", async (c) => {
  const detail = await loadFeatureDetail(c.env.DB, c.req.param("id"));
  if (!detail) return c.json({ error: "Not found" }, 404);
  return c.json({ feature: detail });
});

const pipelineSchema = z.object({
  status: z.enum(["queued", "building", "in_review", "fix_needed", "ready_for_approval", "shipped"]),
  note: z.string().max(500).optional(),
});

devQueueRoutes.patch("/features/:id/pipeline", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const body = pipelineSchema.parse(await c.req.json());

  const row = await c.env.DB
    .prepare("SELECT dev_queue_status, title FROM feature_requests WHERE id = ?")
    .bind(id)
    .first<{ dev_queue_status: DevQueueStatus | null; title: string }>();
  if (!row) return c.json({ error: "Not found" }, 404);
  if (!row.dev_queue_status) return c.json({ error: "Not in engineering pipeline yet" }, 400);

  await c.env.DB
    .prepare("UPDATE feature_requests SET dev_queue_status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(body.status, id)
    .run();

  if (body.status === "shipped") {
    await c.env.DB
      .prepare("UPDATE feature_requests SET status = 'shipped', updated_at = datetime('now') WHERE id = ?")
      .bind(id)
      .run();
  }

  await logFeatureActivity(
    c.env.DB,
    id,
    "employee",
    "pipeline_moved",
    body.note ?? `Moved to ${body.status.replace(/_/g, " ")}`,
    { actorEmail: user.email, metadata: { from: row.dev_queue_status, to: body.status } },
  );

  let emailResult: { sent: boolean; emailError?: string } | undefined;
  if (body.status === "shipped" && row.dev_queue_status !== "shipped") {
    const shippedDetail = await loadFeatureDetail(c.env.DB, id);
    if (shippedDetail) {
      emailResult = await notifyCustomerShipped(c.env, c.env.DB, shippedDetail, user.email);
    }
  }

  const feature = await loadFeatureDetail(c.env.DB, id);
  return c.json({ feature, customerEmailSent: emailResult?.sent, customerEmailError: emailResult?.emailError });
});

devQueueRoutes.post("/features/:id/start", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  const row = await c.env.DB
    .prepare("SELECT dev_queue_status, title FROM feature_requests WHERE id = ?")
    .bind(id)
    .first<{ dev_queue_status: DevQueueStatus | null; title: string }>();
  if (!row) return c.json({ error: "Not found" }, 404);
  if (row.dev_queue_status !== "queued") {
    return c.json({ error: "Can only start items in Queued status" }, 400);
  }

  await c.env.DB
    .prepare("UPDATE feature_requests SET dev_queue_status = 'building', updated_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  await logFeatureActivity(c.env.DB, id, "employee", "started_working", `${user.email} started working on "${row.title}"`, {
    actorEmail: user.email,
  });

  const feature = await loadFeatureDetail(c.env.DB, id);
  return c.json({ feature });
});

devQueueRoutes.post("/features/:id/enqueue", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const row = await c.env.DB
    .prepare("SELECT id, title, ai_assessment_json, status FROM feature_requests WHERE id = ?")
    .bind(id)
    .first<{ id: string; title: string; ai_assessment_json: string | null; status: string }>();

  if (!row) return c.json({ error: "Not found" }, 404);
  if (!["planned", "in_development"].includes(row.status)) {
    return c.json({ error: "Feature must be planned before entering dev queue" }, 400);
  }

  await enqueueFeatureForDevelopment(c.env.DB, id, row.title, row.ai_assessment_json, c.env.OPENAI_API_KEY, user.email);
  const feature = await loadFeatureDetail(c.env.DB, id);
  return c.json({ feature });
});

devQueueRoutes.patch("/tasks/:taskId", async (c) => {
  const user = c.get("user")!;
  const body = z.object({ status: z.enum(["backlog", "in_progress", "in_review", "done"]) }).parse(await c.req.json());
  const taskId = c.req.param("taskId");

  const task = await c.env.DB
    .prepare("SELECT feature_request_id, title, status FROM feature_dev_tasks WHERE id = ?")
    .bind(taskId)
    .first<{ feature_request_id: string; title: string; status: string }>();
  if (!task) return c.json({ error: "Task not found" }, 404);

  await c.env.DB
    .prepare("UPDATE feature_dev_tasks SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(body.status, taskId)
    .run();

  await c.env.DB
    .prepare("UPDATE feature_requests SET dev_queue_status = 'building', updated_at = datetime('now') WHERE id = ?")
    .bind(task.feature_request_id)
    .run();

  await logFeatureActivity(
    c.env.DB,
    task.feature_request_id,
    "employee",
    "task_moved",
    `Task "${task.title}" → ${body.status.replace(/_/g, " ")}`,
    { actorEmail: user.email, metadata: { taskId, from: task.status, to: body.status } },
  );

  const feature = await loadFeatureDetail(c.env.DB, task.feature_request_id);
  return c.json({ feature });
});

devQueueRoutes.post("/features/:id/tasks/regenerate", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB
    .prepare("SELECT title, ai_assessment_json FROM feature_requests WHERE id = ?")
    .bind(id)
    .first<{ title: string; ai_assessment_json: string | null }>();
  if (!row) return c.json({ error: "Not found" }, 404);

  const assessment = parseJson<FeatureRequestAssessment | null>(row.ai_assessment_json, null);
  const tasks = await generateTasksFromAssessment(c.env.OPENAI_API_KEY, row.title, assessment);
  await insertDevTasks(c.env.DB, id, tasks);

  const feature = await loadFeatureDetail(c.env.DB, id);
  return c.json({ feature });
});

devQueueRoutes.post("/features/:id/build", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  const detail = await loadFeatureDetail(c.env.DB, id);
  if (!detail) return c.json({ error: "Not found" }, 404);

  if (!githubConfigured(c.env)) {
    return c.json({ error: "GitHub not configured — set GITHUB_TOKEN and GITHUB_REPO in .dev.vars" }, 503);
  }

  await logFeatureActivity(c.env.DB, id, "ai", "ai_build_started", "ShipFlow AI builder is writing code and opening a PR…", {
    actorEmail: user.email,
  });

  await c.env.DB
    .prepare("UPDATE feature_requests SET dev_queue_status = 'building', updated_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  try {
    const build = await runAiCodeBuilder(c.env, {
      featureId: id,
      featureTitle: detail.title,
      description: detail.description,
      assessment: detail.aiAssessment,
      taskTitles: detail.tasks.map((t) => t.title),
    });

    const prId = crypto.randomUUID();
    await c.env.DB
      .prepare(
        `INSERT INTO feature_pull_requests (id, feature_request_id, pr_number, pr_url, branch, head_sha, review_status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      )
      .bind(prId, id, build.prNumber, build.prUrl, build.branch, build.headSha)
      .run();

    await c.env.DB
      .prepare("UPDATE feature_requests SET dev_queue_status = 'in_review', updated_at = datetime('now') WHERE id = ?")
      .bind(id)
      .run();

    await logFeatureActivity(c.env.DB, id, "ai", "ai_build_complete", build.summary, {
      actorEmail: user.email,
      metadata: {
        prNumber: build.prNumber,
        prUrl: build.prUrl,
        branch: build.branch,
        files: build.files,
      },
    });

    const feature = await loadFeatureDetail(c.env.DB, id);
    return c.json({ feature, build });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI build failed";
    await logFeatureActivity(c.env.DB, id, "ai", "ai_build_failed", message, {
      actorEmail: user.email,
    });
    return c.json({ error: message }, 502);
  }
});

const linkPrSchema = z.object({ prNumber: z.number().int().positive() });

devQueueRoutes.post("/features/:id/pr", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const body = linkPrSchema.parse(await c.req.json());

  if (!githubConfigured(c.env)) {
    return c.json({ error: "GitHub not configured — set GITHUB_TOKEN and GITHUB_REPO in .dev.vars" }, 503);
  }

  const feature = await c.env.DB
    .prepare("SELECT id, title FROM feature_requests WHERE id = ?")
    .bind(id)
    .first<{ id: string; title: string }>();
  if (!feature) return c.json({ error: "Not found" }, 404);

  const ghPr = await fetchPullRequest(c.env, body.prNumber);

  const existing = await c.env.DB
    .prepare("SELECT id FROM feature_pull_requests WHERE feature_request_id = ? AND pr_number = ?")
    .bind(id, ghPr.number)
    .first<{ id: string }>();

  const prId = existing?.id ?? crypto.randomUUID();

  if (existing) {
    await c.env.DB
      .prepare(
        `UPDATE feature_pull_requests SET pr_url = ?, branch = ?, head_sha = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(ghPr.html_url, ghPr.head.ref, ghPr.head.sha, prId)
      .run();
  } else {
    await c.env.DB
      .prepare(
        `INSERT INTO feature_pull_requests (id, feature_request_id, pr_number, pr_url, branch, head_sha, review_status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      )
      .bind(prId, id, ghPr.number, ghPr.html_url, ghPr.head.ref, ghPr.head.sha)
      .run();
  }

  await c.env.DB
    .prepare("UPDATE feature_requests SET dev_queue_status = 'in_review', updated_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  await logFeatureActivity(c.env.DB, id, "employee", "pr_linked", `Linked GitHub PR #${ghPr.number}`, {
    actorEmail: user.email,
    metadata: { prNumber: ghPr.number, url: ghPr.html_url, branch: ghPr.head.ref },
  });

  const detail = await loadFeatureDetail(c.env.DB, id);
  return c.json({ feature: detail });
});

devQueueRoutes.post("/features/:id/review/ai", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const body = z.object({ prNumber: z.number().int().positive().optional() }).parse(await c.req.json().catch(() => ({})));

  const detail = await loadFeatureDetail(c.env.DB, id);
  if (!detail) return c.json({ error: "Not found" }, 404);

  const pr = body.prNumber
    ? detail.pullRequests.find((p) => p.prNumber === body.prNumber)
    : detail.pullRequests[0];

  if (!pr) {
    return c.json({ error: "Link a GitHub PR first" }, 400);
  }

  if (!githubConfigured(c.env)) {
    return c.json({ error: "GitHub not configured" }, 503);
  }

  const diff = await fetchPullRequestDiff(c.env, pr.prNumber);
  const aiResult = await reviewPullRequestAgainstPrd(c.env.OPENAI_API_KEY, {
    featureTitle: detail.title,
    assessment: detail.aiAssessment,
    prDiff: diff,
    taskTitles: detail.tasks.map((t) => t.title),
  });

  const reviewId = crypto.randomUUID();
  await c.env.DB
    .prepare(
      `INSERT INTO feature_code_reviews (id, feature_request_id, pr_id, reviewer_type, verdict, summary, findings_json)
       VALUES (?, ?, ?, 'ai', ?, ?, ?)`,
    )
    .bind(reviewId, id, pr.id, aiResult.verdict, aiResult.summary, JSON.stringify(aiResult.findings))
    .run();

  const prReviewStatus: PrReviewStatus =
    aiResult.verdict === "pass" ? "ready" : aiResult.verdict === "reject" ? "rejected" : "fix_needed";

  const devStatus: DevQueueStatus =
    aiResult.verdict === "pass" ? "ready_for_approval" : "fix_needed";

  await c.env.DB
    .prepare("UPDATE feature_pull_requests SET review_status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(prReviewStatus, pr.id)
    .run();

  await c.env.DB
    .prepare("UPDATE feature_requests SET dev_queue_status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(devStatus, id)
    .run();

  await logFeatureActivity(c.env.DB, id, "ai", "ai_code_review", aiResult.summary, {
    actorEmail: user.email,
    metadata: { verdict: aiResult.verdict, findingCount: aiResult.findings.length, prNumber: pr.prNumber },
  });

  const updated = await loadFeatureDetail(c.env.DB, id);
  return c.json({ feature: updated, review: mapReview({
    id: reviewId,
    feature_request_id: id,
    pr_id: pr.id,
    reviewer_type: "ai",
    verdict: aiResult.verdict,
    summary: aiResult.summary,
    findings_json: JSON.stringify(aiResult.findings),
    created_at: new Date().toISOString(),
  }) });
});

devQueueRoutes.post("/features/:id/approve-ship", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const detail = await loadFeatureDetail(c.env.DB, id);
  if (!detail) return c.json({ error: "Not found" }, 404);

  const reviewId = crypto.randomUUID();
  await c.env.DB
    .prepare(
      `INSERT INTO feature_code_reviews (id, feature_request_id, pr_id, reviewer_type, verdict, summary, findings_json)
       VALUES (?, ?, ?, 'human', 'approve_ship', ?, '[]')`,
    )
    .bind(
      reviewId,
      id,
      detail.pullRequests[0]?.id ?? null,
      "Human reviewer approved release to production.",
    )
    .run();

  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE feature_requests SET status = 'shipped', dev_queue_status = 'shipped', updated_at = datetime('now') WHERE id = ?",
    ).bind(id),
    ...(detail.pullRequests[0]
      ? [c.env.DB.prepare("UPDATE feature_pull_requests SET review_status = 'approved', updated_at = datetime('now') WHERE id = ?").bind(detail.pullRequests[0].id)]
      : []),
  ]);

  await logFeatureActivity(c.env.DB, id, "employee", "ship_approved", "Human approved release to production", {
    actorEmail: user.email,
  });

  const updated = await loadFeatureDetail(c.env.DB, id);
  const emailResult = updated
    ? await notifyCustomerShipped(c.env, c.env.DB, updated, user.email)
    : { sent: false as const };

  const feature = await loadFeatureDetail(c.env.DB, id);
  return c.json({
    feature,
    customerEmailSent: emailResult.sent,
    customerEmailError: emailResult.emailError,
  });
});

devQueueRoutes.post("/features/:id/reject-ship", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const body = z.object({ reason: z.string().min(5).max(2000) }).parse(await c.req.json());

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO feature_code_reviews (id, feature_request_id, reviewer_type, verdict, summary, findings_json)
       VALUES (?, ?, 'human', 'reject', ?, '[]')`,
    ).bind(crypto.randomUUID(), id, body.reason),
    c.env.DB.prepare(
      "UPDATE feature_requests SET dev_queue_status = 'fix_needed', updated_at = datetime('now') WHERE id = ?",
    ).bind(id),
  ]);

  await logFeatureActivity(c.env.DB, id, "employee", "ship_rejected", body.reason, {
    actorEmail: user.email,
  });

  const updated = await loadFeatureDetail(c.env.DB, id);
  return c.json({ feature: updated });
});
