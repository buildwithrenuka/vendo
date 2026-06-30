import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../middleware/auth";
import { requireAuth, requireRole } from "../middleware/auth";
import { parseJson } from "../lib/utils";
import { sendSubmissionReviewEmailOrLog } from "../lib/email";
import { translateRulesFromPlainLanguage } from "../services/approval-engine";
import type { StructuredRule } from "@vendo/shared";
import {
  recordSubmissionOutcome,
  upsertVerifiedProfile,
} from "../services/scorecard";

export const rulesRoutes = new Hono<AppEnv>();

const createRulesSchema = z.object({
  naturalLanguage: z.string().min(10),
});

rulesRoutes.post("/", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const body = createRulesSchema.parse(await c.req.json());

  const structuredRules = await translateRulesFromPlainLanguage(body.naturalLanguage, c.env.OPENAI_API_KEY);
  const rulesetId = crypto.randomUUID();

  await c.env.DB
    .prepare(
      `INSERT INTO approval_rulesets (id, buyer_id, natural_language, structured_rules_json)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(rulesetId, user.id, body.naturalLanguage, JSON.stringify(structuredRules))
    .run();

  return c.json({
    id: rulesetId,
    naturalLanguage: body.naturalLanguage,
    structuredRules,
  }, 201);
});

rulesRoutes.get("/", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const ruleset = await c.env.DB
    .prepare(
      "SELECT * FROM approval_rulesets WHERE buyer_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .bind(user.id)
    .first<{ id: string; natural_language: string; structured_rules_json: string; created_at: string }>();

  if (!ruleset) {
    return c.json({ ruleset: null });
  }

  return c.json({
    ruleset: {
      id: ruleset.id,
      naturalLanguage: ruleset.natural_language,
      structuredRules: parseJson<StructuredRule[]>(ruleset.structured_rules_json, []),
      createdAt: ruleset.created_at,
    },
  });
});

export const reviewRoutes = new Hono<AppEnv>();

reviewRoutes.get("/queue", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const { results } = await c.env.DB
    .prepare(
      `SELECT s.id, s.status, s.data_json, s.rule_results_json, s.submitted_at,
              u.name as supplier_name, u.email as supplier_email,
              f.name as form_name, f.version as form_version
       FROM form_submissions s
       JOIN users u ON u.id = s.supplier_id
       JOIN form_templates f ON f.id = s.form_template_id
       WHERE s.buyer_id = ? AND s.status IN ('pending_review', 'submitted')
       ORDER BY s.submitted_at DESC`,
    )
    .bind(user.id)
    .all();

  return c.json({
    queue: results?.map((row: Record<string, unknown>) => ({
      ...row,
      data: parseJson(row.data_json as string, {}),
      ruleResults: parseJson(row.rule_results_json as string | null, null),
    })),
  });
});

const reviewActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

reviewRoutes.post("/:id/action", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const submissionId = c.req.param("id");
  const body = reviewActionSchema.parse(await c.req.json());

  const submission = await c.env.DB
    .prepare(
      `SELECT s.buyer_id, s.supplier_id, s.data_json,
              u.email as supplier_email, u.name as supplier_name
       FROM form_submissions s
       JOIN users u ON u.id = s.supplier_id
       WHERE s.id = ?`,
    )
    .bind(submissionId)
    .first<{
      buyer_id: string;
      supplier_id: string;
      data_json: string;
      supplier_email: string;
      supplier_name: string | null;
    }>();

  if (!submission || submission.buyer_id !== user.id) {
    return c.json({ error: "Submission not found" }, 404);
  }

  const status = body.action === "approve" ? "approved" : "rejected";
  await c.env.DB
    .prepare("UPDATE form_submissions SET status = ?, reviewed_at = datetime('now') WHERE id = ?")
    .bind(status, submissionId)
    .run();

  await recordSubmissionOutcome(
    c.env.DB,
    submission.buyer_id,
    submission.supplier_id,
    body.action === "approve" ? "approved" : "rejected",
  );

  if (body.action === "approve") {
    const data = parseJson<Record<string, unknown>>(submission.data_json, {});
    await upsertVerifiedProfile(c.env.DB, submission.supplier_id, submissionId, data);
  }

  const buyerName = user.companyName ?? user.name ?? "Your buyer";
  const emailResult = await sendSubmissionReviewEmailOrLog(
    c.env.RESEND_API_KEY,
    c.env.FROM_EMAIL,
    {
      to: submission.supplier_email,
      supplierName: submission.supplier_name,
      buyerName,
      action: body.action,
      appUrl: c.env.APP_URL,
      notes: body.notes,
    },
  );

  return c.json({
    ok: true,
    status,
    emailSent: emailResult.sent,
    emailError: emailResult.emailError,
  });
});
