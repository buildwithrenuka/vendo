import { useMemo } from "react";
import type { DevQueueStatus, FeatureRequest, FeatureRequestStatus } from "@vendo/shared";
import { FEATURE_REQUEST_STATUS_LABELS } from "@vendo/shared";

const STAGES = [
  { id: "in", label: "Feedback", sub: "Customer" },
  { id: "triage", label: "AI Triage", sub: "Classify" },
  { id: "plan", label: "Planned", sub: "PRD" },
  { id: "build", label: "Build", sub: "Code + PR" },
  { id: "ship", label: "Shipped", sub: "Merged" },
] as const;

function flowProgress(status: FeatureRequestStatus, devQueue: DevQueueStatus | null | undefined): number {
  if (status === "shipped") return 100;
  if (devQueue === "shipped" || devQueue === "ready_for_approval") return 92;
  if (devQueue === "in_review" || devQueue === "fix_needed") return 78;
  if (devQueue === "building") return 65;
  if (devQueue === "queued" || status === "in_development") return 52;
  if (status === "planned") return 38;
  if (status === "ai_review") return 22;
  if (status === "declined" || status === "already_exists") return 12;
  return 8;
}

type Props = {
  items: FeatureRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function StudioFlowRiver({ items, selectedId, onSelect }: Props) {
  const droplets = useMemo(
    () =>
      items.map((item, i) => ({
        item,
        progress: flowProgress(item.status, item.devQueueStatus),
        lane: i % 3,
      })),
    [items],
  );

  return (
    <div className="studio-flow-river" aria-label="Live feedback river">
      <div className="studio-flow-river-bg" aria-hidden>
        <svg className="studio-flow-river-svg" viewBox="0 0 800 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="studioRiverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-landing-accent)" stopOpacity="0.05" />
              <stop offset="50%" stopColor="var(--color-landing-accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-landing-accent)" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            className="studio-flow-river-path"
            d="M 0 60 C 120 20, 200 100, 320 55 S 520 15, 640 60 S 720 95, 800 50"
            fill="none"
            stroke="url(#studioRiverGrad)"
            strokeWidth="28"
            strokeLinecap="round"
          />
          <path
            className="studio-flow-river-line"
            d="M 0 60 C 120 20, 200 100, 320 55 S 520 15, 640 60 S 720 95, 800 50"
            fill="none"
            stroke="var(--color-landing-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="8 12"
          />
        </svg>
      </div>

      <div className="studio-flow-stages">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="studio-flow-stage" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="studio-flow-stage-dot" />
            <span className="studio-flow-stage-label">{stage.label}</span>
            <span className="studio-flow-stage-sub">{stage.sub}</span>
          </div>
        ))}
      </div>

      <div className="studio-flow-droplets">
        {droplets.map(({ item, progress, lane }) => {
          const selected = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.title}
              onClick={() => onSelect(item.id)}
              className={`studio-droplet ${selected ? "selected" : ""} ${item.requestType === "bug" ? "bug" : ""}`}
              style={{
                left: `${Math.min(96, Math.max(2, progress))}%`,
                top: `${12 + lane * 28}%`,
              }}
            >
              <span className="studio-droplet-core" />
              <span className="studio-droplet-label">{item.title.slice(0, 28)}{item.title.length > 28 ? "…" : ""}</span>
              <span className="studio-droplet-status">{FEATURE_REQUEST_STATUS_LABELS[item.status]}</span>
            </button>
          );
        })}
        {items.length === 0 && (
          <p className="studio-flow-empty">Drop the widget in your app — feedback becomes droplets on this river</p>
        )}
      </div>

      <p className="studio-flow-tagline">
        <span className="studio-flow-live" /> Live river · click a droplet to ship it
      </p>
    </div>
  );
}

export { STAGES as STUDIO_FLOW_STAGES, flowProgress };
