import type { FeatureRequestAssessment, FeatureRequestPrdOutline } from "@vendo/shared";
import { Badge } from "./ui";

const FIT_LABELS: Record<FeatureRequestAssessment["businessFit"], string> = {
  strong: "Strong fit",
  moderate: "Moderate fit",
  weak: "Weak fit",
  out_of_scope: "Out of scope",
};

const FIT_TONE: Record<FeatureRequestAssessment["businessFit"], "success" | "neutral" | "warning"> = {
  strong: "success",
  moderate: "neutral",
  weak: "warning",
  out_of_scope: "warning",
};

function PrdOutline({ outline }: { outline: FeatureRequestPrdOutline }) {
  return (
    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-black/20 p-4 text-sm">
      <p className="app-kicker">Requirements snapshot</p>
      <p className="mt-2 font-medium text-[var(--color-ink)]">{outline.problemStatement}</p>

      {outline.goals.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Goals</p>
          <ul className="mt-1 list-inside list-disc text-[var(--color-ink-muted)]">
            {outline.goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {outline.userStories.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">User stories</p>
          <ul className="mt-1 space-y-1 text-[var(--color-ink-muted)]">
            {outline.userStories.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {outline.acceptanceCriteria.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Acceptance criteria</p>
          <ul className="mt-1 list-inside list-disc text-[var(--color-ink-muted)]">
            {outline.acceptanceCriteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function FeatureRequestAssessmentCard({
  assessment,
}: {
  assessment: FeatureRequestAssessment;
}) {
  return (
    <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">AI product review</p>
        <Badge tone={FIT_TONE[assessment.businessFit]}>{FIT_LABELS[assessment.businessFit]}</Badge>
        {assessment.targetUser !== "unknown" && (
          <Badge tone="neutral">For: {assessment.targetUser}</Badge>
        )}
      </div>

      <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{assessment.verdict}</p>

      {assessment.reasoning.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {assessment.reasoning.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
        <span className="font-semibold text-[var(--color-ink)]">Next step:</span> {assessment.suggestedNextStep}
      </p>

      {assessment.prdOutline && <PrdOutline outline={assessment.prdOutline} />}
    </div>
  );
}
