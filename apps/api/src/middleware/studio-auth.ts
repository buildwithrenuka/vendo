import { createMiddleware } from "hono/factory";
import type { AppEnv } from "./auth";
import { findProjectByApiKey, findProjectById } from "../lib/studio-projects";
import type { JalProject } from "@vendo/shared";

export type StudioEnv = AppEnv & {
  Variables: AppEnv["Variables"] & {
    project: JalProject;
    apiKeyRaw?: string;
  };
};

function parseBearerAuth(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const key = header.slice(7).trim();
  return key.startsWith("jal_live_") ? key : null;
}

export function requireProjectApiKey() {
  return createMiddleware<StudioEnv>(async (c, next) => {
    const rawKey = parseBearerAuth(c.req.header("Authorization"));
    if (!rawKey) {
      return c.json({ error: "Missing or invalid API key", code: "API_KEY_REQUIRED" }, 401);
    }
    const project = await findProjectByApiKey(c.env.DB, rawKey);
    if (!project) {
      return c.json({ error: "Invalid API key", code: "API_KEY_INVALID" }, 401);
    }
    c.set("project", project);
    c.set("apiKeyRaw", rawKey);
    await next();
  });
}

export function requireProjectOwner() {
  return createMiddleware<StudioEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId") ?? c.req.param("id");
    if (!projectId) return c.json({ error: "Project id required" }, 400);

    const project = await findProjectById(c.env.DB, projectId);
    if (!project) return c.json({ error: "Project not found" }, 404);
    if (project.ownerUserId !== user.id) {
      return c.json({ error: "Forbidden", code: "PROJECT_FORBIDDEN" }, 403);
    }

    c.set("project", project);
    await next();
  });
}
