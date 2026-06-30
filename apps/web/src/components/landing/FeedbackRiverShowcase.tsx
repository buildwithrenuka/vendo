import { useCallback, useEffect, useState } from "react";

type DemoDroplet = {
  id: string;
  title: string;
  kind: "feature" | "bug";
  progress: number;
  lane: number;
  stage: string;
  customer: { status: string; message: string };
  dev: { pipeline: string; pr?: string; tasks: number };
};

const DEMO: DemoDroplet[] = [
  {
    id: "d1",
    title: "Multi-city flight search",
    kind: "feature",
    progress: 18,
    lane: 0,
    stage: "Feedback",
    customer: { status: "Received", message: "Thanks! We're reviewing your idea." },
    dev: { pipeline: "awaiting triage", tasks: 0 },
  },
  {
    id: "d2",
    title: "Dark mode on checkout",
    kind: "feature",
    progress: 42,
    lane: 1,
    stage: "Planned",
    customer: { status: "Planned", message: "On the roadmap — engineering tasks generated." },
    dev: { pipeline: "queued", tasks: 4 },
  },
  {
    id: "d3",
    title: "Payment timeout bug",
    kind: "bug",
    progress: 68,
    lane: 2,
    stage: "Building",
    customer: { status: "Building", message: "We're working on a fix — hang tight." },
    dev: { pipeline: "building", pr: "#47", tasks: 2 },
  },
  {
    id: "d4",
    title: "Export to CSV",
    kind: "feature",
    progress: 88,
    lane: 0,
    stage: "Review",
    customer: { status: "Building", message: "Almost there — final checks in progress." },
    dev: { pipeline: "in_review", pr: "#52", tasks: 3 },
  },
  {
    id: "d5",
    title: "Seat map zoom",
    kind: "feature",
    progress: 96,
    lane: 1,
    stage: "Shipped",
    customer: { status: "Shipped", message: "Live in production — thank you!" },
    dev: { pipeline: "shipped", pr: "#38", tasks: 5 },
  },
];

const STAGES = ["Feedback", "Triage", "Planned", "Build", "Shipped"];

export function FeedbackRiverShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const droplet = DEMO[active];

  const pick = useCallback((i: number) => {
    setActive(i);
    setPaused(true);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setActive((i) => (i + 1) % DEMO.length), 3200);
    return () => window.clearInterval(t);
  }, [paused]);

  return (
    <div
      className="river-showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="river-showcase-glow" aria-hidden />

      <div className="river-showcase-river" aria-label="Interactive feedback river demo">
        <svg className="river-showcase-svg" viewBox="0 0 900 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="riverShowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-landing-accent)" stopOpacity="0.04" />
              <stop offset="45%" stopColor="var(--color-landing-accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-landing-accent)" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <path
            d="M 0 50 C 140 15, 220 85, 340 48 S 560 12, 680 52 S 820 88, 900 45"
            fill="none"
            stroke="url(#riverShowGrad)"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <path
            className="river-showcase-dash"
            d="M 0 50 C 140 15, 220 85, 340 48 S 560 12, 680 52 S 820 88, 900 45"
            fill="none"
            stroke="var(--color-landing-accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="6 14"
          />
        </svg>

        <div className="river-showcase-stages">
          {STAGES.map((s, i) => (
            <span key={s} className={`river-showcase-stage ${i <= Math.floor(droplet.progress / 22) ? "lit" : ""}`}>
              <span className="river-showcase-stage-dot" />
              {s}
            </span>
          ))}
        </div>

        <div className="river-showcase-droplets">
          {DEMO.map((d, i) => (
            <button
              key={d.id}
              type="button"
              className={`river-showcase-droplet ${d.kind === "bug" ? "bug" : ""} ${i === active ? "active" : ""}`}
              style={{ left: `${d.progress}%`, top: `${14 + d.lane * 32}%` }}
              onClick={() => pick(i)}
              aria-pressed={i === active}
              title={d.title}
            >
              <span className="river-showcase-droplet-core" />
              <span className="river-showcase-droplet-label">{d.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="river-showcase-lens">
        <article className="river-lens river-lens-customer">
          <header>
            <span className="river-lens-badge customer">Customer lens</span>
            <p className="text-xs text-landing-muted">Widget · what users see</p>
          </header>
          <div key={`c-${active}`} className="jal-lens-swap river-widget-mock">
            <div className="river-widget-bar">
              <span className="h-2 w-2 rounded-full bg-[var(--color-landing-accent)]" />
              <span className="text-xs font-medium">Your feedback</span>
            </div>
            <p className="mt-3 text-base font-medium">{droplet.title}</p>
            <span className="river-status-pill">{droplet.customer.status}</span>
            <p className="mt-3 text-sm leading-relaxed text-landing-muted">{droplet.customer.message}</p>
          </div>
        </article>

        <div className="river-lens-bridge" aria-hidden>
          <div className="river-lens-stream" />
          <span key={droplet.stage} className="jal-lens-swap river-lens-bridge-label">
            {droplet.stage}
          </span>
        </div>

        <article className="river-lens river-lens-dev">
          <header>
            <span className="river-lens-badge dev">Ship lens</span>
            <p className="text-xs text-landing-muted">Studio · what you ship</p>
          </header>
          <div key={`d-${active}`} className="jal-lens-swap">
            <ul className="river-dev-meta">
              <li>
                <span>Pipeline</span>
                <strong>{droplet.dev.pipeline}</strong>
              </li>
              {droplet.dev.pr && (
                <li>
                  <span>Pull request</span>
                  <strong className="text-[var(--color-landing-accent)]">{droplet.dev.pr}</strong>
                </li>
              )}
              <li>
                <span>Tasks</span>
                <strong>{droplet.dev.tasks}</strong>
              </li>
            </ul>
            <p className="mt-4 font-mono text-[10px] text-landing-muted">
              {droplet.progress < 50
                ? "await api.studioEnqueue()"
                : droplet.progress < 80
                  ? "await api.studioBuild() → PR"
                  : "await api.studioApproveShip()"}
            </p>
          </div>
        </article>
      </div>

      <p className="river-showcase-hint">
        <span className="studio-flow-live" aria-hidden />
        {paused ? "Click any droplet · dual lens updates live" : "Auto-flowing demo · hover to pause"}
      </p>
    </div>
  );
}
