import type { DevFeatureDetail } from "@vendo/shared";
import { FEATURE_REQUEST_STATUS_LABELS } from "@vendo/shared";

type Props = {
  detail: DevFeatureDetail | null;
};

/** Split view: what the customer sees vs what you ship */
export function StudioDualLens({ detail }: Props) {
  return (
    <div className="studio-dual-lens">
      <div className="studio-lens studio-lens-customer">
        <div className="studio-lens-header">
          <span className="studio-lens-badge customer">Customer lens</span>
          <p className="text-xs text-landing-muted">What they see in the widget</p>
        </div>
        <div className="studio-lens-body">
          {detail ? (
            <>
              <div className="studio-widget-mock">
                <div className="studio-widget-mock-bar">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-landing-accent)]" />
                  <span className="text-[10px] font-bold">Feedback</span>
                </div>
                <p className="mt-3 text-sm font-semibold">{detail.title}</p>
                <div className="mt-3 flex gap-1">
                  {["Received", "AI Review", "Planned", "Building", "Shipped"].map((s) => {
                    const active = FEATURE_REQUEST_STATUS_LABELS[detail.status] === s
                      || (detail.status === "in_development" && s === "Building")
                      || (detail.status === "ai_review" && s === "AI Review");
                    return (
                      <span
                        key={s}
                        className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${active ? "bg-[var(--color-landing-accent-soft)] text-[var(--color-landing-accent)]" : "opacity-30"}`}
                      >
                        {s.split(" ")[0]}
                      </span>
                    );
                  })}
                </div>
                {detail.aiFeedback && (
                  <p className="mt-3 rounded-lg bg-[var(--color-landing-elevated)] p-2 text-[11px] leading-relaxed text-landing-muted">
                    {detail.aiFeedback.slice(0, 120)}…
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-xs text-landing-muted">Select a droplet on the river</p>
          )}
        </div>
      </div>

      <div className="studio-lens-divider" aria-hidden>
        <div className="studio-lens-stream" />
      </div>

      <div className="studio-lens studio-lens-dev">
        <div className="studio-lens-header">
          <span className="studio-lens-badge dev">Ship lens</span>
          <p className="text-xs text-landing-muted">Your dev console</p>
        </div>
        <div className="studio-lens-body studio-lens-body-dev">
          {detail ? (
            <ul className="space-y-2 text-xs">
              <li className="flex justify-between gap-2 border-b border-[var(--color-landing-border)] pb-2">
                <span className="text-landing-muted">Status</span>
                <span className="font-bold text-[var(--color-landing-accent)]">
                  {FEATURE_REQUEST_STATUS_LABELS[detail.status]}
                </span>
              </li>
              {detail.devQueueStatus && (
                <li className="flex justify-between gap-2 border-b border-[var(--color-landing-border)] pb-2">
                  <span className="text-landing-muted">Pipeline</span>
                  <span className="font-mono font-bold">{detail.devQueueStatus.replace(/_/g, " ")}</span>
                </li>
              )}
              {detail.pullRequests[0] && (
                <li className="flex justify-between gap-2">
                  <span className="text-landing-muted">PR</span>
                  <a href={detail.pullRequests[0].prUrl} target="_blank" rel="noreferrer" className="font-mono font-bold text-[var(--color-landing-accent)] hover:underline">
                    #{detail.pullRequests[0].prNumber}
                  </a>
                </li>
              )}
              <li className="pt-2 text-landing-muted">
                {detail.tasks.length} tasks · {detail.activityLog.length} events
              </li>
            </ul>
          ) : (
            <p className="py-8 text-center text-xs text-landing-muted">Actions appear when a request is selected</p>
          )}
        </div>
      </div>
    </div>
  );
}
