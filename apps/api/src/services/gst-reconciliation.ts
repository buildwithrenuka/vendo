import type { GstMatchStatus } from "@vendo/shared";
import { parseJson } from "../lib/utils";

const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

function normalizeGst(gst: string | null | undefined): string {
  return (gst ?? "").trim().toUpperCase();
}

export async function reconcileBuyerInvoices(db: D1Database, buyerId: string): Promise<number> {
  const { results: invoices } = await db
    .prepare(
      "SELECT id, supplier_id, supplier_gst FROM gst_invoices WHERE buyer_id = ? AND match_status = 'pending'",
    )
    .bind(buyerId)
    .all<{ id: string; supplier_id: string | null; supplier_gst: string | null }>();

  let updated = 0;

  for (const invoice of invoices ?? []) {
    const invoiceGst = normalizeGst(invoice.supplier_gst);
    if (!invoiceGst) {
      await setInvoiceStatus(db, invoice.id, "missing", null, "No supplier GST on invoice");
      updated += 1;
      continue;
    }

    const submission = await findMatchingSubmission(db, buyerId, invoice.supplier_id, invoiceGst);

    if (!submission) {
      await setInvoiceStatus(db, invoice.id, "missing", null, "No approved supplier with matching GST");
      updated += 1;
      continue;
    }

    const submissionGst = extractGstFromSubmission(submission.data_json);
    if (normalizeGst(submissionGst) === invoiceGst) {
      await setInvoiceStatus(db, invoice.id, "matched", submission.id, null);
    } else {
      await setInvoiceStatus(
        db,
        invoice.id,
        "mismatch",
        submission.id,
        `Submission GST ${submissionGst || "missing"} does not match invoice`,
      );
    }
    updated += 1;
  }

  return updated;
}

async function findMatchingSubmission(
  db: D1Database,
  buyerId: string,
  supplierId: string | null,
  invoiceGst: string,
): Promise<{ id: string; data_json: string } | null> {
  if (supplierId) {
    const bySupplier = await db
      .prepare(
        `SELECT id, data_json FROM form_submissions
         WHERE buyer_id = ? AND supplier_id = ? AND status IN ('approved', 'auto_approved')
         ORDER BY datetime(submitted_at) DESC LIMIT 1`,
      )
      .bind(buyerId, supplierId)
      .first<{ id: string; data_json: string }>();
    if (bySupplier) return bySupplier;
  }

  const { results } = await db
    .prepare(
      `SELECT id, data_json FROM form_submissions
       WHERE buyer_id = ? AND status IN ('approved', 'auto_approved')`,
    )
    .bind(buyerId)
    .all<{ id: string; data_json: string }>();

  for (const row of results ?? []) {
    if (normalizeGst(extractGstFromSubmission(row.data_json)) === invoiceGst) {
      return row;
    }
  }

  return null;
}

function extractGstFromSubmission(dataJson: string): string {
  const data = parseJson<Record<string, unknown>>(dataJson, {});
  const gst = data.gst_number ?? data.gst ?? data.GST;
  return gst == null ? "" : String(gst);
}

async function setInvoiceStatus(
  db: D1Database,
  invoiceId: string,
  status: GstMatchStatus,
  submissionId: string | null,
  notes: string | null,
): Promise<void> {
  await db
    .prepare(
      "UPDATE gst_invoices SET match_status = ?, matched_submission_id = ?, notes = ? WHERE id = ?",
    )
    .bind(status, submissionId, notes, invoiceId)
    .run();
}

export function isValidGstFormat(gst: string): boolean {
  return GST_PATTERN.test(gst.trim());
}
