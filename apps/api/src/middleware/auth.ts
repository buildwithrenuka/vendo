/// <reference path="../env.ts" />

import { createMiddleware } from "hono/factory";
import type { User } from "@vendo/shared";
import { getCookie } from "../lib/utils";
import { getSessionUser, sessionCookieName } from "../lib/session";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: User | null;
  };
};

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const cookie = getCookie(c.req.raw, sessionCookieName());
  const user = await getSessionUser(c.env.DB, cookie, c.env.SESSION_SECRET);
  c.set("user", user);
  await next();
});

export function requireAuth() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
    }
    await next();
  });
}

export function requireRole(...roles: User["role"][]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }
    await next();
  });
}

export function requireBuyerApproved() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user || user.role !== "buyer") {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }
    if (user.buyerVerificationStatus !== "approved") {
      return c.json({ error: "Buyer verification required", code: "BUYER_NOT_VERIFIED" }, 403);
    }
    await next();
  });
}
