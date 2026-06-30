import { useEffect, useState } from "react";

const STAGES = [
  { id: "request", label: "Request", detail: "Customer submits feedback" },
  { id: "triage", label: "Triage", detail: "AI classifies & scopes" },
  { id: "tasks", label: "Tasks", detail: "Engineering plan generated" },
  { id: "build", label: "Build", detail: "Code + GitHub PR opened" },
  { id: "merge", label: "Merge", detail: "Human approves → shipped" },
];

export function FlowRiverHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setActive((i) => (i + 1) % STAGES.length), 2200);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="jal-flow-hero relative mx-auto aspect-square max-w-md lg:max-w-none">
      <div className="jal-flow-orbit pointer-events-none absolute inset-0 rounded-[2rem]" aria-hidden />
      <div className="jal-flow-glass relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[2rem] border border-[var(--color-landing-border)] p-6 sm:min-h-[400px]">
        <div className="flex items-center justify-between border-b border-[var(--color-landing-border)] pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-landing-accent)]">
              Live pipeline
            </p>
            <p className="mt-1 text-sm font-semibold">feat-042 · Multi-city search</p>
          </div>
          <span className="jal-live-dot flex items-center gap-1.5 rounded-full border border-[var(--color-landing-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-landing-accent)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-landing-accent)]" />
            Flowing
          </span>
        </div>

        <div className="relative mt-6 flex flex-1 items-stretch gap-4">
          <div className="relative w-3 shrink-0 overflow-hidden rounded-full bg-[var(--color-landing-elevated)]">
            <div className="jal-stream absolute inset-x-0 top-0 h-full w-full" />
            {STAGES.map((_, i) => (
              <span
                key={STAGES[i].id}
                className="absolute left-1/2 z-10 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-[var(--color-landing-bg)] transition-all duration-500"
                style={{
                  top: `${8 + i * 19}%`,
                  background: i <= active ? "var(--color-landing-accent)" : "var(--color-landing-muted)",
                  boxShadow: i === active ? "0 0 12px var(--color-landing-accent)" : "none",
                  transform: `translateX(-50%) scale(${i === active ? 1.35 : 1})`,
                }}
              />
            ))}
          </div>

          <div className="flex flex-1 flex-col justify-between py-1">
            {STAGES.map((stage, i) => (
              <div
                key={stage.id}
                className={`rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                  i === active
                    ? "jal-stage-active border-[var(--color-landing-accent)] bg-[var(--color-landing-accent-soft)]"
                    : i < active
                      ? "border-[var(--color-landing-border)] opacity-70"
                      : "border-transparent opacity-40"
                }`}
              >
                <p className="text-xs font-bold">{stage.label}</p>
                <p className="text-[11px] text-landing-muted">{stage.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 truncate rounded-lg border border-[var(--color-landing-border)] bg-[var(--color-landing-elevated)] px-3 py-2 font-mono text-[11px] text-[var(--color-landing-accent)]">
          github.com/your-org/repo/pull/18
        </div>
      </div>
    </div>
  );
}
