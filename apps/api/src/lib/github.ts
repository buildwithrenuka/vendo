import {
  createPullRequestFromChanges as createPr,
  defaultBranchName as defaultBranch,
  fetchPullRequest as fetchPr,
  fetchPullRequestDiff as fetchPrDiff,
  fetchRepoContext as fetchRepo,
  githubConfigFromEnv,
  githubConfigured as isGithubConfigured,
  mergePullRequest as mergePr,
  repoDisplayName as repoName,
  type CodeChange,
  type CreatePrResult,
  type GitHubPullRequest,
  type MergePullRequestResult,
} from "@jal_ai/jal";

export type { CodeChange, CreatePrResult, GitHubPullRequest, MergePullRequestResult };

function cfg(env: Env) {
  const config = githubConfigFromEnv(env);
  if (!config) throw new Error("GitHub not configured — set GITHUB_TOKEN and GITHUB_REPO in .dev.vars");
  return config;
}

export function repoDisplayName(env: Env): string | null {
  return repoName(env);
}

export function githubConfigured(env: Env): boolean {
  return isGithubConfigured(env);
}

export function fetchRepoContext(env: Env, maxFiles = 8) {
  return fetchRepo(cfg(env), maxFiles);
}

export function createPullRequestFromChanges(
  env: Env,
  input: Parameters<typeof createPr>[1],
) {
  return createPr(cfg(env), input);
}

export function defaultBranchName(featureId: string, title: string) {
  return defaultBranch(featureId, title);
}

export function fetchPullRequest(env: Env, prNumber: number) {
  return fetchPr(cfg(env), prNumber);
}

export function mergePullRequest(
  env: Env,
  prNumber: number,
  input?: Parameters<typeof mergePr>[2],
) {
  return mergePr(cfg(env), prNumber, input);
}

export function fetchPullRequestDiff(env: Env, prNumber: number) {
  return fetchPrDiff(cfg(env), prNumber);
}
