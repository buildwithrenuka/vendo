import { useEffect, useState } from "react";
import { JAL_STUDIO } from "../../lib/jal-brand";

const STAGES = [
  { label: "Request", detail: "Customer submits feedback" },
  { label: "Triage", detail: "AI classifies the request" },
  { label: "Tasks", detail: "Engineering plan created" },
  { label: "Build", detail: "Code and PR opened" },
  { label: "Merge", detail: "Approved and shipped" },
];

export function FlowRiverHero() {
  const [active, setActive] = useState(0);
  const progress = ((active + 1) / STAGES.length) * 100;

  useEffect(() => {
    const t = window.setInterval(() => setActive((i) => (i + 1) % STAGES.length), 2800);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="jal-device-frame">
      <div className="jal-device-chrome">
        <span className="jal-device-dot" />
        <span className="jal-device-dot" />
        <span className="jal-device-dot" />
        <span className="ml-2 text-xs text-landing-muted">{JAL_STUDIO} · Pipeline</span>
      </div>
      <div className="jal-flow-glass border-0 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-landing-border)] pb-4">
          <div>
            <p className="text-sm font-semibold">Multi-city search</p>
            <p className="text-xs text-landing-muted">feat-042</p>
          </div>
          <span className="jal-live-dot inline-flex items-center gap-2 text-xs text-landing-muted">
            Live
          </span>
        </div>

        <div className="jal-pipeline-track mt-5 h-1 bg-[var(--color-landing-elevated)]">
          <div className="jal-pipeline-fill h-full rounded-full" style={{ width: `${progress}%` }} />
        </div>

        <ol className="mt-5 space-y-2">
          {STAGES.map((stage, i) => {
            const isActive = i === active;
            const isDone = i < active;
            const state = isActive ? "is-active" : isDone ? "is-done" : "is-pending";

            return (
              <li
                key={stage.label}
                className={`jal-pipeline-step-row flex items-center gap-3 rounded-xl px-3 py-2.5 ${state} ${
                  isActive ? "jal-stage-active bg-[color-mix(in_srgb,var(--color-landing-accent)_8%,var(--color-landing-surface))]" : ""
                }`}
              >
                <span
                  className={`jal-step-dot flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive ? "jal-step-dot--active" : isDone ? "jal-step-dot--done" : "jal-step-dot--pending"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="text-xs text-landing-muted">{stage.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-4 truncate rounded-lg bg-[var(--color-landing-elevated)] px-3 py-2 font-mono text-xs text-landing-muted">
          github.com/your-org/repo/pull/18
        </p>
      </div>
    </div>
  );
}
