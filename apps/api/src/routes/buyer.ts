import { Hono } from "hono";
import type { AppEnv } from "../middleware/auth";
import { requireAuth, requireRole } from "../middleware/auth";
import { extractDomain, parseJson } from "../lib/utils";
import { ensurePublishedDefaultForm } from "../lib/buyer-setup";
import { SaveFormInput, FormSchemaPayload, SUPPLIER_STARTER_FIELDS } from "@vendo/forms";
import { extractBuyerInfoFromDocument } from "../services/prefill";
import { getScorecard } from "../services/scorecard";
import { z } from "zod";

export const buyerRoutes = new Hono<AppEnv>();

const defaultFormSchema: FormSchemaPayload = {
  title: "Supplier Onboarding",
  description: "Complete your supplier profile for this buyer.",
  fields: SUPPLIER_STARTER_FIELDS,
};

const verificationSchema = z.object({
  businessEmail: z.string().email(),
  companyName: z.string().min(2),
  gstNumber: z.string().optional(),
});

buyerRoutes.post("/verify/extract", requireAuth(), requireRole("undecided"), async (c) => {
  const body = z.object({ documentText: z.string().min(20) }).parse(await c.req.json());
  const extracted = await extractBuyerInfoFromDocument(body.documentText, c.env.OPENAI_API_KEY);
  return c.json({ extracted });
});

buyerRoutes.post("/verify", requireAuth(), requireRole("undecided"), async (c) => {
  const user = c.get("user")!;
  const body = verificationSchema.parse(await c.req.json());

  const verificationId = crypto.randomUUID();
  const domain = extractDomain(body.businessEmail);

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO buyer_verifications (id, user_id, business_email, gst_number, status)
       VALUES (?, ?, ?, ?, 'approved')`,
    ).bind(verificationId, user.id, body.businessEmail, body.gstNumber ?? null),
    c.env.DB.prepare(
      `UPDATE users SET
         role = 'buyer',
         buyer_verification_status = 'approved',
         company_name = ?,
         business_email_domain = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(body.companyName, domain, user.id),
  ]);

  await ensurePublishedDefaultForm(c.env.DB, user.id);

  return c.json({
    status: "approved",
    message: "You're verified. Your default onboarding form is live — invite your first supplier.",
  }, 201);
});

buyerRoutes.post("/verify/:id/approve", requireAuth(), async (c) => {
  const verificationId = c.req.param("id");

  const verification = await c.env.DB
    .prepare("SELECT user_id FROM buyer_verifications WHERE id = ?")
    .bind(verificationId)
    .first<{ user_id: string }>();

  if (!verification) {
    return c.json({ error: "Verification not found" }, 404);
  }

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE buyer_verifications SET status = 'approved', updated_at = datetime('now') WHERE id = ?").bind(verificationId),
    c.env.DB.prepare("UPDATE users SET buyer_verification_status = 'approved', updated_at = datetime('now') WHERE id = ?").bind(verification.user_id),
  ]);

  await ensurePublishedDefaultForm(c.env.DB, verification.user_id);

  return c.json({ ok: true });
});

buyerRoutes.get("/suppliers", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;

  const { results } = await c.env.DB
    .prepare(
      `SELECT
         i.id AS invite_id,
         i.email,
         i.phone,
         i.created_at AS invited_at,
         i.accepted_at,
         u.id AS supplier_user_id,
         u.name AS supplier_name,
         s.id AS submission_id,
         s.status AS submission_status,
         s.submitted_at,
         s.data_json
       FROM invites i
       LEFT JOIN users u ON u.id = i.accepted_by_user_id
       LEFT JOIN form_submissions s ON s.supplier_id = u.id
         AND s.buyer_id = i.buyer_id
         AND s.id = (
           SELECT id FROM form_submissions
           WHERE supplier_id = u.id AND buyer_id = i.buyer_id
           ORDER BY datetime(created_at) DESC
           LIMIT 1
         )
       WHERE i.buyer_id = ?
       ORDER BY datetime(i.created_at) DESC`,
    )
    .bind(user.id)
    .all();

  return c.json({
    suppliers: await Promise.all(
      (results ?? []).map(async (row: Record<string, unknown>) => {
        const supplierUserId = row.supplier_user_id as string | null;
        const scorecard = await getScorecard(c.env.DB, user.id, supplierUserId);
        return {
          inviteId: row.invite_id,
          email: row.email,
          phone: row.phone ?? null,
          invitedAt: row.invited_at,
          acceptedAt: row.accepted_at ?? null,
          supplierName: row.supplier_name ?? null,
          supplierUserId,
          submissionId: row.submission_id ?? null,
          status: row.submission_status ?? (row.accepted_at ? "onboarding" : "invited"),
          submittedAt: row.submitted_at ?? null,
          data: row.data_json ? parseJson(row.data_json as string, {}) : null,
          scorecard,
        };
      }),
    ),
  });
});

buyerRoutes.get("/onboarding-form", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;

  const template = await c.env.DB
    .prepare(
      `SELECT * FROM form_templates
       WHERE buyer_id = ? AND published_at IS NOT NULL
       ORDER BY version DESC LIMIT 1`,
    )
    .bind(user.id)
    .first<{ id: string; name: string; version: number; schema_json: string; published_at: string }>();

  if (!template) {
    return c.json({ template: null, defaultSchema: defaultFormSchema });
  }

  const parsed = FormSchemaPayload.safeParse(parseJson(template.schema_json, defaultFormSchema));
  return c.json({
    template: {
      id: template.id,
      name: template.name,
      version: template.version,
      schema: parsed.success ? parsed.data : defaultFormSchema,
      publishedAt: template.published_at,
    },
  });
});

buyerRoutes.get("/onboarding-form/versions", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const { results } = await c.env.DB
    .prepare(
      `SELECT id, name, version, published_at, created_at
       FROM form_templates WHERE buyer_id = ? ORDER BY version DESC`,
    )
    .bind(user.id)
    .all();

  return c.json({ versions: results });
});

buyerRoutes.post("/onboarding-form", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const body = SaveFormInput.parse(await c.req.json());

  const latest = await c.env.DB
    .prepare("SELECT MAX(version) as max_version FROM form_templates WHERE buyer_id = ? AND name = ?")
    .bind(user.id, body.name)
    .first<{ max_version: number | null }>();

  const version = (latest?.max_version ?? 0) + 1;
  const templateId = crypto.randomUUID();
  const publishedAt = body.publish ? new Date().toISOString() : null;

  await c.env.DB
    .prepare(
      `INSERT INTO form_templates (id, buyer_id, name, version, schema_json, published_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(templateId, user.id, body.name, version, JSON.stringify(body.schema), publishedAt)
    .run();

  return c.json({ id: templateId, version, publishedAt }, 201);
});
