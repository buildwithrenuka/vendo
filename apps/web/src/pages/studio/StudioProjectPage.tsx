import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DevFeatureDetail, DevQueueStatus, FeatureRequest, InternalDashboardStats } from "@vendo/shared";
import { DEV_QUEUE_STATUS_LABELS, JAL_PIPELINE, REQUEST_TYPE_LABELS } from "@vendo/shared";
import { api } from "../../lib/api";
import { StudioAuthGate } from "./StudioHomePage";
import { StudioFlowRiver } from "../../components/studio/StudioFlowRiver";
import { StudioDualLens } from "../../components/studio/StudioDualLens";
import { FeatureRequestAssessmentCard } from "../../components/FeatureRequestAssessmentCard";
import { InternalActivityTimeline } from "../../components/InternalActivityTimeline";
import {
  GitHubIcon,
  StudioBadge,
  StudioMain,
  StudioPageHeader,
  StudioShell,
  StudioStat,
} from "../../components/studio/StudioUI";

export function StudioProjectPage() {
  const { projectId = "" } = useParams();
  const [project, setProject] = useState<{ name: string; githubRepo: string } | null>(null);
  const [stats, setStats] = useState<InternalDashboardStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DevFeatureDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [inbox, setInbox] = useState<FeatureRequest[]>([]);

  const refresh = useCallback(async () => {
    const [{ project: p }, { stats: s }, { items }] = await Promise.all([
      api.studioGetProject(projectId),
      api.studioStats(projectId),
      api.studioInbox(projectId),
    ]);
    setProject({ name: p.name, githubRepo: p.githubRepo });
    setStats(s);
    setInbox(items);
    return items;
  }, [projectId]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    api.studioFeature(projectId, selectedId).then(({ feature }) => setDetail(feature)).catch(console.error);
  }, [projectId, selectedId]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage(label);
      await refresh();
      if (selectedId) {
        const { feature } = await api.studioFeature(projectId, selectedId);
        setDetail(feature);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioAuthGate>
      <StudioShell>
        <StudioMain wide>
          <StudioPageHeader
            eyebrow="Live river"
            title={project?.name ?? "Loading…"}
            subtitle="Click droplets to move feedback downstream — customer lens on the left, ship console on the right."
            back={
              <Link to="/studio" className="text-sm text-landing-muted transition hover:text-[var(--color-landing-accent)]">
                ← Command center
              </Link>
            }
            action={
              project?.githubRepo && (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-landing-border)] bg-[var(--color-landing-elevated)] px-3 py-1.5 font-mono text-xs text-[var(--color-landing-accent)]">
                    <GitHubIcon className="h-3.5 w-3.5" />
                    {project.githubRepo}
                  </span>
                  <Link to={`/studio/projects/${projectId}/embed`} className="btn-secondary rounded-xl px-4 py-2 text-sm font-semibold">
                    Widget
                  </Link>
                </div>
              )
            }
          />

          {stats && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StudioStat label="Droplets" value={stats.total} />
              <StudioStat label="Features" value={stats.features} />
              <StudioStat label="Bugs" value={stats.bugs} />
              <StudioStat label="Flowing" value={stats.inPipeline} accent />
              <StudioStat label="Ready" value={stats.awaitingApproval} accent />
            </div>
          )}

          <StudioFlowRiver
            items={inbox}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {message && (
            <div className="mb-6 rounded-xl border border-[var(--color-landing-accent)]/30 bg-[var(--color-landing-accent-soft)] px-4 py-3 text-sm font-medium">
              {message}
            </div>
          )}

          <StudioDualLens detail={detail} />

          {detail && (
            <div className="studio-ship-console mt-6 animate-fade-up">
              <p className="studio-ship-console-title">Ship console · {detail.title}</p>

              <div className="mb-4 flex flex-wrap gap-2">
                <StudioBadge tone={detail.requestType === "bug" ? "warning" : "accent"}>
                  {REQUEST_TYPE_LABELS[detail.requestType ?? "feature"]}
                </StudioBadge>
                {detail.devQueueStatus && (
                  <StudioBadge tone="neutral">{DEV_QUEUE_STATUS_LABELS[detail.devQueueStatus]}</StudioBadge>
                )}
              </div>

              {detail.aiAssessment && (
                <div className="mb-4">
                  <FeatureRequestAssessmentCard assessment={detail.aiAssessment} />
                </div>
              )}

              <div className="studio-action-grid mb-4">
                <button type="button" disabled={busy} className="btn-secondary rounded-lg py-2.5 text-xs font-bold" onClick={() => run("Enqueued", async () => { await api.studioEnqueue(projectId, detail.id); })}>
                  Enqueue
                </button>
                <button type="button" disabled={busy} className="btn-primary rounded-lg py-2.5 text-xs font-bold" onClick={() => run("AI build complete", async () => { await api.studioBuild(projectId, detail.id); })}>
                  AI Build → PR
                </button>
                <button type="button" disabled={busy} className="btn-secondary rounded-lg py-2.5 text-xs font-bold" onClick={() => run("AI review done", async () => { await api.studioAiReview(projectId, detail.id); })}>
                  AI Review
                </button>
                <button type="button" disabled={busy} className="btn-primary rounded-lg py-2.5 text-xs font-bold" onClick={() => run("Shipped downstream!", async () => { await api.studioApproveShip(projectId, detail.id); })}>
                  Merge & ship
                </button>
              </div>

              {detail.pullRequests[0] && (
                <a href={detail.pullRequests[0].prUrl} target="_blank" rel="noreferrer" className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--color-landing-border)] bg-[var(--color-landing-elevated)] px-4 py-2.5 text-sm font-bold text-[var(--color-landing-accent)] hover:border-[var(--color-landing-accent)]">
                  <GitHubIcon className="h-4 w-4" />
                  Open PR #{detail.pullRequests[0].prNumber}
                </a>
              )}

              <div className="studio-pipeline-rail mb-4">
                {JAL_PIPELINE.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy || !detail.devQueueStatus}
                    onClick={() => run(`Moved to ${DEV_QUEUE_STATUS_LABELS[s]}`, async () => { await api.studioMovePipeline(projectId, detail.id, s as DevQueueStatus); })}
                    className={`studio-pipeline-chip ${detail.devQueueStatus === s ? "active" : ""}`}
                  >
                    {DEV_QUEUE_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              <InternalActivityTimeline entries={detail.activityLog} />
            </div>
          )}
        </StudioMain>
      </StudioShell>
    </StudioAuthGate>
  );
}
