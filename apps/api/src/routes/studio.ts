import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireProjectApiKey, requireProjectOwner, type StudioEnv } from "../middleware/studio-auth";
import {
  applyProjectTriage,
  listProjectInbox,
  loadProjectFeatureDetail,
  mapFeatureRow,
  mergeProjectPr,
  projectStats,
  runProjectAiBuild,
  scanRepoForContext,
} from "../services/studio-service";
import {
  defaultJalContext,
  findProjectById,
  generateApiKey,
  githubConfigForProject,
  hashApiKey,
  isValidGithubRepo,
  mapProjectRow,
  normalizeGithubRepo,
  projectPublicUrl,
  type JalProjectRow,
} from "../lib/studio-projects";
import { getJalContextForProject } from "../lib/jal-env";
import { parseJson } from "../lib/utils";
import { appendUserReply, buildRequestContext, fetchPullRequestDiff, reviewPullRequestAgainstPrd } from "@buildwithrenuka/jal";
import type { ClarificationMessage, DevQueueStatus, FeatureRequest, JalProjectContext } from "@vendo/shared";
import { enqueueFeatureForDevelopment } from "../services/task-generator";
import { logFeatureActivity } from "../services/activity-log";

export const studioRoutes = new Hono<StudioEnv>();

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  githubRepo: z
    .string()
    .trim()
    .transform(normalizeGithubRepo)
    .refine(isValidGithubRepo, "Use owner/repo format (e.g. buildwithrenuka/vendo)"),
  jalContext: z.object({
    profile: z.enum(["vendo", "travel", "generic"]).optional(),
    productName: z.string().optional(),
    productContext: z.string().optional(),
    stackContext: z.string().optional(),
    existingFeatures: z.array(z.object({
      keywords: z.array(z.string()),
      name: z.string(),
      url: z.string(),
      description: z.string(),
    })).optional(),
    outOfScopeTerms: z.array(z.string()).optional(),
    primaryUserLabels: z.array(z.string()).optional(),
    feedbackTabUrl: z.string().optional(),
  }).optional(),
});

const feedbackSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  requestType: z.enum(["feature", "bug"]).default("feature"),
  submitterEmail: z.string().email().optional(),
  currentPain: z.string().max(2000).optional(),
});

// Public setup status (no secrets)
studioRoutes.get("/setup", (c) => {
  const token = c.env.GITHUB_TOKEN?.trim();
  const openai = Boolean(c.env.OPENAI_API_KEY?.trim());
  return c.json({
    githubConfigured: Boolean(token),
    openaiConfigured: openai,
    ready: Boolean(token && openai),
  });
});

// ─── Embed feedback (API key) ───────────────────────────────────────────────

studioRoutes.get("/feedback", requireProjectApiKey(), async (c) => {
  const project = c.get("project");
  const email = c.req.query("email")?.trim().toLowerCase();
  let sql = `SELECT * FROM feature_requests WHERE project_id = ?`;
  const binds: string[] = [project.id];
  if (email) {
    sql += ` AND LOWER(COALESCE(submitter_email, '')) = ?`;
    binds.push(email);
  }
  sql += ` ORDER BY created_at DESC LIMIT 50`;
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({ requests: (results ?? []).map((r) => mapFeatureRow(r as Parameters<typeof mapFeatureRow>[0])) });
});

studioRoutes.post("/feedback", requireProjectApiKey(), async (c) => {
  const project = c.get("project");
  const body = feedbackSchema.parse(await c.req.json());
  const id = crypto.randomUUID();
  const contextDescription = buildRequestContext(body);

  await c.env.DB.prepare(
    `INSERT INTO feature_requests (id, buyer_id, project_id, submitter_email, title, description, request_type, current_pain, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received')`,
  ).bind(
    id,
    project.ownerUserId,
    project.id,
    body.submitterEmail ?? null,
    body.title,
    contextDescription,
    body.requestType,
    body.currentPain ?? null,
  ).run();

  await logFeatureActivity(c.env.DB, id, "customer", "submitted", `Feedback submitted: ${body.title}`, {
    actorEmail: body.submitterEmail ?? undefined,
    metadata: { requestType: body.requestType, projectId: project.id },
  });

  const request = await applyProjectTriage(
    c.env,
    c.env.DB,
    project,
    id,
    body.title,
    contextDescription,
    [],
    body.requestType,
    body.submitterEmail,
  );

  return c.json({ request }, 201);
});

studioRoutes.post("/feedback/:id/clarify", requireProjectApiKey(), async (c) => {
  const project = c.get("project");
  const id = c.req.param("id");
  const body = z.object({ reply: z.string().min(5).max(5000), submitterEmail: z.string().email().optional() }).parse(await c.req.json());

  const row = await c.env.DB.prepare(
    "SELECT * FROM feature_requests WHERE id = ? AND project_id = ?",
  ).bind(id, project.id).first();

  if (!row) return c.json({ error: "Not found" }, 404);
  const typed = row as { status: string; title: string; description: string; clarification_thread: string; request_type: FeatureRequest["requestType"] };
  if (typed.status !== "ai_review") return c.json({ error: "Not awaiting clarification" }, 400);

  const thread = appendUserReply(parseJson<ClarificationMessage[]>(typed.clarification_thread, []), body.reply);
  const request = await applyProjectTriage(
    c.env,
    c.env.DB,
    project,
    id,
    typed.title,
    `${typed.description}\n\nAdditional context:\n${body.reply}`,
    thread,
    typed.request_type ?? "feature",
    body.submitterEmail,
  );
  return c.json({ request });
});

// ─── Projects (session auth) ────────────────────────────────────────────────

studioRoutes.get("/projects", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM jal_projects WHERE owner_user_id = ? ORDER BY updated_at DESC",
  ).bind(user.id).all<JalProjectRow>();

  const projects = (results ?? []).map((row) => {
    const p = mapProjectRow(row);
    return {
      ...p,
      githubConfigured: Boolean(githubConfigForProject(c.env, p)),
      embedUrl: projectPublicUrl(c.env.APP_URL, p.id),
    };
  });
  return c.json({ projects });
});

studioRoutes.post("/projects", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const body = createProjectSchema.parse(await c.req.json());
  const id = crypto.randomUUID();
  const rawKey = generateApiKey();
  const keyHash = await hashApiKey(rawKey);
  const base = defaultJalContext(body.name);
  const jalContext: JalProjectContext = {
    ...base,
    ...body.jalContext,
    productName: body.jalContext?.productName ?? body.name,
  };

  await c.env.DB.prepare(
    `INSERT INTO jal_projects (id, owner_user_id, name, github_repo, jal_context_json, api_key_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(id, user.id, body.name, body.githubRepo.trim(), JSON.stringify(jalContext), keyHash).run();

  const project = await findProjectById(c.env.DB, id);
  return c.json({
    project: {
      ...project!,
      githubConfigured: Boolean(githubConfigForProject(c.env, project!)),
      embedUrl: projectPublicUrl(c.env.APP_URL, id),
    },
    apiKey: rawKey,
  }, 201);
});

studioRoutes.get("/projects/:projectId", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  return c.json({
    project: {
      ...project,
      githubConfigured: Boolean(githubConfigForProject(c.env, project)),
      embedUrl: projectPublicUrl(c.env.APP_URL, project.id),
    },
  });
});

studioRoutes.patch("/projects/:projectId", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const body = createProjectSchema.partial().parse(await c.req.json());
  const jalContext = body.jalContext
    ? { ...project.jalContext, ...body.jalContext }
    : project.jalContext;

  await c.env.DB.prepare(
    `UPDATE jal_projects SET
       name = COALESCE(?, name),
       github_repo = COALESCE(?, github_repo),
       jal_context_json = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
  ).bind(body.name ?? null, body.githubRepo ?? null, JSON.stringify(jalContext), project.id).run();

  const updated = await findProjectById(c.env.DB, project.id);
  return c.json({ project: updated });
});

studioRoutes.post("/projects/:projectId/scan", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  if (!c.env.OPENAI_API_KEY) return c.json({ error: "OPENAI_API_KEY not configured" }, 503);

  const scan = await scanRepoForContext(c.env, project.githubRepo);
  const jalContext: JalProjectContext = {
    ...project.jalContext,
    productName: scan.productName,
    productContext: scan.productContext,
    stackContext: scan.stackContext,
    existingFeatures: scan.existingFeatures,
  };

  await c.env.DB.prepare(
    `UPDATE jal_projects SET jal_context_json = ?, repo_scanned_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
  ).bind(JSON.stringify(jalContext), project.id).run();

  return c.json({ scan, jalContext });
});

studioRoutes.post("/projects/:projectId/regenerate-key", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const rawKey = generateApiKey();
  const keyHash = await hashApiKey(rawKey);
  await c.env.DB.prepare(
    "UPDATE jal_projects SET api_key_hash = ?, updated_at = datetime('now') WHERE id = ?",
  ).bind(keyHash, project.id).run();
  return c.json({ apiKey: rawKey });
});

studioRoutes.get("/projects/:projectId/embed", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const appUrl = c.env.APP_URL.replace(/\/$/, "");
  return c.json({
    projectId: project.id,
    embedUrl: `${appUrl}/embed/${project.id}`,
    widgetSnippet: `<JalWidget projectId="${project.id}" apiKey="YOUR_API_KEY" />`,
    npmSnippet: `npm install @buildwithrenuka/jal`,
    iframeUrl: `${appUrl}/embed/${project.id}`,
  });
});

// ─── Dev queue (project-scoped) ─────────────────────────────────────────────

studioRoutes.get("/projects/:projectId/stats", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const stats = await projectStats(c.env.DB, project.id);
  return c.json({ stats });
});

studioRoutes.get("/projects/:projectId/inbox", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const type = c.req.query("type") ?? undefined;
  const items = await listProjectInbox(c.env.DB, project.id, type);
  return c.json({ items });
});

studioRoutes.get("/projects/:projectId/queue", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM feature_requests WHERE project_id = ? AND dev_queue_status IS NOT NULL
     ORDER BY updated_at DESC`,
  ).bind(project.id).all();
  return c.json({ items: (results ?? []).map((r) => mapFeatureRow(r as Parameters<typeof mapFeatureRow>[0])) });
});

studioRoutes.get("/projects/:projectId/features/:featureId", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const feature = await loadProjectFeatureDetail(c.env.DB, project.id, c.req.param("featureId"));
  if (!feature) return c.json({ error: "Not found" }, 404);
  return c.json({ feature });
});

studioRoutes.post("/projects/:projectId/features/:featureId/enqueue", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const user = c.get("user")!;
  const featureId = c.req.param("featureId");
  const row = await c.env.DB.prepare(
    "SELECT id, title, ai_assessment_json, status FROM feature_requests WHERE id = ? AND project_id = ?",
  ).bind(featureId, project.id).first<{ id: string; title: string; ai_assessment_json: string | null; status: string }>();
  if (!row) return c.json({ error: "Not found" }, 404);

  await enqueueFeatureForDevelopment(c.env, c.env.DB, row.id, row.title, row.ai_assessment_json, c.env.OPENAI_API_KEY, user.email);
  const feature = await loadProjectFeatureDetail(c.env.DB, project.id, featureId);
  return c.json({ feature });
});

studioRoutes.post("/projects/:projectId/features/:featureId/build", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const user = c.get("user")!;
  const featureId = c.req.param("featureId");
  const detail = await loadProjectFeatureDetail(c.env.DB, project.id, featureId);
  if (!detail) return c.json({ error: "Not found" }, 404);

  await logFeatureActivity(c.env.DB, featureId, "ai", "ai_build_started", "Jal AI builder is writing code…", {
    actorEmail: user.email,
  });
  await c.env.DB.prepare(
    "UPDATE feature_requests SET dev_queue_status = 'building', updated_at = datetime('now') WHERE id = ?",
  ).bind(featureId).run();

  try {
    const { build, feature } = await runProjectAiBuild(c.env, project, detail, user.email);
    return c.json({ feature, build });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Build failed";
    await logFeatureActivity(c.env.DB, featureId, "ai", "ai_build_failed", message, { actorEmail: user.email });
    return c.json({ error: message }, 502);
  }
});

studioRoutes.post("/projects/:projectId/features/:featureId/review/ai", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const user = c.get("user")!;
  const featureId = c.req.param("featureId");
  const detail = await loadProjectFeatureDetail(c.env.DB, project.id, featureId);
  if (!detail) return c.json({ error: "Not found" }, 404);
  const pr = detail.pullRequests[0];
  if (!pr) return c.json({ error: "No PR linked" }, 400);

  const github = githubConfigForProject(c.env, project);
  if (!github) return c.json({ error: "GitHub not configured" }, 503);

  const diff = await fetchPullRequestDiff(github, pr.prNumber);
  const aiResult = await reviewPullRequestAgainstPrd(
    c.env.OPENAI_API_KEY,
    getJalContextForProject(project.jalContext),
    {
      featureTitle: detail.title,
      assessment: detail.aiAssessment,
      prDiff: diff,
      taskTitles: detail.tasks.map((t) => t.title),
    },
  );

  const reviewId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO feature_code_reviews (id, feature_request_id, pr_id, reviewer_type, verdict, summary, findings_json)
     VALUES (?, ?, ?, 'ai', ?, ?, ?)`,
  ).bind(reviewId, featureId, pr.id, aiResult.verdict, aiResult.summary, JSON.stringify(aiResult.findings)).run();

  const devStatus: DevQueueStatus = aiResult.verdict === "pass" ? "ready_for_approval" : "fix_needed";
  await c.env.DB.prepare(
    "UPDATE feature_requests SET dev_queue_status = ?, updated_at = datetime('now') WHERE id = ?",
  ).bind(devStatus, featureId).run();

  await logFeatureActivity(c.env.DB, featureId, "ai", "ai_code_review", aiResult.summary, { actorEmail: user.email });
  const feature = await loadProjectFeatureDetail(c.env.DB, project.id, featureId);
  return c.json({ feature, review: aiResult });
});

studioRoutes.post("/projects/:projectId/features/:featureId/approve-ship", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const user = c.get("user")!;
  const featureId = c.req.param("featureId");
  const detail = await loadProjectFeatureDetail(c.env.DB, project.id, featureId);
  if (!detail) return c.json({ error: "Not found" }, 404);

  const latestPr = detail.pullRequests[0];
  if (latestPr) {
    try {
      await mergeProjectPr(c.env, project, latestPr.prNumber, `feat(jal): ${detail.title}`, user.email);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : "Merge failed" }, 502);
    }
  }

  await c.env.DB.prepare(
    "UPDATE feature_requests SET status = 'shipped', dev_queue_status = 'shipped', updated_at = datetime('now') WHERE id = ?",
  ).bind(featureId).run();

  await logFeatureActivity(c.env.DB, featureId, "employee", "ship_approved", "Shipped via Jal Studio", {
    actorEmail: user.email,
  });

  const feature = await loadProjectFeatureDetail(c.env.DB, project.id, featureId);
  return c.json({ feature, githubPrMerged: Boolean(latestPr) });
});

studioRoutes.patch("/projects/:projectId/features/:featureId/pipeline", requireAuth(), requireProjectOwner(), async (c) => {
  const project = c.get("project");
  const user = c.get("user")!;
  const featureId = c.req.param("featureId");
  const body = z.object({
    status: z.enum(["queued", "building", "in_review", "fix_needed", "ready_for_approval", "shipped"]),
  }).parse(await c.req.json());

  await c.env.DB.prepare(
    "UPDATE feature_requests SET dev_queue_status = ?, updated_at = datetime('now') WHERE id = ? AND project_id = ?",
  ).bind(body.status, featureId, project.id).run();

  if (body.status === "shipped") {
    await c.env.DB.prepare(
      "UPDATE feature_requests SET status = 'shipped', updated_at = datetime('now') WHERE id = ?",
    ).bind(featureId).run();
  }

  await logFeatureActivity(c.env.DB, featureId, "employee", "pipeline_moved", `Moved to ${body.status}`, {
    actorEmail: user.email,
  });

  const feature = await loadProjectFeatureDetail(c.env.DB, project.id, featureId);
  return c.json({ feature });
});

// Public project meta for embed page (no secrets)
studioRoutes.get("/projects/:projectId/public", async (c) => {
  const project = await findProjectById(c.env.DB, c.req.param("projectId"));
  if (!project) return c.json({ error: "Not found" }, 404);
  return c.json({
    projectId: project.id,
    name: project.name,
    productName: project.jalContext.productName,
  });
});
