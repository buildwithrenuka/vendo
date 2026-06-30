import type { ScorecardRating } from "@vendo/shared";
import { parseJson } from "../lib/utils";

export function computeRating(
  approved: number,
  rejected: number,
  autoApproved: number,
): ScorecardRating {
  if (rejected > 0 && rejected >= approved + autoApproved) return "red";
  if (approved + autoApproved >= 1 && rejected === 0) return "green";
  if (rejected > 0) return "yellow";
  return "yellow";
}

export async function recordSubmissionOutcome(
  db: D1Database,
  buyerId: string,
  supplierId: string,
  outcome: "approved" | "rejected" | "auto_approved",
): Promise<void> {
  const existing = await db
    .prepare(
      "SELECT id, approved_count, rejected_count, auto_approved_count FROM supplier_scorecards WHERE buyer_id = ? AND supplier_id = ?",
    )
    .bind(buyerId, supplierId)
    .first<{
      id: string;
      approved_count: number;
      rejected_count: number;
      auto_approved_count: number;
    }>();

  let approved = existing?.approved_count ?? 0;
  let rejected = existing?.rejected_count ?? 0;
  let autoApproved = existing?.auto_approved_count ?? 0;

  if (outcome === "approved") approved += 1;
  if (outcome === "rejected") rejected += 1;
  if (outcome === "auto_approved") autoApproved += 1;

  const rating = computeRating(approved, rejected, autoApproved);

  if (existing) {
    await db
      .prepare(
        `UPDATE supplier_scorecards
         SET approved_count = ?, rejected_count = ?, auto_approved_count = ?, rating = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(approved, rejected, autoApproved, rating, existing.id)
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO supplier_scorecards
       (id, buyer_id, supplier_id, rating, approved_count, rejected_count, auto_approved_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), buyerId, supplierId, rating, approved, rejected, autoApproved)
    .run();
}

export async function getScorecard(
  db: D1Database,
  buyerId: string,
  supplierId: string | null,
): Promise<{
  rating: ScorecardRating;
  approvedCount: number;
  rejectedCount: number;
  autoApprovedCount: number;
} | null> {
  if (!supplierId) return null;

  const row = await db
    .prepare(
      "SELECT rating, approved_count, rejected_count, auto_approved_count FROM supplier_scorecards WHERE buyer_id = ? AND supplier_id = ?",
    )
    .bind(buyerId, supplierId)
    .first<{
      rating: ScorecardRating;
      approved_count: number;
      rejected_count: number;
      auto_approved_count: number;
    }>();

  if (!row) return { rating: "yellow", approvedCount: 0, rejectedCount: 0, autoApprovedCount: 0 };

  return {
    rating: row.rating,
    approvedCount: row.approved_count,
    rejectedCount: row.rejected_count,
    autoApprovedCount: row.auto_approved_count,
  };
}

export async function upsertVerifiedProfile(
  db: D1Database,
  supplierId: string,
  submissionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const existing = await db
    .prepare("SELECT supplier_id FROM supplier_profiles WHERE supplier_id = ?")
    .bind(supplierId)
    .first();

  const payload = JSON.stringify(data);
  const now = new Date().toISOString();

  if (existing) {
    await db
      .prepare(
        `UPDATE supplier_profiles
         SET profile_data_json = ?, verified_at = ?, source_submission_id = ?, updated_at = datetime('now')
         WHERE supplier_id = ?`,
      )
      .bind(payload, now, submissionId, supplierId)
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO supplier_profiles (supplier_id, profile_data_json, verified_at, source_submission_id)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(supplierId, payload, now, submissionId)
    .run();
}

export async function getVerifiedProfile(
  db: D1Database,
  supplierId: string,
): Promise<{ profileData: Record<string, unknown>; verifiedAt: string } | null> {
  const row = await db
    .prepare("SELECT profile_data_json, verified_at FROM supplier_profiles WHERE supplier_id = ? AND verified_at IS NOT NULL")
    .bind(supplierId)
    .first<{ profile_data_json: string; verified_at: string }>();

  if (!row) return null;

  return {
    profileData: parseJson(row.profile_data_json, {}),
    verifiedAt: row.verified_at,
  };
}
