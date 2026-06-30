import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../middleware/auth";
import { requireAuth, requireBuyerApproved, requireRole } from "../middleware/auth";
import { addDays, nowIso } from "../lib/utils";
import { hashInviteToken, randomToken } from "../lib/crypto";
import { sendInviteEmailOrLog } from "../lib/email";
import { assertCanInviteSupplier } from "../lib/pricing";

export const inviteRoutes = new Hono<AppEnv>();

function normalizePhone(phone?: string): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits;
}

function buildInviteUrl(appUrl: string, token: string): string {
  return `${appUrl}/invite/${token}`;
}

async function rotateInviteToken(
  db: D1Database,
  inviteId: string,
): Promise<{ token: string; expiresAt: string }> {
  const token = randomToken(32);
  const tokenHash = await hashInviteToken(token);
  const expiresAt = addDays(new Date(), 7).toISOString();

  await db
    .prepare(`UPDATE invites SET token_hash = ?, expires_at = ? WHERE id = ?`)
    .bind(tokenHash, expiresAt, inviteId)
    .run();

  return { token, expiresAt };
}

inviteRoutes.get("/:token/validate", async (c) => {
  const token = c.req.param("token");
  const tokenHash = await hashInviteToken(token);

  const invite = await c.env.DB
    .prepare(
      `SELECT i.*, u.name as buyer_name, u.company_name as buyer_company
       FROM invites i
       JOIN users u ON u.id = i.buyer_id
       WHERE i.token_hash = ? AND i.expires_at > ? AND i.accepted_at IS NULL`,
    )
    .bind(tokenHash, nowIso())
    .first<{
      email: string;
      expires_at: string;
      buyer_name: string | null;
      buyer_company: string | null;
    }>();

  if (!invite) {
    return c.json({ valid: false, error: "Invite expired or invalid" }, 404);
  }

  return c.json({
    valid: true,
    email: invite.email,
    expiresAt: invite.expires_at,
    buyerName: invite.buyer_company ?? invite.buyer_name ?? "A buyer",
  });
});

const createInviteSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
});

inviteRoutes.post("/", requireAuth(), requireRole("buyer"), requireBuyerApproved(), async (c) => {
  const user = c.get("user")!;
  const limitError = await assertCanInviteSupplier(user, c.env.DB);
  if (limitError) {
    return c.json({ error: limitError, code: "SUPPLIER_LIMIT" }, 403);
  }
  const body = createInviteSchema.parse(await c.req.json());
  const token = randomToken(32);
  const tokenHash = await hashInviteToken(token);
  const expiresAt = addDays(new Date(), 7).toISOString();
  const inviteId = crypto.randomUUID();
  const phone = normalizePhone(body.phone);
  const buyerName = user.companyName ?? user.name ?? "Your buyer";
  const inviteUrl = buildInviteUrl(c.env.APP_URL, token);

  await c.env.DB
    .prepare(
      `INSERT INTO invites (id, buyer_id, email, phone, token_hash, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(inviteId, user.id, body.email.toLowerCase(), phone, tokenHash, expiresAt)
    .run();

  const emailResult = await sendInviteEmailOrLog(c.env.RESEND_API_KEY, c.env.FROM_EMAIL, {
    to: body.email,
    buyerName,
    inviteUrl,
    expiresAt,
  });

  return c.json({
    id: inviteId,
    email: body.email,
    phone,
    expiresAt,
    emailSent: emailResult.sent,
    emailError: emailResult.emailError,
    inviteUrl,
  }, 201);
});

inviteRoutes.post("/:id/share-link", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const inviteId = c.req.param("id");

  const invite = await c.env.DB
    .prepare(
      `SELECT id, email, phone, accepted_at
       FROM invites WHERE id = ? AND buyer_id = ?`,
    )
    .bind(inviteId, user.id)
    .first<{
      id: string;
      email: string;
      phone: string | null;
      accepted_at: string | null;
    }>();

  if (!invite) {
    return c.json({ error: "Invite not found" }, 404);
  }

  if (invite.accepted_at) {
    return c.json({ error: "Invite already accepted" }, 400);
  }

  const { token, expiresAt } = await rotateInviteToken(c.env.DB, invite.id);
  const inviteUrl = buildInviteUrl(c.env.APP_URL, token);

  return c.json({
    id: invite.id,
    email: invite.email,
    phone: invite.phone,
    expiresAt,
    inviteUrl,
  });
});

inviteRoutes.get("/", requireAuth(), requireRole("buyer"), async (c) => {
  const user = c.get("user")!;
  const { results } = await c.env.DB
    .prepare(
      `SELECT id, email, phone, expires_at, accepted_at, created_at
       FROM invites WHERE buyer_id = ? ORDER BY created_at DESC`,
    )
    .bind(user.id)
    .all();

  return c.json({ invites: results });
});
