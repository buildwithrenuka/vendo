import type { User, UserRole, BuyerVerificationStatus, PricingTier } from "@vendo/shared";

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  buyer_verification_status: BuyerVerificationStatus;
  pricing_tier: PricingTier;
  company_name: string | null;
  business_email_domain: string | null;
  created_at: string;
}

export function mapUser(row: DbUser): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    role: row.role,
    buyerVerificationStatus: row.buyer_verification_status,
    pricingTier: row.pricing_tier,
    companyName: row.company_name,
    createdAt: row.created_at,
  };
}

export async function findUserById(db: D1Database, id: string): Promise<DbUser | null> {
  return db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<DbUser>();
}

export async function findUserByEmail(db: D1Database, email: string): Promise<DbUser | null> {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(email.toLowerCase())
    .first<DbUser>();
}

export async function createUser(
  db: D1Database,
  data: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    role?: UserRole;
  },
): Promise<DbUser> {
  await db
    .prepare(
      `INSERT INTO users (id, email, name, avatar_url, role)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(data.id, data.email.toLowerCase(), data.name ?? null, data.avatarUrl ?? null, data.role ?? "undecided")
    .run();

  const user = await findUserById(db, data.id);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function updateUserRole(db: D1Database, userId: string, role: UserRole): Promise<void> {
  await db
    .prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(role, userId)
    .run();
}

export async function linkOAuthAccount(
  db: D1Database,
  data: { id: string; userId: string; provider: "google" | "oidc"; providerUserId: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO oauth_accounts (id, user_id, provider, provider_user_id)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(data.id, data.userId, data.provider, data.providerUserId)
    .run();
}

export async function findOAuthAccount(
  db: D1Database,
  provider: "google" | "oidc",
  providerUserId: string,
): Promise<{ user_id: string } | null> {
  return db
    .prepare("SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?")
    .bind(provider, providerUserId)
    .first<{ user_id: string }>();
}
