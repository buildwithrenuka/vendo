import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { JalRepoScanResult } from "@vendo/shared";
import { api } from "../../lib/api";
import { githubRepoHint, normalizeGithubRepo } from "../../lib/github-repo";
import { StudioAuthGate } from "./StudioHomePage";
import { StudioRepoPour } from "../../components/studio/StudioRepoPour";
import {
  GitHubIcon,
  StudioGlassCard,
  StudioMain,
  StudioPageHeader,
  StudioShell,
  StudioStepBar,
} from "../../components/studio/StudioUI";
import { JAL_NAME } from "../../lib/jal-brand";

export function StudioOnboardPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [scan, setScan] = useState<JalRepoScanResult | null>(null);
  const [normalizedRepo, setNormalizedRepo] = useState("");
  const [step, setStep] = useState<"form" | "scan" | "done">("form");
  const [serverReady, setServerReady] = useState<boolean | null>(null);

  const stepIndex = step === "form" ? 0 : step === "scan" && !scan ? 1 : 2;

  useEffect(() => {
    api.studioSetup()
      .then(({ ready }) => setServerReady(ready))
      .catch(() => setServerReady(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const repo = normalizeGithubRepo(githubRepo);
    const hint = githubRepoHint(githubRepo);
    if (hint) {
      setError(hint);
      return;
    }
    setNormalizedRepo(repo);
    setBusy(true);
    setError(null);
    try {
      const { project, apiKey: key } = await api.studioCreateProject({
        name: name.trim(),
        githubRepo: repo,
      });
      setProjectId(project.id);
      setApiKey(key);
      setStep("scan");
      const { scan: scanResult } = await api.studioScanRepo(project.id);
      setScan(scanResult);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach repo");
      setStep("form");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioAuthGate>
      <StudioShell>
        <StudioMain>
          <StudioPageHeader
            eyebrow="First pour"
            title={`Pour your repo into ${JAL_NAME}`}
            subtitle="Like water taking shape — AI absorbs your codebase and becomes your product brain."
            back={
              <Link to="/studio" className="text-sm text-landing-muted transition hover:text-[var(--color-landing-accent)]">
                ← Command center
              </Link>
            }
          />

          <StudioStepBar steps={["Pour", "Absorb", "Flow"]} current={stepIndex} />

          {step === "form" && (
            <StudioGlassCard className="p-6 sm:p-8" glow>
              <div className="mb-6 flex items-center gap-3">
                <div className="studio-project-icon">
                  <GitHubIcon />
                </div>
                <div>
                  <p className="font-semibold">Add a tributary</p>
                  <p className="text-xs text-landing-muted">One repo = one flowing pipeline</p>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--color-landing-text)]">Project name</span>
                  <input
                    className="app-field studio-field w-full rounded-xl border px-4 py-3 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My SaaS App"
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--color-landing-text)]">GitHub repo</span>
                  <input
                    className="app-field studio-field w-full rounded-xl border px-4 py-3 font-mono text-sm"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="buildwithrenuka/vendo"
                    required
                  />
                </label>

                {serverReady === true && (
                  <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    River source ready — GitHub & OpenAI online
                  </p>
                )}

                {serverReady === false && (
                  <details className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-landing-muted">
                    <summary className="cursor-pointer font-semibold text-amber-200">Local server setup</summary>
                    <pre className="mt-2 font-mono text-[11px] text-[var(--color-landing-accent)]">{`GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=sk-...`}</pre>
                  </details>
                )}

                {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

                <button type="submit" disabled={busy} className="btn-primary w-full rounded-xl py-3.5 text-sm font-bold">
                  {busy ? "Pouring…" : "Pour repo →"}
                </button>
              </form>
            </StudioGlassCard>
          )}

          {(step === "scan" || step === "done") && (
            <StudioGlassCard className="p-6 sm:p-10" glow={!!scan}>
              {step === "scan" && !scan && (
                <div className="py-8 text-center">
                  <div className="studio-scan-ring mx-auto flex items-center justify-center">
                    <GitHubIcon className="relative z-10 h-8 w-8 text-[var(--color-landing-accent)]" />
                  </div>
                  <p className="mt-6 text-lg font-semibold">Absorbing repository…</p>
                  <p className="mt-2 text-sm text-landing-muted">Context is flowing into {JAL_NAME}</p>
                </div>
              )}

              {scan && (
                <div className="animate-fade-up">
                  <StudioRepoPour repo={normalizedRepo} scan={scan} />

                  {apiKey && (
                    <div className="mx-auto mt-8 max-w-md rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-transparent p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-200">Widget API key</p>
                      <code className="mt-3 block break-all rounded-lg bg-[var(--color-landing-elevated)] px-3 py-2 font-mono text-xs">{apiKey}</code>
                    </div>
                  )}

                  <div className="mt-10 flex flex-wrap justify-center gap-3">
                    {projectId && (
                      <>
                        <Link to={`/studio/projects/${projectId}`} className="btn-primary rounded-xl px-8 py-3 text-sm font-bold">
                          Enter the river →
                        </Link>
                        <Link to={`/studio/projects/${projectId}/embed`} className="btn-secondary rounded-xl px-6 py-3 text-sm font-semibold">
                          Drop widget
                        </Link>
                        <button type="button" onClick={() => navigate(`/studio/projects/${projectId}/embed`)} className="text-sm text-[var(--color-landing-accent)] underline">
                          Preview customer icon
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </StudioGlassCard>
          )}
        </StudioMain>
      </StudioShell>
    </StudioAuthGate>
  );
}
