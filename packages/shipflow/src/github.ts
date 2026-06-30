export type GitHubConfig = {
  token: string;
  repo: string;
};

export type GitHubEnvConfig = {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
};

export function githubConfigFromEnv(config: GitHubEnvConfig): GitHubConfig | null {
  const token = config.GITHUB_TOKEN?.trim();
  const repo = config.GITHUB_REPO?.trim();
  if (!token || !repo || !repo.includes("/")) return null;
  return { token, repo };
}

export function repoDisplayName(config: GitHubEnvConfig): string | null {
  return config.GITHUB_REPO?.trim() ?? null;
}

export function githubConfigured(config: GitHubEnvConfig): boolean {
  return githubConfigFromEnv(config) !== null;
}

export type GitHubPullRequest = {
  number: number;
  title: string;
  html_url: string;
  head: { ref: string; sha: string };
  state: string;
  merged: boolean;
};

function parseRepo(config: GitHubConfig): { owner: string; repo: string } {
  const [owner, repo] = config.repo.split("/");
  if (!owner || !repo) throw new Error("GITHUB_REPO must use owner/repo format");
  return { owner, repo };
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

async function githubJson<T>(config: GitHubConfig, path: string, init?: RequestInit): Promise<T> {
  const res = await githubFetch(config, path, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${path}: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function githubFetch(config: GitHubConfig, path: string, init?: RequestInit): Promise<Response> {
  const { owner, repo } = parseRepo(config);
  return fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: init?.method === "GET" && path.includes("/contents/")
        ? "application/vnd.github.raw"
        : "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "jal",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchRepoContext(config: GitHubConfig, maxFiles = 8): Promise<{
  defaultBranch: string;
  baseSha: string;
  treePaths: string[];
  fileSamples: Array<{ path: string; content: string }>;
}> {
  const repo = await githubJson<RepoMeta>(config, "");
  const branch = repo.default_branch;
  const ref = await githubJson<GitRef>(config, `/git/ref/heads/${branch}`);
  const baseSha = ref.object.sha;
  const commit = await githubJson<GitCommit>(config, `/git/commits/${baseSha}`);
  const tree = await githubJson<GitTree>(config, `/git/trees/${commit.tree.sha}?recursive=1`);

  const candidates = (tree.tree ?? [])
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter((p) =>
      (p.startsWith("apps/") || p.startsWith("packages/") || p.startsWith("src/"))
      && !p.includes("node_modules")
      && !p.includes(".wrangler")
      && !p.includes("/dist/")
      && /\.(ts|tsx|sql|jsonc?|jsx?)$/.test(p),
    )
    .slice(0, 120);

  const fileSamples: Array<{ path: string; content: string }> = [];
  for (const path of candidates.slice(0, maxFiles)) {
    try {
      const res = await githubFetch(config, `/contents/${path}?ref=${branch}`);
      if (!res.ok) continue;
      const text = await res.text();
      fileSamples.push({ path, content: text.slice(0, 6000) });
    } catch {
      /* skip */
    }
  }

  return { defaultBranch: branch, baseSha, treePaths: candidates, fileSamples };
}

export async function createPullRequestFromChanges(
  config: GitHubConfig,
  input: {
    featureId: string;
    featureTitle: string;
    prTitle: string;
    prBody: string;
    branchName: string;
    changes: CodeChange[];
    commitPrefix?: string;
  },
): Promise<CreatePrResult> {
  const { defaultBranch, baseSha } = await fetchRepoContext(config, 0);
  const branch = input.branchName.replace(/[^a-zA-Z0-9/_-]/g, "-").slice(0, 60);
  const fullBranch = branch.startsWith("jal/") ? branch : `jal/${branch}`;
  const prefix = input.commitPrefix ?? "jal";

  const blobShas: Array<{ path: string; sha: string; mode: "100644" }> = [];
  for (const change of input.changes) {
    const blob = await githubJson<{ sha: string }>(config, "/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: change.content, encoding: "utf-8" }),
    });
    blobShas.push({ path: change.path, sha: blob.sha, mode: "100644" });
  }

  const tree = await githubJson<{ sha: string }>(config, "/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: (await githubJson<GitCommit>(config, `/git/commits/${baseSha}`)).tree.sha,
      tree: blobShas.map((b) => ({ path: b.path, mode: b.mode, type: "blob", sha: b.sha })),
    }),
  });

  const commit = await githubJson<{ sha: string }>(config, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `feat(${prefix}): ${input.featureTitle}\n\nAutomated by Jal AI builder.\nFeature ID: ${input.featureId}`,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });

  try {
    await githubJson(config, "/git/refs", {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${fullBranch}`, sha: commit.sha }),
    });
  } catch {
    await githubJson(config, `/git/refs/heads/${fullBranch}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
  }

  const pr = await githubJson<{ number: number; html_url: string }>(config, "/pulls", {
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
  return `jal/${slugify(title)}-${featureId.slice(0, 8)}`;
}

export async function fetchPullRequest(config: GitHubConfig, prNumber: number): Promise<GitHubPullRequest> {
  const res = await githubFetch(config, `/pulls/${prNumber}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub PR #${prNumber} not found: ${res.status} ${body.slice(0, 120)}`);
  }
  return res.json() as Promise<GitHubPullRequest>;
}

export type MergePullRequestResult = {
  merged: boolean;
  sha: string | null;
  message: string;
  alreadyMerged: boolean;
};

export async function mergePullRequest(
  config: GitHubConfig,
  prNumber: number,
  input?: { title?: string; message?: string; method?: "merge" | "squash" | "rebase" },
): Promise<MergePullRequestResult> {
  const pr = await fetchPullRequest(config, prNumber);

  if (pr.merged) {
    return {
      merged: true,
      sha: pr.head.sha,
      message: `Pull request #${prNumber} was already merged`,
      alreadyMerged: true,
    };
  }

  if (pr.state === "closed") {
    throw new Error(`Pull request #${prNumber} is closed and was not merged`);
  }

  const result = await githubJson<{ merged: boolean; sha?: string; message?: string }>(
    config,
    `/pulls/${prNumber}/merge`,
    {
      method: "PUT",
      body: JSON.stringify({
        commit_title: input?.title ?? pr.title,
        commit_message: input?.message ?? `Jal: approved and merged PR #${prNumber}`,
        merge_method: input?.method ?? "squash",
      }),
    },
  );

  return {
    merged: result.merged,
    sha: result.sha ?? null,
    message: result.message ?? `Pull request #${prNumber} merged`,
    alreadyMerged: false,
  };
}

export async function fetchPullRequestDiff(config: GitHubConfig, prNumber: number): Promise<string> {
  const res = await githubFetch(config, `/pulls/${prNumber}`);
  if (!res.ok) {
    throw new Error(`Failed to load PR #${prNumber}`);
  }
  const pr = (await res.json()) as GitHubPullRequest;

  const filesRes = await githubFetch(config, `/pulls/${prNumber}/files?per_page=100`);
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
