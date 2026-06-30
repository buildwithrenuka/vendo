export type GitHubPullRequest = {
  number: number;
  title: string;
  html_url: string;
  head: { ref: string; sha: string };
  state: string;
  merged: boolean;
};

function parseRepo(env: Env): { owner: string; repo: string } | null {
  const raw = env.GITHUB_REPO?.trim();
  if (!raw || !raw.includes("/")) return null;
  const [owner, repo] = raw.split("/");
  if (!owner || !repo) return null;
  return { owner, repo };
}

export function repoDisplayName(env: Env): string | null {
  return env.GITHUB_REPO?.trim() ?? null;
}

type RepoMeta = { default_branch: string };

type GitRef = { object: { sha: string } };

type GitCommit = { tree: { sha: string } };

type GitTreeItem = { path: string; type: string; sha: string; size?: number };

type GitTree = { tree: GitTreeItem[]; truncated?: boolean };

export type CodeChange = {
  path: string;
  content: string;
  action: "create" | "modify";
};

export type CreatePrResult = {
  branch: string;
  prNumber: number;
  prUrl: string;
  headSha: string;
  filesChanged: number;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "feature";
}

async function githubJson<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const res = await githubFetch(env, path, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${path}: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function githubFetch(env: Env, path: string, init?: RequestInit): Promise<Response> {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not configured in apps/api/.dev.vars");
  }
  const repo = parseRepo(env);
  if (!repo) {
    throw new Error("GITHUB_REPO not configured (use owner/repo format)");
  }

  return fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: init?.method === "GET" && path.includes("/contents/")
        ? "application/vnd.github.raw"
        : "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "vendo-shipflow",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchRepoContext(env: Env, maxFiles = 8): Promise<{
  defaultBranch: string;
  baseSha: string;
  treePaths: string[];
  fileSamples: Array<{ path: string; content: string }>;
}> {
  const repo = await githubJson<RepoMeta>(env, "");
  const branch = repo.default_branch;
  const ref = await githubJson<GitRef>(env, `/git/ref/heads/${branch}`);
  const baseSha = ref.object.sha;
  const commit = await githubJson<GitCommit>(env, `/git/commits/${baseSha}`);
  const tree = await githubJson<GitTree>(env, `/git/trees/${commit.tree.sha}?recursive=1`);

  const candidates = (tree.tree ?? [])
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter((p) =>
      (p.startsWith("apps/") || p.startsWith("packages/"))
      && !p.includes("node_modules")
      && !p.includes(".wrangler")
      && !p.includes("/dist/")
      && /\.(ts|tsx|sql|jsonc?)$/.test(p),
    )
    .slice(0, 120);

  const fileSamples: Array<{ path: string; content: string }> = [];
  for (const path of candidates.slice(0, maxFiles)) {
    try {
      const res = await githubFetch(env, `/contents/${path}?ref=${branch}`);
      if (!res.ok) continue;
      const text = await res.text();
      fileSamples.push({ path, content: text.slice(0, 6000) });
    } catch {
      /* skip unreadable files */
    }
  }

  return { defaultBranch: branch, baseSha, treePaths: candidates, fileSamples };
}

export async function createPullRequestFromChanges(
  env: Env,
  input: {
    featureId: string;
    featureTitle: string;
    prTitle: string;
    prBody: string;
    branchName: string;
    changes: CodeChange[];
  },
): Promise<CreatePrResult> {
  const { defaultBranch, baseSha } = await fetchRepoContext(env, 0);
  const branch = input.branchName.replace(/[^a-zA-Z0-9/_-]/g, "-").slice(0, 60);
  const fullBranch = branch.startsWith("shipflow/") ? branch : `shipflow/${branch}`;

  const blobShas: Array<{ path: string; sha: string; mode: "100644" }> = [];
  for (const change of input.changes) {
    const blob = await githubJson<{ sha: string }>(env, "/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: change.content, encoding: "utf-8" }),
    });
    blobShas.push({ path: change.path, sha: blob.sha, mode: "100644" });
  }

  const tree = await githubJson<{ sha: string }>(env, "/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: (await githubJson<GitCommit>(env, `/git/commits/${baseSha}`)).tree.sha,
      tree: blobShas.map((b) => ({ path: b.path, mode: b.mode, type: "blob", sha: b.sha })),
    }),
  });

  const commit = await githubJson<{ sha: string }>(env, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `feat(shipflow): ${input.featureTitle}\n\nAutomated by Vendo ShipFlow AI builder.\nFeature ID: ${input.featureId}`,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });

  try {
    await githubJson(env, "/git/refs", {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${fullBranch}`, sha: commit.sha }),
    });
  } catch {
    await githubJson(env, `/git/refs/heads/${fullBranch}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
  }

  const pr = await githubJson<{ number: number; html_url: string }>(env, "/pulls", {
    method: "POST",
    body: JSON.stringify({
      title: input.prTitle,
      head: fullBranch,
      base: defaultBranch,
      body: input.prBody,
    }),
  });

  return {
    branch: fullBranch,
    prNumber: pr.number,
    prUrl: pr.html_url,
    headSha: commit.sha,
    filesChanged: input.changes.length,
  };
}

export function defaultBranchName(featureId: string, title: string): string {
  return `shipflow/${slugify(title)}-${featureId.slice(0, 8)}`;
}

export function githubConfigured(env: Env): boolean {
  return Boolean(env.GITHUB_TOKEN && parseRepo(env));
}

export async function fetchPullRequest(env: Env, prNumber: number): Promise<GitHubPullRequest> {
  const res = await githubFetch(env, `/pulls/${prNumber}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub PR #${prNumber} not found: ${res.status} ${body.slice(0, 120)}`);
  }
  return res.json() as Promise<GitHubPullRequest>;
}

export async function fetchPullRequestDiff(env: Env, prNumber: number): Promise<string> {
  const res = await githubFetch(env, `/pulls/${prNumber}`);
  if (!res.ok) {
    throw new Error(`Failed to load PR #${prNumber}`);
  }
  const pr = (await res.json()) as GitHubPullRequest;

  const filesRes = await githubFetch(env, `/pulls/${prNumber}/files?per_page=100`);
  if (!filesRes.ok) {
    throw new Error(`Failed to load PR files for #${prNumber}`);
  }
  const files = (await filesRes.json()) as Array<{
    filename: string;
    status: string;
    patch?: string;
  }>;

  const chunks = files.slice(0, 25).map((f) => {
    const patch = f.patch?.slice(0, 4000) ?? "(binary or too large)";
    return `File: ${f.filename} (${f.status})\n${patch}`;
  });

  return `PR #${prNumber}: ${pr.title}\nBranch: ${pr.head.ref}\n\n${chunks.join("\n\n---\n\n")}`;
}
