/// <reference path="../env.ts" />

import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../middleware/auth";
import {
  createUser,
  findOAuthAccount,
  findUserByEmail,
  linkOAuthAccount,
  updateUserRole,
} from "../lib/users";
import {
  buildClearSessionCookie,
  buildSessionCookie,
  createSession,
  destroySession,
} from "../lib/session";
import { hashInviteToken, randomToken } from "../lib/crypto";
import { oidcEndpoints } from "../lib/config";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleAuthCode,
  exchangeSeekIdCode,
  fetchSeekIdProfile,
  friendlyGoogleOAuthError,
  verifyGoogleLogin,
  type OAuthProfile,
} from "../lib/google-auth";
import { addDays, nowIso } from "../lib/utils";
import { ensureBootstrapAdmin, loginEmployee } from "../lib/employee-auth";

async function saveOAuthState(
  db: D1Database,
  state: string,
  inviteToken: string | null,
  redirectPath: string | null,
): Promise<void> {
  const expiresAt = addDays(new Date(), 1).toISOString();
  await db
    .prepare(
      "INSERT INTO oauth_states (state, invite_token, redirect_path, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(state, inviteToken, redirectPath, expiresAt)
    .run();
}

async function consumeOAuthState(
  db: D1Database,
  state: string,
): Promise<{ invite_token: string | null; redirect_path: string | null } | null> {
  const row = await db
    .prepare("SELECT invite_token, redirect_path FROM oauth_states WHERE state = ? AND expires_at > ?")
    .bind(state, nowIso())
    .first<{ invite_token: string | null; redirect_path: string | null }>();

  if (!row) return null;
  await db.prepare("DELETE FROM oauth_states WHERE state = ?").bind(state).run();
  return row;
}

async function processInviteForUser(db: D1Database, userId: string, email: string, inviteToken: string): Promise<void> {
  const tokenHash = await hashInviteToken(inviteToken);
  const invite = await db
    .prepare(
      `SELECT * FROM invites
       WHERE token_hash = ? AND expires_at > ? AND accepted_at IS NULL`,
    )
    .bind(tokenHash, nowIso())
    .first<{ id: string; email: string }>();

  if (!invite) return;
  if (invite.email.toLowerCase() !== email.toLowerCase()) return;

  await updateUserRole(db, userId, "supplier");
  await db
    .prepare(
      "UPDATE invites SET accepted_at = ?, accepted_by_user_id = ? WHERE id = ?",
    )
    .bind(nowIso(), userId, invite.id)
    .run();
}

async function upsertOAuthUser(
  db: D1Database,
  provider: "google" | "oidc",
  profile: OAuthProfile,
  inviteToken: string | null,
): Promise<string> {
  const existingOAuth = await findOAuthAccount(db, provider, profile.id);
  if (existingOAuth) {
    if (inviteToken) {
      await processInviteForUser(db, existingOAuth.user_id, profile.email, inviteToken);
    }
    return existingOAuth.user_id;
  }

  let user = await findUserByEmail(db, profile.email);
  if (!user) {
    user = await createUser(db, {
      id: crypto.randomUUID(),
      email: profile.email,
      name: profile.name ?? null,
      avatarUrl: profile.picture ?? null,
      role: "undecided",
    });
  }

  await linkOAuthAccount(db, {
    id: crypto.randomUUID(),
    userId: user.id,
    provider,
    providerUserId: profile.id,
  });

  if (inviteToken) {
    await processInviteForUser(db, user.id, profile.email, inviteToken);
  }

  return user.id;
}

function completeSession(c: { env: Env }, userId: string, redirectPath?: string, mode: "json" | "redirect" = "json") {
  return createSession(c.env.DB, userId, c.env.SESSION_SECRET).then((sessionToken) => {
    const secure = c.env.APP_URL.startsWith("https");
    const cookie = buildSessionCookie(sessionToken, secure);

    if (mode === "redirect" && redirectPath) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${c.env.APP_URL}${redirectPath}`,
          "Set-Cookie": cookie,
        },
      });
    }

    return new Response(JSON.stringify({ ok: true, redirect: redirectPath ?? "/dashboard" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
      },
    });
  });
}

export const authRoutes = new Hono<AppEnv>();

const googleBodySchema = z.object({
  credential: z.string().optional(),
  code: z.string().optional(),
  access_token: z.string().optional(),
  invite: z.string().optional(),
});

/** magic-secretary style — redirect to Google (same GOOGLE_CLIENT_ID/SECRET) */
authRoutes.get("/google", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.json({ error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." }, 503);
  }

  const invite = c.req.query("invite") ?? null;
  const redirect = c.req.query("redirect") ?? "/dashboard";
  const state = randomToken(16);

  await saveOAuthState(c.env.DB, state, invite, redirect);

  try {
    const url = buildGoogleAuthorizationUrl(c.env, state);
    return c.redirect(url);
  } catch (err) {
    return c.redirect(`${c.env.APP_URL}/login?error=${encodeURIComponent(friendlyGoogleOAuthError(err))}`);
  }
});

const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

/** Complete Google OAuth after redirect to APP_URL/auth/google/callback */
authRoutes.post("/google/callback", async (c) => {
  const body = googleCallbackSchema.parse(await c.req.json());

  const oauthState = await consumeOAuthState(c.env.DB, body.state);
  if (!oauthState) {
    return c.json({ error: "Invalid or expired OAuth state" }, 400);
  }

  try {
    const profile = await exchangeGoogleAuthCode(body.code, c.env);
    const userId = await upsertOAuthUser(c.env.DB, "google", profile, oauthState.invite_token);
    return completeSession(c, userId, oauthState.redirect_path ?? "/dashboard");
  } catch (err) {
    console.error("Google callback error:", err);
    return c.json({ error: friendlyGoogleOAuthError(err) }, 401);
  }
});

/** Optional GSI one-tap fallback */
authRoutes.post("/google", async (c) => {
  const body = googleBodySchema.parse(await c.req.json());

  try {
    const profile = await verifyGoogleLogin(body, c.env);
    const userId = await upsertOAuthUser(c.env.DB, "google", profile, body.invite ?? null);
    return completeSession(c, userId);
  } catch (err) {
    console.error("Google auth error:", err);
    return c.json({ error: err instanceof Error ? err.message : "Google login failed" }, 401);
  }
});

const oidcExchangeSchema = z.object({
  oidcToken: z.string().optional(),
  code: z.string().optional(),
  invite: z.string().optional(),
});

/** Poll-Seeker style POST /api/auth/oidc-exchange — federates with SeekID (Poll-Seeker OIDC) */
authRoutes.post("/oidc-exchange", async (c) => {
  const body = oidcExchangeSchema.parse(await c.req.json());

  if (!c.env.OIDC_ISSUER || !c.env.OIDC_CLIENT_ID || !c.env.OIDC_CLIENT_SECRET) {
    return c.json({ error: "SeekID OIDC not configured" }, 503);
  }

  try {
    let accessToken = body.oidcToken;
    if (!accessToken && body.code) {
      const tokens = await exchangeSeekIdCode(body.code, c.env);
      accessToken = tokens.access_token;
    }
    if (!accessToken) {
      return c.json({ error: "oidcToken or code required" }, 400);
    }

    const profile = await fetchSeekIdProfile(accessToken, c.env);
    const userId = await upsertOAuthUser(c.env.DB, "oidc", profile, body.invite ?? null);
    return completeSession(c, userId);
  } catch (err) {
    console.error("OIDC exchange error:", err);
    return c.json({ error: err instanceof Error ? err.message : "OIDC login failed" }, 401);
  }
});

/** Start SeekID login — stores invite in state, redirects to Poll-Seeker /oidc/auth */
authRoutes.get("/seekid", async (c) => {
  const { authorizationUrl } = oidcEndpoints(c.env);
  if (!c.env.OIDC_ISSUER || !c.env.OIDC_CLIENT_ID) {
    return c.json({ error: "SeekID OIDC not configured" }, 503);
  }

  const invite = c.req.query("invite") ?? null;
  const redirect = c.req.query("redirect") ?? "/dashboard";
  const state = randomToken(16);

  await saveOAuthState(c.env.DB, state, invite, redirect);

  const params = new URLSearchParams({
    client_id: c.env.OIDC_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL.replace(/\/$/, "")}/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  return c.redirect(`${authorizationUrl}?${params}`);
});

/** OIDC callback fallback when code lands on API (legacy server-side flow) */
authRoutes.get("/oidc/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) {
    return c.redirect(`${c.env.APP_URL}/login?error=oauth_failed`);
  }

  const oauthState = await consumeOAuthState(c.env.DB, state);
  if (!oauthState) {
    return c.redirect(`${c.env.APP_URL}/login?error=invalid_state`);
  }

  try {
    const tokens = await exchangeSeekIdCode(code, c.env);
    const profile = await fetchSeekIdProfile(tokens.access_token, c.env);
    const userId = await upsertOAuthUser(c.env.DB, "oidc", profile, oauthState.invite_token);
    return completeSession(c, userId, oauthState.redirect_path ?? "/dashboard", "redirect");
  } catch (err) {
    console.error("OIDC callback error:", err);
    return c.redirect(`${c.env.APP_URL}/login?error=oauth_failed`);
  }
});

authRoutes.post("/logout", async (c) => {
  const cookie = c.req.header("Cookie")?.match(/(?:vendo|vinmaya)_session=([^;]+)/)?.[1];
  if (cookie) {
    await destroySession(c.env.DB, decodeURIComponent(cookie));
  }
  return c.json({ ok: true }, {
    headers: { "Set-Cookie": buildClearSessionCookie() },
  });
});

const employeeLoginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(1).max(128),
});

/** Vendo employee username/password login */
authRoutes.post("/employee/login", async (c) => {
  await ensureBootstrapAdmin(c.env.DB, c.env);

  const body = employeeLoginSchema.parse(await c.req.json());
  const employee = await loginEmployee(c.env.DB, body.username, body.password);
  if (!employee) {
    const anyEmployee = await c.env.DB.prepare("SELECT id FROM vendo_employees LIMIT 1").first();
    if (!anyEmployee) {
      return c.json({
        error: "No employee accounts yet. Set VENDO_ADMIN_USERNAME and VENDO_ADMIN_PASSWORD in apps/api/.dev.vars, restart API, then try again.",
        code: "EMPLOYEE_NOT_CONFIGURED",
      }, 503);
    }
    return c.json({ error: "Invalid username or password" }, 401);
  }

  return completeSession(c, employee.user_id, "/internal");
});

/** Dev-only login when OAuth is not configured */
authRoutes.post("/dev-login", async (c) => {
  if (c.env.GOOGLE_CLIENT_ID) {
    return c.json({ error: "Dev login disabled when OAuth is configured" }, 403);
  }

  const body = (await c.req.json()) as {
    email?: string;
    name?: string;
    role?: "undecided" | "buyer" | "supplier";
    invite?: string;
  };

  const email = (body.email ?? "dev@acme.com").toLowerCase();
  const name = body.name ?? "Dev User";

  let user = await findUserByEmail(c.env.DB, email);
  if (!user) {
    user = await createUser(c.env.DB, {
      id: crypto.randomUUID(),
      email,
      name,
      role: body.role ?? "undecided",
    });
    await linkOAuthAccount(c.env.DB, {
      id: crypto.randomUUID(),
      userId: user.id,
      provider: "google",
      providerUserId: `dev-${email}`,
    });
  }

  if (body.role === "buyer") {
    await c.env.DB
      .prepare(
        `UPDATE users SET role = 'buyer', buyer_verification_status = 'approved',
         company_name = COALESCE(company_name, ?), updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(name, user.id)
      .run();
  }

  if (body.invite) {
    await processInviteForUser(c.env.DB, user.id, email, body.invite);
  }

  return completeSession(c, user.id);
});
