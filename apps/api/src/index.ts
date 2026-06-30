/// <reference path="./env.ts" />

import { Hono } from "hono";
import type { AppEnv } from "./middleware/auth";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { inviteRoutes } from "./routes/invites";
import { buyerRoutes } from "./routes/buyer";
import { featureRequestRoutes } from "./routes/feature-requests";
import { supplierRoutes } from "./routes/supplier";
import { rulesRoutes, reviewRoutes } from "./routes/rules";
import { gstRoutes } from "./routes/gst";
import { devQueueRoutes } from "./routes/dev-queue";
import { employeeAdminRoutes } from "./routes/employee-admin";
import { meRoutes } from "./routes/me";
import { corsHeaders } from "./lib/utils";
import { ensureBootstrapAdmin } from "./lib/employee-auth";

const app = new Hono<AppEnv>();

let employeeBootstrap: Promise<void> | null = null;

function bootstrapEmployees(env: Env, db: D1Database) {
  if (!employeeBootstrap) {
    employeeBootstrap = ensureBootstrapAdmin(db, env).catch((err) => {
      employeeBootstrap = null;
      console.error("[employee] Startup bootstrap failed:", err);
    });
  }
  return employeeBootstrap;
}

const allowedOrigins = (env: Env) => [
  env.APP_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") ?? null;
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin, allowedOrigins(c.env)),
    });
  }
  await next();
  const headers = corsHeaders(origin, allowedOrigins(c.env));
  for (const [key, value] of Object.entries(headers)) {
    c.res.headers.set(key, value);
  }
});

app.use("*", authMiddleware);

app.use("*", async (c, next) => {
  await bootstrapEmployees(c.env, c.env.DB);
  await next();
});

app.get("/health", (c) => c.json({ ok: true, service: "vendo-api" }));

app.route("/auth", authRoutes);
app.route("/me", meRoutes);
app.route("/invites", inviteRoutes);
app.route("/buyer", buyerRoutes);
app.route("/buyer/feature-requests", featureRequestRoutes);
app.route("/supplier", supplierRoutes);
app.route("/rules", rulesRoutes);
app.route("/review", reviewRoutes);
app.route("/buyer/gst", gstRoutes);
app.route("/dev", devQueueRoutes);
app.route("/dev/employees", employeeAdminRoutes);

app.onError((err, c) => {
  console.error(err);
  if (err.name === "ZodError") {
    return c.json({ error: "Validation failed", details: err.message }, 400);
  }
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
