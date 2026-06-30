import {
  buildRequestContext,
  fetchRepoContext,
  mergePullRequest,
  fetchPullRequest,
  fetchPullRequestDiff,
  openAiJson,
  triageFeatureRequest,
  appendClarification,
  appendUserReply,
  reviewPullRequestAgainstPrd,
} from "@jal_ai/jal";
import type {
  ClarificationMessage,
  DevFeatureDetail,
  DevQueueStatus,
  FeatureRequest,
  FeatureRequestAssessment,
  FeatureRequestStatus,
  InternalDashboardStats,
  InternalInboxItem,
  JalProjectContext,
  JalRepoScanResult,
} from "@vendo/shared";
import { getJalContextForProject } from "../lib/jal-env";
import {
  defaultJalContext,
  findProjectById,
  generateApiKey,
  githubConfigForProject,
  hashApiKey,
  mapProjectRow,
  projectPublicUrl,
  type JalProjectRow,
} from "../lib/studio-projects";
import { parseJson } from "../lib/utils";
import { enqueueFeatureForDevelopment } from "./task-generator";
import { logFeatureActivity, loadActivityLog } from "./activity-log";
import { runAiCodeBuilder } from "./code-builder";

type FeatureRow = {
  id: string;
  buyer_id: string;
  project_id: string | null;
  submitter_email: string | null;
  title: string;
  description: string;
  request_type: FeatureRequest["requestType"];
  current_pain: string | null;
  status: FeatureRequestStatus;
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

export function mapFeatureRow(row: FeatureRow): FeatureRequest {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    projectId: row.project_id,
    submitterEmail: row.submitter_email,
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
    clarificationThread: parseJson<ClarificationMessage[]>(row.clarification_thread, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadProjectFeatureDetail(
  db: D1Database,
  projectId: string,
  featureId: string,
): Promise<DevFeatureDetail | null> {
  const row = await db
    .prepare(
      `SELECT fr.*, u.email as buyer_email, u.name as buyer_name, u.company_name
       FROM feature_requests fr
       JOIN users u ON u.id = fr.buyer_id
       WHERE fr.id = ? AND fr.project_id = ?`,
    )
    .bind(featureId, projectId)
    .first<FeatureRow>();

  if (!row) return null;

  const [tasks, prs, reviews, activityLog] = await Promise.all([
    db.prepare("SELECT * FROM feature_dev_tasks WHERE feature_request_id = ? ORDER BY sort_order").bind(featureId).all(),
    db.prepare("SELECT * FROM feature_pull_requests WHERE feature_request_id = ? ORDER BY created_at DESC").bind(featureId).all(),
    db.prepare("SELECT * FROM feature_code_reviews WHERE feature_request_id = ? ORDER BY created_at DESC").bind(featureId).all(),
    loadActivityLog(db, featureId),
  ]);

  const mapTask = (r: Record<string, unknown>) => ({
    id: r.id as string,
    featureRequestId: r.feature_request_id as string,
    title: r.title as string,
    description: (r.description as string) ?? null,
    status: r.status as DevFeatureDetail["tasks"][0]["status"],
    sortOrder: r.sort_order as number,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  });

  const mapPr = (r: Record<string, unknown>) => ({
    id: r.id as string,
    featureRequestId: r.feature_request_id as string,
    prNumber: r.pr_number as number,
    prUrl: r.pr_url as string,
    branch: (r.branch as string) ?? null,
    headSha: (r.head_sha as string) ?? null,
    reviewStatus: r.review_status as DevFeatureDetail["pullRequests"][0]["reviewStatus"],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  });

  const mapReview = (r: Record<string, unknown>) => ({
    id: r.id as string,
    featureRequestId: r.feature_request_id as string,
    prId: (r.pr_id as string) ?? null,
    reviewerType: r.reviewer_type as "ai" | "human",
    verdict: r.verdict as DevFeatureDetail["reviews"][0]["verdict"],
    summary: r.summary as string,
    findings: parseJson(r.findings_json as string, []),
    createdAt: r.created_at as string,
  });

  return {
    ...mapFeatureRow(row),
    buyerEmail: row.submitter_email ?? row.buyer_email,
    buyerName: row.submitter_email ?? row.company_name ?? row.buyer_name,
    tasks: (tasks.results ?? []).map(mapTask),
    pullRequests: (prs.results ?? []).map(mapPr),
    reviews: (reviews.results ?? []).map(mapReview),
    activityLog,
  };
}

export async function scanRepoForContext(
  env: Env,
  githubRepo: string,
): Promise<JalRepoScanResult> {
  const github = githubConfigForProject(env, {
    id: "",
    ownerUserId: "",
    name: githubRepo.split("/").pop() ?? "App",
    githubRepo,
    jalContext: defaultJalContext("App"),
    repoScannedAt: null,
    createdAt: "",
    updatedAt: "",
  });

  if (!github) {
    throw new Error("GitHub not configured — set GITHUB_TOKEN on the API server");
  }

  const repo = await fetchRepoContext(github, 6);
  const scan = await openAiJson<{
    productName: string;
    productContext: string;
    stackContext: string;
    detectedStack: string[];
    existingFeatures: JalProjectContext["existingFeatures"];
  }>(
    env.OPENAI_API_KEY!,
    `You analyze GitHub repositories for Jal — an AI product development pipeline.
Return JSON: productName, productContext (2-3 sentences), stackContext (tech stack for AI code builder),
detectedStack (string array), existingFeatures (array of {keywords,name,url,description}).`,
    JSON.stringify({
      repo: githubRepo,
      treeSample: repo.treePaths.slice(0, 50),
      fileSamples: repo.fileSamples.map((f) => ({ path: f.path, preview: f.content.slice(0, 2000) })),
    }),
  );

  return {
    productName: scan?.productName ?? githubRepo.split("/").pop() ?? "My App",
    productContext: scan?.productContext ?? `Software product at ${githubRepo}.`,
    stackContext: scan?.stackContext ?? "Follow patterns in the repository.",
    detectedStack: scan?.detectedStack ?? [],
    existingFeatures: scan?.existingFeatures ?? [],
    treeSample: repo.treePaths.slice(0, 30),
  };
}

export async function applyProjectTriage(
  env: Env,
  db: D1Database,
  project: { id: string; jalContext: JalProjectContext; ownerUserId: string },
  featureId: string,
  title: string,
  description: string,
  thread: ClarificationMessage[],
  requestType: FeatureRequest["requestType"],
  actorEmail?: string,
): Promise<FeatureRequest> {
  const jal = getJalContextForProject(project.jalContext);
  const result = await triageFeatureRequest(
    env.OPENAI_API_KEY,
    title,
    description,
    thread,
    requestType,
    {
      shipflow: jal,
      excludeRequestId: featureId,
      findPriorRequests: async (excludeRequestId) => {
        const { results } = await db
          .prepare(
            `SELECT id, title, description, status FROM feature_requests
             WHERE project_id = ? AND id != COALESCE(?, '')
             AND status IN ('shipped', 'already_exists', 'planned', 'in_development', 'ai_review')
             ORDER BY updated_at DESC LIMIT 25`,
          )
          .bind(project.id, excludeRequestId ?? null)
          .all<{ id: string; title: string; description: string; status: FeatureRequestStatus }>();
        return results ?? [];
      },
    },
  );

  let updatedThread = thread;
  if (result.clarificationQuestions?.length) {
    updatedThread = appendClarification(thread, result.clarificationQuestions);
  }

  await db
    .prepare(
      `UPDATE feature_requests SET status = ?, decline_reason = ?, existing_feature_url = ?,
       ai_feedback = ?, ai_assessment_json = ?, clarification_thread = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      result.status,
      result.declineReason ?? null,
      result.existingFeatureUrl ?? null,
      result.feedback,
      JSON.stringify(result.assessment),
      JSON.stringify(updatedThread),
      featureId,
    )
    .run();

  await logFeatureActivity(db, featureId, "ai", "ai_triage", result.feedback, {
    metadata: { status: result.status, verdict: result.assessment.verdict },
  });

  if (result.status === "planned") {
    await enqueueFeatureForDevelopment(
      env,
      db,
      featureId,
      title,
      JSON.stringify(result.assessment),
      env.OPENAI_API_KEY,
      actorEmail,
    );
  }

  const row = await db.prepare("SELECT * FROM feature_requests WHERE id = ?").bind(featureId).first<FeatureRow>();
  return mapFeatureRow(row!);
}

export async function listProjectInbox(db: D1Database, projectId: string, type?: string): Promise<InternalInboxItem[]> {
  const sql =
    type === "feature" || type === "bug"
      ? `SELECT fr.*, u.email as buyer_email FROM feature_requests fr
         JOIN users u ON u.id = fr.buyer_id WHERE fr.project_id = ? AND fr.request_type = ?
         ORDER BY fr.updated_at DESC`
      : `SELECT fr.*, u.email as buyer_email FROM feature_requests fr
         JOIN users u ON u.id = fr.buyer_id WHERE fr.project_id = ?
         ORDER BY fr.updated_at DESC`;

  const { results } =
    type === "feature" || type === "bug"
      ? await db.prepare(sql).bind(projectId, type).all<FeatureRow>()
      : await db.prepare(sql).bind(projectId).all<FeatureRow>();

  return (results ?? []).map((row) => ({
    ...mapFeatureRow(row),
    buyerEmail: row.submitter_email ?? row.buyer_email,
    buyerName: row.submitter_email ?? row.buyer_name,
  }));
}

export async function projectStats(db: D1Database, projectId: string): Promise<InternalDashboardStats> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as total,
         SUM(CASE WHEN request_type = 'feature' THEN 1 ELSE 0 END) as features,
         SUM(CASE WHEN request_type = 'bug' THEN 1 ELSE 0 END) as bugs,
         SUM(CASE WHEN dev_queue_status IS NOT NULL AND dev_queue_status != 'shipped' THEN 1 ELSE 0 END) as in_pipeline,
         SUM(CASE WHEN dev_queue_status = 'ready_for_approval' THEN 1 ELSE 0 END) as awaiting_approval
       FROM feature_requests WHERE project_id = ?`,
    )
    .bind(projectId)
    .first<{ total: number; features: number; bugs: number; in_pipeline: number; awaiting_approval: number }>();

  return {
    total: row?.total ?? 0,
    features: row?.features ?? 0,
    bugs: row?.bugs ?? 0,
    inPipeline: row?.in_pipeline ?? 0,
    awaitingApproval: row?.awaiting_approval ?? 0,
  };
}

export async function runProjectAiBuild(
  env: Env,
  project: { id: string; githubRepo: string; jalContext: JalProjectContext },
  detail: DevFeatureDetail,
  actorEmail: string,
): Promise<{ build: Awaited<ReturnType<typeof runAiCodeBuilder>>; feature: DevFeatureDetail }> {
  const github = githubConfigForProject(env, {
    id: project.id,
    ownerUserId: "",
    name: "",
    githubRepo: project.githubRepo,
    jalContext: project.jalContext,
    repoScannedAt: null,
    createdAt: "",
    updatedAt: "",
  });
  if (!github) throw new Error("GitHub not configured — set GITHUB_TOKEN in .dev.vars");

  const build = await runAiCodeBuilder(env, {
    featureId: detail.id,
    featureTitle: detail.title,
    description: detail.description,
    assessment: detail.aiAssessment,
    taskTitles: detail.tasks.map((t) => t.title),
    github,
    jal: getJalContextForProject(project.jalContext),
  });

  const prId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO feature_pull_requests (id, feature_request_id, pr_number, pr_url, branch, head_sha, review_status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
  ).bind(prId, detail.id, build.prNumber, build.prUrl, build.branch, build.headSha).run();

  await env.DB.prepare(
    "UPDATE feature_requests SET dev_queue_status = 'in_review', updated_at = datetime('now') WHERE id = ?",
  ).bind(detail.id).run();

  await logFeatureActivity(env.DB, detail.id, "ai", "ai_build_complete", build.summary, {
    actorEmail,
    metadata: { prNumber: build.prNumber, prUrl: build.prUrl },
  });

  const feature = await loadProjectFeatureDetail(env.DB, project.id, detail.id);
  return { build, feature: feature! };
}

export async function mergeProjectPr(
  env: Env,
  project: { githubRepo: string; jalContext: JalProjectContext },
  prNumber: number,
  title: string,
  actorEmail: string,
) {
  const github = githubConfigForProject(env, {
    id: "",
    ownerUserId: "",
    name: "",
    githubRepo: project.githubRepo,
    jalContext: project.jalContext,
    repoScannedAt: null,
    createdAt: "",
    updatedAt: "",
  });
  if (!github) throw new Error("GitHub not configured");
  return mergePullRequest(github, prNumber, { title, message: `Approved via Jal Studio by ${actorEmail}` });
}
