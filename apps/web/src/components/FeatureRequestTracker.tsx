import { useEffect, useState } from "react";
import type { FeatureRequest, FeatureRequestStatus } from "@vendo/shared";
import {
  FEATURE_REQUEST_STATUS_DESCRIPTIONS,
  FEATURE_REQUEST_STATUS_LABELS,
} from "@vendo/shared";
import { REQUEST_TYPE_LABELS } from "@vendo/shared";
import { FeatureRequestAssessmentCard } from "./FeatureRequestAssessmentCard";
import { Badge, Button, Card, Input, SectionHeader, Textarea } from "./ui";

const DISCOVERY_STEPS: FeatureRequestStatus[] = [
  "received",
  "ai_review",
  "planned",
  "in_development",
  "shipped",
];

const TERMINAL_STATUSES: FeatureRequestStatus[] = ["declined", "already_exists", "shipped"];

function statusTone(status: FeatureRequestStatus): "neutral" | "success" | "warning" {
  if (status === "shipped" || status === "already_exists") return "success";
  if (status === "declined" || status === "ai_review") return "warning";
  return "neutral";
}

function DiscoveryPipeline({ current }: { current: FeatureRequestStatus }) {
  if (TERMINAL_STATUSES.includes(current) && current !== "shipped") {
    return (
      <p className="text-xs text-[var(--color-ink-muted)]">
        {FEATURE_REQUEST_STATUS_LABELS[current]} — {FEATURE_REQUEST_STATUS_DESCRIPTIONS[current]}
      </p>
    );
  }

  const labels: Record<string, string> = {
    received: "Request",
    ai_review: "AI review",
    planned: "Planned",
    in_development: "Building",
    shipped: "Shipped",
  };

  const activeIndex = DISCOVERY_STEPS.indexOf(current);

  return (
    <ol className="flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-wide">
      {DISCOVERY_STEPS.map((step, i) => {
        const done = i <= activeIndex || current === "shipped";
        const active = step === current || (current === "shipped" && step === "shipped");
        return (
          <li
            key={step}
            className={`rounded-full px-2 py-0.5 ${
              active
                ? "bg-[var(--color-copper)]/20 text-[var(--color-copper)] ring-1 ring-[var(--color-copper)]/30"
                : done
                  ? "bg-white/10 text-[var(--color-ink)]"
                  : "bg-white/5 text-[var(--color-ink-muted)]"
            }`}
            title={FEATURE_REQUEST_STATUS_DESCRIPTIONS[step]}
          >
            {labels[step] ?? step}
          </li>
        );
      })}
    </ol>
  );
}

type SubmitPayload = {
  title: string;
  description: string;
  requestType: "feature" | "bug";
  targetUser?: "buyer" | "supplier" | "both" | "unknown";
  currentPain?: string;
};

type Props = {
  requests: FeatureRequest[];
  onSubmit: (data: SubmitPayload) => Promise<void>;
  onClarify: (id: string, reply: string) => Promise<void>;
  submitting?: boolean;
  initialDraft?: SubmitPayload | null;
};

export function FeatureRequestTracker({ requests, onSubmit, onClarify, submitting, initialDraft }: Props) {
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [description, setDescription] = useState(initialDraft?.description ?? "");
  const [requestType, setRequestType] = useState<"feature" | "bug">(initialDraft?.requestType ?? "feature");
  const [targetUser, setTargetUser] = useState<SubmitPayload["targetUser"]>(initialDraft?.targetUser ?? "buyer");
  const [currentPain, setCurrentPain] = useState(initialDraft?.currentPain ?? "");
  const [showForm, setShowForm] = useState(requests.length === 0 || Boolean(initialDraft));
  const [clarifyReplies, setClarifyReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialDraft) return;
    setTitle(initialDraft.title);
    setDescription(initialDraft.description);
    setRequestType(initialDraft.requestType);
    if (initialDraft.targetUser) setTargetUser(initialDraft.targetUser);
    setCurrentPain(initialDraft.currentPain ?? "");
    setShowForm(true);
  }, [initialDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      requestType,
      targetUser,
      currentPain: currentPain.trim() || undefined,
    });
    setTitle("");
    setDescription("");
    setCurrentPain("");
    setRequestType("feature");
    setTargetUser("buyer");
    setShowForm(false);
  };

  return (
    <div id="feature-requests" className="space-y-5">
      <div>
        <SectionHeader
          title="Feedback"
          description="Submit a feature idea or report a bug — AI reviews fit, asks clarifying questions, and tracks delivery."
        />
      </div>

      {!showForm ? (
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          New feedback
        </Button>
      ) : (
        <Card>
          <SectionHeader
            title="Tell us what you need"
            description="Share business context — AI will decide if it fits Vendo, if we already have it, or what to clarify."
          />
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">Type</span>
              <select
                className="app-field w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as "feature" | "bug")}
              >
                <option value="feature">Feature request</option>
                <option value="bug">Bug report</option>
              </select>
            </label>
            <Input
              label={requestType === "bug" ? "Bug summary" : "Feature title"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bulk invite suppliers via CSV"
              required
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">Who will use this?</span>
              <select
                className="app-field w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value as SubmitPayload["targetUser"])}
              >
                <option value="buyer">Buyer (procurement team)</option>
                <option value="supplier">Supplier</option>
                <option value="both">Both</option>
                <option value="unknown">Not sure</option>
              </select>
            </label>
            <Textarea
              label={requestType === "bug" ? "Steps to reproduce / what happened" : "What should it do?"}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the outcome you want and why it matters for onboarding suppliers"
              required
            />
            <Textarea
              label="Current pain (optional)"
              rows={2}
              value={currentPain}
              onChange={(e) => setCurrentPain(e.target.value)}
              placeholder="How do you handle this today? What's broken or slow?"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting || title.length < 3 || description.length < 10}>
                {submitting ? "AI is reviewing…" : "Submit for AI review"}
              </Button>
              {requests.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {requests.length > 0 && (
        <Card>
          <SectionHeader title="Your requests" description={`${requests.length} in the pipeline`} />
          <ul className="space-y-4">
            {requests.map((req) => (
              <li key={req.id} className="app-list-item">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{req.title}</p>
                      <Badge tone={req.requestType === "bug" ? "warning" : "neutral"}>
                        {REQUEST_TYPE_LABELS[req.requestType ?? "feature"]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge tone={statusTone(req.status)}>
                    {FEATURE_REQUEST_STATUS_LABELS[req.status]}
                  </Badge>
                </div>

                <div className="mt-3">
                  <DiscoveryPipeline current={req.status} />
                </div>

                {req.aiFeedback && (
                  <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{req.aiFeedback}</p>
                )}

                {req.aiAssessment && (
                  <FeatureRequestAssessmentCard assessment={req.aiAssessment} />
                )}

                {req.devQueueStatus && (
                  <p className="mt-2 text-xs text-cyan-300">
                    Dev queue: {req.devQueueStatus.replace(/_/g, " ")} — engineering in progress
                  </p>
                )}

                {req.declineReason && (
                  <p className="mt-2 text-xs font-medium text-amber-300/90">
                    Reason: {req.declineReason}
                  </p>
                )}

                {req.existingFeatureUrl && (
                  <a
                    href={req.existingFeatureUrl}
                    className="mt-2 inline-block text-sm font-semibold text-[var(--color-copper)] hover:underline"
                  >
                    View existing feature →
                  </a>
                )}

                {req.status === "ai_review" && (
                  <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                      AI needs more context
                    </p>
                    {req.clarificationThread
                      .filter((m) => m.role === "assistant")
                      .slice(-1)
                      .map((m) => (
                        <p key={m.createdAt} className="whitespace-pre-wrap text-sm text-[var(--color-ink)]">
                          {m.content}
                        </p>
                      ))}
                    <Textarea
                      label="Your reply"
                      rows={2}
                      value={clarifyReplies[req.id] ?? ""}
                      onChange={(e) =>
                        setClarifyReplies((prev) => ({ ...prev, [req.id]: e.target.value }))
                      }
                      placeholder="Answer in business terms — who, problem, success metric…"
                    />
                    <Button
                      variant="secondary"
                      className="text-xs"
                      disabled={(clarifyReplies[req.id]?.length ?? 0) < 5}
                      onClick={async () => {
                        const reply = clarifyReplies[req.id] ?? "";
                        await onClarify(req.id, reply);
                        setClarifyReplies((prev) => ({ ...prev, [req.id]: "" }));
                      }}
                    >
                      Send & re-run AI review
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
