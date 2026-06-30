import type { JalProject, JalProjectContext } from "@vendo/shared";
import { sha256Hex, randomToken } from "./crypto";
import { parseJson } from "./utils";

export type JalProjectRow = {
  id: string;
  owner_user_id: string;
  name: string;
  github_repo: string;
  jal_context_json: string;
  api_key_hash: string;
  repo_scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

export function defaultJalContext(name: string): JalProjectContext {
  return {
    profile: "generic",
    productName: name,
    productContext: `${name} is a software product. Customers submit feature requests through Jal.`,
    stackContext: "Modern web app — follow existing patterns in the repository.",
    existingFeatures: [],
    outOfScopeTerms: [],
    primaryUserLabels: ["user", "admin"],
    feedbackTabUrl: "/feedback",
  };
}

export function mapProjectRow(row: JalProjectRow): JalProject {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    githubRepo: row.github_repo,
    jalContext: parseJson<JalProjectContext>(row.jal_context_json, defaultJalContext(row.name)),
    repoScannedAt: row.repo_scanned_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function hashApiKey(rawKey: string): Promise<string> {
  return sha256Hex(`jal-api:${rawKey}`);
}

export function generateApiKey(): string {
  return `jal_live_${randomToken(24)}`;
}

export async function findProjectById(db: D1Database, id: string): Promise<JalProject | null> {
  const row = await db
    .prepare("SELECT * FROM jal_projects WHERE id = ?")
    .bind(id)
    .first<JalProjectRow>();
  return row ? mapProjectRow(row) : null;
}

export async function findProjectByApiKey(db: D1Database, rawKey: string): Promise<JalProject | null> {
  const hash = await hashApiKey(rawKey);
  const row = await db
    .prepare("SELECT * FROM jal_projects WHERE api_key_hash = ?")
    .bind(hash)
    .first<JalProjectRow>();
  return row ? mapProjectRow(row) : null;
}

export function githubConfigForProject(env: Env, project: JalProject) {
  const token = env.GITHUB_TOKEN?.trim();
  if (!token || !project.githubRepo.includes("/")) return null;
  return { token, repo: project.githubRepo.trim() };
}

export function projectPublicUrl(appUrl: string, projectId: string): string {
  return `${appUrl.replace(/\/$/, "")}/embed/${projectId}`;
}

/** Accept owner/repo, github.com URLs, or .git suffix */
export function normalizeGithubRepo(input: string): string {
  let s = input.trim();
  s = s.replace(/^https?:\/\/(?:www\.)?github\.com\//i, "");
  s = s.replace(/^(?:www\.)?github\.com\//i, "");
  s = s.replace(/\.git$/i, "");
  s = s.replace(/\/+$/, "");
  return s;
}

export const GITHUB_REPO_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function isValidGithubRepo(repo: string): boolean {
  return GITHUB_REPO_PATTERN.test(repo);
}
