import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../middleware/auth";
import { requireAuth, requireRole } from "../middleware/auth";
import { hasEnterpriseFeatures } from "../lib/pricing";
import { reconcileBuyerInvoices } from "../services/gst-reconciliation";

export const gstRoutes = new Hono<AppEnv>();

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(4),
  supplierGst: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  taxableAmount: z.number().optional(),
  gstAmount: z.number().optional(),
});

function requireEnterprise() {
  return async (c: import("hono").Context<AppEnv>, next: () => Promise<void>) => {
    const user = c.get("user");
    if (!user || !hasEnterpriseFeatures(user)) {
      return c.json(
        { error: "GST reconciliation requires Enterprise plan", code: "ENTERPRISE_REQUIRED" },
        403,
      );
    }
    await next();
  };
}

gstRoutes.get("/invoices", requireAuth(), requireRole("buyer"), requireEnterprise(), async (c) => {
  const user = c.get("user")!;
  const { results } = await c.env.DB
    .prepare(
      `SELECT id, supplier_id, invoice_number, invoice_date, supplier_gst,
              taxable_amount, gst_amount, match_status, matched_submission_id, notes, created_at
       FROM gst_invoices WHERE buyer_id = ? ORDER BY datetime(created_at) DESC`,
    )
    .bind(user.id)
    .all();

  return c.json({
    invoices: (results ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      supplierId: row.supplier_id ?? null,
      invoiceNumber: row.invoice_number,
      invoiceDate: row.invoice_date,
      supplierGst: row.supplier_gst ?? null,
      taxableAmount: row.taxable_amount ?? null,
      gstAmount: row.gst_amount ?? null,
      matchStatus: row.match_status,
      matchedSubmissionId: row.matched_submission_id ?? null,
      notes: row.notes ?? null,
      createdAt: row.created_at,
    })),
  });
});

gstRoutes.post("/invoices", requireAuth(), requireRole("buyer"), requireEnterprise(), async (c) => {
  const user = c.get("user")!;
  const body = invoiceSchema.parse(await c.req.json());
  const id = crypto.randomUUID();

  await c.env.DB
    .prepare(
      `INSERT INTO gst_invoices
       (id, buyer_id, supplier_id, invoice_number, invoice_date, supplier_gst, taxable_amount, gst_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      user.id,
      body.supplierId ?? null,
      body.invoiceNumber,
      body.invoiceDate,
      body.supplierGst?.toUpperCase() ?? null,
      body.taxableAmount ?? null,
      body.gstAmount ?? null,
    )
    .run();

  return c.json({ id }, 201);
});

gstRoutes.post("/reconcile", requireAuth(), requireRole("buyer"), requireEnterprise(), async (c) => {
  const user = c.get("user")!;
  const updated = await reconcileBuyerInvoices(c.env.DB, user.id);
  return c.json({ ok: true, updated });
});
