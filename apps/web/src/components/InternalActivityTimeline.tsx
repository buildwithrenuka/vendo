import type { FeatureRequestActivity } from "@vendo/shared";

const EVENT_LABELS: Record<string, string> = {
  submitted: "Customer submitted",
  ai_triage: "AI triage",
  ai_clarification: "AI asked for context",
  clarification_reply: "Customer replied",
  enqueued: "Added to Jal",
  started_working: "Started working",
  pipeline_moved: "Pipeline updated",
  task_moved: "Task moved",
  pr_linked: "PR linked",
  ai_code_review: "AI code review",
  ai_build_started: "AI writing code",
  ai_build_complete: "AI opened PR",
  ai_build_failed: "AI build failed",
  github_pr_merged: "GitHub PR merged",
  github_merge_failed: "GitHub merge failed",
  ship_approved: "Shipped",
  ship_rejected: "Sent back for fixes",
  customer_notified: "Customer emailed",
  customer_notify_failed: "Customer email failed",
};

function actorLabel(entry: FeatureRequestActivity): string {
  if (entry.actorType === "ai") return "AI";
  if (entry.actorType === "customer") return entry.actorEmail ?? "Customer";
  if (entry.actorType === "employee") return entry.actorEmail ?? "Engineer";
  return "System";
}

type Props = {
  entries: FeatureRequestActivity[];
};

export function InternalActivityTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--color-ink-muted)]">No activity logged yet.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-[var(--color-border)] pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative pb-4 last:pb-0">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-copper)] ring-2 ring-[var(--color-surface)]" />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--color-ink)]">
              {EVENT_LABELS[entry.event] ?? entry.event}
            </span>
            <span className="text-[var(--color-ink-muted)]">· {actorLabel(entry)}</span>
            <span className="text-[var(--color-ink-muted)]">
              · {new Date(entry.createdAt).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink-muted)]">{entry.message}</p>
        </li>
      ))}
    </ol>
  );
}
