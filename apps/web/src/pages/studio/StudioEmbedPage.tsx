import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { StudioAuthGate } from "./StudioHomePage";
import { JalWidget } from "../../components/studio/JalWidget";
import { storageKey } from "../../lib/studio-api";
import {
  StudioGlassCard,
  StudioMain,
  StudioPageHeader,
  StudioShell,
} from "../../components/studio/StudioUI";

const NPM_INSTALL = "npm install @jal_ai/jal";

export function StudioEmbedPage() {
  const { projectId = "" } = useParams();
  const [embedUrl, setEmbedUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.studioEmbedInfo(projectId).then((info) => setEmbedUrl(info.embedUrl));
    api.studioGetProject(projectId).then(({ project }) => {
      setProductName(project.jalContext.productName);
      const stored = localStorage.getItem(storageKey(projectId, "apiKey"));
      if (stored) setApiKey(stored);
    });
  }, [projectId]);

  const regenerate = async () => {
    const { apiKey: key } = await api.studioRegenerateKey(projectId);
    setNewKey(key);
    setApiKey(key);
    localStorage.setItem(storageKey(projectId, "apiKey"), key);
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const widgetCode = `import { JalWidget } from "./components/studio/JalWidget";

<JalWidget
  projectId="${projectId}"
  apiKey="${apiKey || "jal_live_..."}"
  productName="${productName}"
  placement="bottom-right"
/>`;

  return (
    <StudioAuthGate>
      <StudioShell>
        <StudioMain>
          <StudioPageHeader
            eyebrow="Downstream surface"
            title="Drop the widget in your app"
            subtitle="Customer feedback becomes droplets on your river — this is the intake valve."
            back={
              <Link to={`/studio/projects/${projectId}`} className="text-sm text-landing-muted transition hover:text-[var(--color-landing-accent)]">
                ← Live river
              </Link>
            }
          />

          <div className="studio-embed-river mb-8" aria-hidden>
            <div className="studio-embed-river-track">
              <span className="studio-embed-droplet" />
              <span className="studio-embed-droplet delay-1" />
              <span className="studio-embed-droplet delay-2" />
            </div>
            <p className="studio-embed-river-caption">Widget → river → merged PR</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <StudioGlassCard className="p-5 sm:p-6" glow>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-landing-accent)]">01 · React widget</p>
                  <h2 className="mt-1 text-lg font-bold">Floating icon</h2>
                </div>
                <button type="button" onClick={() => copy(widgetCode, "widget")} className="btn-secondary rounded-lg px-3 py-1 text-xs font-semibold">
                  {copied === "widget" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-[var(--color-landing-border)] bg-[var(--color-landing-elevated)] p-4 font-mono text-[11px] leading-relaxed text-[var(--color-landing-accent)]">
                {widgetCode}
              </pre>
            </StudioGlassCard>

            <StudioGlassCard className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-landing-accent)]">02 · iframe</p>
                  <h2 className="mt-1 text-lg font-bold">Full-page embed</h2>
                </div>
                <button type="button" onClick={() => copy(embedUrl, "embed")} className="btn-secondary rounded-lg px-3 py-1 text-xs font-semibold">
                  {copied === "embed" ? "Copied!" : "Copy URL"}
                </button>
              </div>
              <code className="mt-4 block break-all rounded-xl bg-[var(--color-landing-elevated)] p-4 font-mono text-xs">{embedUrl || "…"}</code>
            </StudioGlassCard>

            <StudioGlassCard className="p-5 sm:p-6 lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-landing-accent)]">03 · npm (headless)</p>
              <h2 className="mt-1 text-lg font-bold">Same engine, your backend</h2>
              <pre className="mt-4 inline-block rounded-xl bg-[var(--color-landing-elevated)] px-4 py-2 font-mono text-sm text-[var(--color-landing-accent)]">{NPM_INSTALL}</pre>
              <p className="mt-3 text-sm text-landing-muted">Wire triage, build, and PR merge in your own API routes.</p>
            </StudioGlassCard>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={regenerate} className="btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold">
              Regenerate API key
            </button>
            {embedUrl && (
              <Link to={embedUrl} target="_blank" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
                Preview embed page
              </Link>
            )}
          </div>

          {newKey && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-transparent p-5">
              <p className="text-xs font-bold uppercase text-amber-200">New API key — save now</p>
              <code className="mt-2 block break-all font-mono text-xs">{newKey}</code>
            </div>
          )}

          <p className="mt-10 text-center text-xs text-landing-muted">Live widget preview ↓</p>
        </StudioMain>

        {apiKey && <JalWidget projectId={projectId} apiKey={apiKey} productName={productName} />}
      </StudioShell>
    </StudioAuthGate>
  );
}
