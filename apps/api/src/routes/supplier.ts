import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../middleware/auth";
import { requireAuth, requireRole } from "../middleware/auth";
import { parseJson } from "../lib/utils";
import { suggestPrefill } from "../services/prefill";
import { allRulesPassed, evaluateRules } from "../services/approval-engine";
import type { StructuredRule } from "@vendo/shared";
import { FormSchemaPayload } from "@vendo/forms";
import { getVerifiedProfile, recordSubmissionOutcome, upsertVerifiedProfile } from "../services/scorecard";

export const supplierRoutes = new Hono<AppEnv>();

supplierRoutes.get("/onboarding", requireAuth(), requireRole("supplier"), async (c) => {
  const user = c.get("user")!;

  const invite = await c.env.DB
    .prepare(
      `SELECT i.buyer_id, u.company_name, u.name as buyer_name
       FROM invites i
       JOIN users u ON u.id = i.buyer_id
       WHERE i.accepted_by_user_id = ?
       ORDER BY i.accepted_at DESC LIMIT 1`,
    )
    .bind(user.id)
    .first<{ buyer_id: string; company_name: string | null; buyer_name: string | null }>();

  if (!invite) {
    return c.json({ error: "No buyer association found" }, 404);
  }

  const template = await c.env.DB
    .prepare(
      `SELECT * FROM form_templates
       WHERE buyer_id = ? AND published_at IS NOT NULL
       ORDER BY version DESC LIMIT 1`,
    )
    .bind(invite.buyer_id)
    .first<{ id: string; name: string; version: number; schema_json: string }>();

  if (!template) {
    return c.json({ error: "Buyer has not published an onboarding form yet" }, 404);
  }

  const existing = await c.env.DB
    .prepare(
      "SELECT * FROM form_submissions WHERE supplier_id = ? AND form_template_id = ?",
    )
    .bind(user.id, template.id)
    .first<{ id: string; data_json: string; status: string }>();

  const verifiedProfile = await getVerifiedProfile(c.env.DB, user.id);

  return c.json({
    buyer: {
      id: invite.buyer_id,
      name: invite.company_name ?? invite.buyer_name,
    },
    template: {
      id: template.id,
      name: template.name,
      version: template.version,
      schema: FormSchemaPayload.parse(parseJson(template.schema_json, { title: "", fields: [] })),
    },
    submission: existing
      ? {
          id: existing.id,
          data: parseJson<Record<string, unknown>>(existing.data_json, {}),
          status: existing.status,
        }
      : null,
    verifiedProfile: verifiedProfile
      ? { profileData: verifiedProfile.profileData, verifiedAt: verifiedProfile.verifiedAt }
      : null,
  });
});

const prefillSchema = z.object({
  companyName: z.string().min(2),
});

supplierRoutes.post("/prefill", requireAuth(), requireRole("supplier"), async (c) => {
  const user = c.get("user")!;
  const body = prefillSchema.parse(await c.req.json());
  const suggestions = await suggestPrefill(body.companyName, {
    apiKey: c.env.OPENAI_API_KEY,
    supplierId: user.id,
    db: c.env.DB,
  });
  return c.json({ suggestions });
});

const submitSchema = z.object({
  formTemplateId: z.string().uuid(),
  buyerId: z.string().uuid(),
  data: z.record(z.unknown()),
  submit: z.boolean().default(false),
});

supplierRoutes.post("/submit", requireAuth(), requireRole("supplier"), async (c) => {
  const user = c.get("user")!;
  const body = submitSchema.parse(await c.req.json());

  const template = await c.env.DB
    .prepare("SELECT id, buyer_id FROM form_templates WHERE id = ? AND buyer_id = ?")
    .bind(body.formTemplateId, body.buyerId)
    .first<{ id: string; buyer_id: string }>();

  if (!template) {
    return c.json({ error: "Form template not found" }, 404);
  }

  let status = body.submit ? "submitted" : "draft";
  let ruleResults = null;

  if (body.submit) {
    const ruleset = await c.env.DB
      .prepare("SELECT structured_rules_json FROM approval_rulesets WHERE buyer_id = ? ORDER BY created_at DESC LIMIT 1")
      .bind(body.buyerId)
      .first<{ structured_rules_json: string }>();

    const rules = parseJson<StructuredRule[]>(ruleset?.structured_rules_json ?? "[]", []);
    if (rules.length > 0) {
      ruleResults = evaluateRules(rules, body.data);
      status = allRulesPassed(ruleResults) ? "auto_approved" : "pending_review";
    } else {
      status = "pending_review";
    }
  }

  const existing = await c.env.DB
    .prepare("SELECT id FROM form_submissions WHERE supplier_id = ? AND form_template_id = ?")
    .bind(user.id, body.formTemplateId)
    .first<{ id: string }>();

  const submittedAt = body.submit ? new Date().toISOString() : null;

  if (existing) {
    await c.env.DB
      .prepare(
        `UPDATE form_submissions
         SET data_json = ?, status = ?, rule_results_json = ?, submitted_at = COALESCE(?, submitted_at)
         WHERE id = ?`,
      )
      .bind(JSON.stringify(body.data), status, ruleResults ? JSON.stringify(ruleResults) : null, submittedAt, existing.id)
      .run();

    if (body.submit && status === "auto_approved") {
      await recordSubmissionOutcome(c.env.DB, body.buyerId, user.id, "auto_approved");
      await upsertVerifiedProfile(c.env.DB, user.id, existing.id, body.data);
    }

    return c.json({ id: existing.id, status, ruleResults });
  }

  const submissionId = crypto.randomUUID();
  await c.env.DB
    .prepare(
      `INSERT INTO form_submissions
       (id, form_template_id, supplier_id, buyer_id, data_json, status, rule_results_json, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      submissionId,
      body.formTemplateId,
      user.id,
      body.buyerId,
      JSON.stringify(body.data),
      status,
      ruleResults ? JSON.stringify(ruleResults) : null,
      submittedAt,
    )
    .run();

  if (body.submit && status === "auto_approved") {
    await recordSubmissionOutcome(c.env.DB, body.buyerId, user.id, "auto_approved");
    await upsertVerifiedProfile(c.env.DB, user.id, submissionId, body.data);
  }

  return c.json({ id: submissionId, status, ruleResults }, 201);
});

supplierRoutes.get("/submissions", requireAuth(), requireRole("supplier"), async (c) => {
  const user = c.get("user")!;
  const { results } = await c.env.DB
    .prepare(
      `SELECT id, status, submitted_at, created_at, buyer_id
       FROM form_submissions WHERE supplier_id = ? ORDER BY created_at DESC`,
    )
    .bind(user.id)
    .all();

  return c.json({ submissions: results });
});
