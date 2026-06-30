import type { User } from "@vendo/shared";
import { STANDARD_TIER_MAX_SUPPLIERS } from "@vendo/shared";

export async function countBuyerSuppliers(db: D1Database, buyerId: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS total FROM invites WHERE buyer_id = ?")
    .bind(buyerId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function assertCanInviteSupplier(user: User, db: D1Database): Promise<string | null> {
  if (user.pricingTier === "enterprise") return null;
  const count = await countBuyerSuppliers(db, user.id);
  if (count >= STANDARD_TIER_MAX_SUPPLIERS) {
    return `Standard plan allows up to ${STANDARD_TIER_MAX_SUPPLIERS} suppliers. Upgrade to Enterprise for unlimited invites.`;
  }
  return null;
}

export function hasEnterpriseFeatures(user: User): boolean {
  return user.pricingTier === "enterprise";
}
