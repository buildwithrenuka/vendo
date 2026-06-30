/** Match server-side normalizeGithubRepo / validation */
export function normalizeGithubRepo(input: string): string {
  let s = input.trim();
  s = s.replace(/^https?:\/\/(?:www\.)?github\.com\//i, "");
  s = s.replace(/^(?:www\.)?github\.com\//i, "");
  s = s.replace(/\.git$/i, "");
  s = s.replace(/\/+$/, "");
  return s;
}

const GITHUB_REPO_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function isValidGithubRepo(repo: string): boolean {
  return GITHUB_REPO_PATTERN.test(normalizeGithubRepo(repo));
}

export function githubRepoHint(repo: string): string | null {
  const normalized = normalizeGithubRepo(repo);
  if (!normalized.includes("/")) {
    return "Use owner/repo — e.g. buildwithrenuka/vendo";
  }
  if (!GITHUB_REPO_PATTERN.test(normalized)) {
    return "Invalid repo format — use letters, numbers, dots, hyphens, underscores";
  }
  return null;
}
