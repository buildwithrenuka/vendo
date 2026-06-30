import type { D1Database } from "@cloudflare/workers-types";
import { FormSchemaPayload, SUPPLIER_STARTER_FIELDS } from "@vendo/forms";

const DEFAULT_FORM_NAME = "Supplier Onboarding";

const defaultFormSchema: FormSchemaPayload = {
  title: "Supplier Onboarding",
  description: "Complete your supplier profile for this buyer.",
  fields: SUPPLIER_STARTER_FIELDS,
};

/** Publish starter onboarding form if buyer has none yet. */
export async function ensurePublishedDefaultForm(db: D1Database, buyerId: string): Promise<boolean> {
  const existing = await db
    .prepare(
      `SELECT id FROM form_templates
       WHERE buyer_id = ? AND published_at IS NOT NULL
       LIMIT 1`,
    )
    .bind(buyerId)
    .first();

  if (existing) return false;

  const templateId = crypto.randomUUID();
  const publishedAt = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO form_templates (id, buyer_id, name, version, schema_json, published_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
    )
    .bind(templateId, buyerId, DEFAULT_FORM_NAME, JSON.stringify(defaultFormSchema), publishedAt)
    .run();

  return true;
}
