import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import type {
  DevFeatureDetail,
  DevQueueStatus,
  DevTaskStatus,
  FeatureRequest,
  FeatureRequestType,
  InternalDashboardStats,
  InternalInboxItem,
} from "@vendo/shared";
import {
  DEV_QUEUE_STATUS_LABELS,
  DEV_TASK_STATUS_LABELS,
  FEATURE_REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  JAL_PIPELINE,
} from "@vendo/shared";
import { JAL_NAME } from "../lib/jal-brand";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { FeatureRequestAssessmentCard } from "../components/FeatureRequestAssessmentCard";
import { InternalActivityTimeline } from "../components/InternalActivityTimeline";
import { EmployeeAdminPanel } from "../components/EmployeeAdminPanel";
import { Badge, Button, Card, Input, SectionHeader, Shell, Alert, Textarea } from "../components/ui";

const KANBAN: DevTaskStatus[] = ["backlog", "in_progress", "in_review", "done"];

type ViewTab = "pipeline" | "inbox" | "team";

export function VendoInternalPage() {
  const { user, loading, logout } = useAuth();
  const [isEmployee, setIsEmployee] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employeeUsername, setEmployeeUsername] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<ViewTab>("pipeline");
  const [typeFilter, setTypeFilter] = useState<FeatureRequestType | "all">("all");
  const [stats, setStats] = useState<InternalDashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<FeatureRequest[]>([]);
  const [inbox, setInbox] = useState<InternalInboxItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DevFeatureDetail | null>(null);
  const [githubRepo, setGithubRepo] = useState<string | null>(null);
  const [githubOk, setGithubOk] = useState(false);
  const [prNumber, setPrNumber] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStats = useCallback(async () => {
    const { stats: s } = await api.devStats();
    setStats(s);
  }, []);

  const loadPipeline = useCallback(async () => {
    const { items } = await api.devQueue();
    setPipeline(items);
  }, []);

  const loadInbox = useCallback(async () => {
    const { items } = await api.devInbox(typeFilter === "all" ? undefined : typeFilter);
    setInbox(items);
  }, [typeFilter]);

  const loadConfig = useCallback(async () => {
    const cfg = await api.devConfig();
    setGithubOk(cfg.githubConfigured);
    setGithubRepo(cfg.githubRepo);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const { feature } = await api.devFeature(id);
    setDetail(feature);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadStats(), loadPipeline(), loadInbox(), loadConfig()]);
  }, [loadStats, loadPipeline, loadInbox, loadConfig]);

  useEffect(() => {
    api.session().then((s) => {
      setIsEmployee(s.isDeveloper);
      setIsAdmin(s.isVendoAdmin);
      setEmployeeUsername(s.employeeUsername);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!isEmployee) return;
    refreshAll().catch(console.error);
  }, [isEmployee, refreshAll, typeFilter]);

  useEffect(() => {
    if (!selectedId || !isEmployee) return;
    loadDetail(selectedId).catch(console.error);
  }, [selectedId, isEmployee, loadDetail]);

  const filteredPipeline = useMemo(() => {
    if (typeFilter === "all") return pipeline;
    return pipeline.filter((i) => i.requestType === typeFilter);
  }, [pipeline, typeFilter]);

  const pipelineByStatus = useMemo(() => {
    const map: Record<DevQueueStatus, FeatureRequest[]> = {
      queued: [],
      building: [],
      in_review: [],
      fix_needed: [],
      ready_for_approval: [],
      shipped: [],
    };
    for (const item of filteredPipeline) {
      if (item.devQueueStatus) map[item.devQueueStatus].push(item);
    }
    return map;
  }, [filteredPipeline]);

  if (loading || !authChecked) return <Shell title="Loading…" />;
  if (!user) return <Navigate to="/internal/login" replace />;
  if (!isEmployee) {
    return <Navigate to="/internal/login" replace />;
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const selectItem = (id: string) => {
    setSelectedId(id);
    setView("pipeline");
  };

  return (
    <Shell
      title="Vendo Engineering"
      subtitle={employeeUsername ? `@${employeeUsername} · ${JAL_NAME}` : JAL_NAME}
      actions={
        <Button variant="ghost" onClick={() => logout()}>Sign out</Button>
      }
    >
      {message && <Alert tone="info">{message}</Alert>}

      {stats && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total requests", value: stats.total },
            { label: "Features", value: stats.features },
            { label: "Bugs", value: stats.bugs },
            { label: "In pipeline", value: stats.inPipeline },
            { label: "Awaiting ship", value: stats.awaitingApproval },
          ].map((s) => (
            <Card key={s.label} className="px-4 py-3">
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-[var(--color-border)] p-0.5">
          {(["pipeline", "inbox", ...(isAdmin ? (["team"] as const) : [])] as ViewTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setView(tab)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                view === tab ? "bg-[var(--color-copper)]/20 text-[var(--color-copper)]" : "text-[var(--color-ink-muted)]"
              }`}
            >
              {tab === "pipeline" ? `${JAL_NAME} pipeline` : tab === "inbox" ? "All customer requests" : "Team admin"}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border border-[var(--color-border)] p-0.5">
          {(["all", "feature", "bug"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                typeFilter === t ? "bg-white/10 text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"
              }`}
            >
              {t === "all" ? "All types" : REQUEST_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {!githubOk && (
        <div className="mb-4">
          <Alert tone="info">
            GitHub not configured — set GITHUB_TOKEN and GITHUB_REPO in apps/api/.dev.vars for PR review.
          </Alert>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          {view === "team" && isAdmin ? (
            <EmployeeAdminPanel />
          ) : view === "pipeline" ? (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[900px] gap-3">
                {JAL_PIPELINE.map((status) => (
                  <div key={status} className="w-44 shrink-0">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                      {DEV_QUEUE_STATUS_LABELS[status]}
                      <span className="ml-1 font-normal">({pipelineByStatus[status].length})</span>
                    </p>
                    <ul className="space-y-2">
                      {pipelineByStatus[status].map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => selectItem(item.id)}
                            className={`w-full rounded-xl border px-2.5 py-2 text-left text-xs transition ${
                              selectedId === item.id
                                ? "border-[var(--color-copper)]/40 bg-[var(--color-copper)]/10"
                                : "border-[var(--color-border)] hover:bg-white/5"
                            }`}
                          >
                            <Badge tone={item.requestType === "bug" ? "warning" : "neutral"} className="mb-1">
                              {REQUEST_TYPE_LABELS[item.requestType]}
                            </Badge>
                            <p className="font-medium leading-snug">{item.title}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <SectionHeader title="Customer inbox" description="Every feature request and bug report" />
              <ul className="divide-y divide-[var(--color-border)]">
                {inbox.length === 0 ? (
                  <li className="py-4 text-sm text-[var(--color-ink-muted)]">No requests yet.</li>
                ) : (
                  inbox.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectItem(item.id)}
                        className="flex w-full flex-wrap items-start justify-between gap-2 py-3 text-left hover:bg-white/[0.02]"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={item.requestType === "bug" ? "warning" : "neutral"}>
                              {REQUEST_TYPE_LABELS[item.requestType]}
                            </Badge>
                            <span className="font-medium">{item.title}</span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                            {item.buyerName ?? item.buyerEmail} · {new Date(item.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <Badge tone="neutral">{FEATURE_REQUEST_STATUS_LABELS[item.status]}</Badge>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {view !== "team" && detail ? (
            <>
              <Card>
                <SectionHeader
                  title={detail.title}
                  description={`${detail.buyerName ?? detail.buyerEmail ?? "Customer"} · ${REQUEST_TYPE_LABELS[detail.requestType]}`}
                />
                <div className="flex flex-wrap gap-2">
                  <Badge tone="neutral">{FEATURE_REQUEST_STATUS_LABELS[detail.status]}</Badge>
                  {detail.devQueueStatus && (
                    <Badge tone="success">{DEV_QUEUE_STATUS_LABELS[detail.devQueueStatus]}</Badge>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-ink-muted)]">{detail.description}</p>
                {detail.currentPain && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-[var(--color-ink)]">Pain: </span>
                    <span className="text-[var(--color-ink-muted)]">{detail.currentPain}</span>
                  </p>
                )}
                {detail.aiFeedback && (
                  <p className="mt-2 rounded-lg bg-white/5 p-2 text-sm text-[var(--color-ink-muted)]">{detail.aiFeedback}</p>
                )}
              </Card>

              {detail.devQueueStatus && (
                <Card>
                  <SectionHeader
                    title={`${JAL_NAME} actions`}
                    description="AI can write code + open GitHub PR automatically"
                  />
                  <div className="flex flex-wrap gap-2">
                    {detail.devQueueStatus === "queued" && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            const { feature } = await api.devStartWorking(detail.id);
                            setDetail(feature);
                            await refreshAll();
                            setMessage("Started working");
                          })
                        }
                      >
                        Start working
                      </Button>
                    )}
                    {["queued", "building"].includes(detail.devQueueStatus) && (
                      <Button
                        variant="secondary"
                        disabled={busy || !githubOk}
                        onClick={() =>
                          run(async () => {
                            setMessage("AI is reading repo, writing code, and opening PR… (30–90s)");
                            const { feature, build } = await api.devAiBuild(detail.id);
                            setDetail(feature);
                            await refreshAll();
                            setMessage(`PR #${build.prNumber} opened — ${build.summary}`);
                          })
                        }
                      >
                        Run AI builder → PR
                      </Button>
                    )}
                    {JAL_PIPELINE.filter((s) => s !== detail.devQueueStatus).map((next) => (
                      <Button
                        key={next}
                        variant="secondary"
                        disabled={busy}
                        className="text-xs"
                        onClick={() =>
                          run(async () => {
                            const { feature } = await api.devMovePipeline(detail.id, next);
                            setDetail(feature);
                            await refreshAll();
                          })
                        }
                      >
                        → {DEV_QUEUE_STATUS_LABELS[next]}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}

              {detail.status === "planned" && !detail.devQueueStatus && (
                <Card>
                  <SectionHeader title="Not in pipeline yet" />
                  <Button
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const { feature } = await api.devEnqueue(detail.id);
                        setDetail(feature);
                        await refreshAll();
                      })
                    }
                  >
                    Enqueue for engineering
                  </Button>
                </Card>
              )}

              {detail.aiAssessment && (
                <Card>
                  <SectionHeader title="AI product analysis" />
                  <FeatureRequestAssessmentCard assessment={detail.aiAssessment} />
                </Card>
              )}

              {detail.clarificationThread.length > 0 && (
                <Card>
                  <SectionHeader title="AI ↔ customer thread" />
                  <ul className="space-y-2 text-sm">
                    {detail.clarificationThread.map((m) => (
                      <li
                        key={m.createdAt + m.role}
                        className={`rounded-lg p-2 ${m.role === "assistant" ? "bg-[var(--color-copper)]/10" : "bg-white/5"}`}
                      >
                        <span className="text-xs font-semibold uppercase text-[var(--color-ink-muted)]">
                          {m.role === "assistant" ? "AI" : "Customer"}
                        </span>
                        <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card>
                <SectionHeader title="Activity log" description="Full audit trail" />
                <InternalActivityTimeline entries={detail.activityLog} />
              </Card>

              {detail.tasks.length > 0 && (
                <Card>
                  <SectionHeader title="AI Kanban tasks" />
                  <div className="grid gap-2">
                    {KANBAN.map((col) => (
                      <div key={col}>
                        <p className="mb-1 text-xs font-semibold text-[var(--color-ink-muted)]">
                          {DEV_TASK_STATUS_LABELS[col]}
                        </p>
                        <ul className="space-y-1">
                          {detail.tasks.filter((t) => t.status === col).map((task) => (
                            <li key={task.id} className="rounded border border-[var(--color-border)] p-2 text-xs">
                              <p className="font-medium">{task.title}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {KANBAN.filter((s) => s !== col).map((next) => (
                                  <button
                                    key={next}
                                    type="button"
                                    disabled={busy}
                                    className="rounded border px-1 py-0.5 text-[10px] hover:bg-white/10"
                                    onClick={() =>
                                      run(async () => {
                                        const { feature } = await api.devUpdateTask(task.id, next);
                                        setDetail(feature);
                                        await refreshAll();
                                      })
                                    }
                                  >
                                    → {DEV_TASK_STATUS_LABELS[next]}
                                  </button>
                                ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <SectionHeader title="GitHub PR" description={githubRepo ?? "Not configured"} />
                <div className="flex flex-wrap gap-2">
                  <Input
                    label="PR #"
                    type="number"
                    value={prNumber}
                    onChange={(e) => setPrNumber(e.target.value)}
                    className="max-w-[100px]"
                  />
                  <div className="flex items-end gap-2">
                    <Button
                      disabled={busy || !prNumber || !githubOk}
                      onClick={() =>
                        run(async () => {
                          const { feature } = await api.devLinkPr(detail.id, Number(prNumber));
                          setDetail(feature);
                          await refreshAll();
                        })
                      }
                    >
                      Link PR
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy || detail.pullRequests.length === 0}
                      onClick={() =>
                        run(async () => {
                          const { feature } = await api.devAiReview(detail.id);
                          setDetail(feature);
                          await refreshAll();
                        })
                      }
                    >
                      AI QA
                    </Button>
                  </div>
                </div>
                {detail.reviews.slice(0, 2).map((r) => (
                  <div key={r.id} className="mt-2 rounded border p-2 text-xs">
                    <Badge tone={r.verdict === "pass" ? "success" : "warning"}>{r.verdict}</Badge>
                    <p className="mt-1 text-[var(--color-ink-muted)]">{r.summary}</p>
                  </div>
                ))}
              </Card>

              <Card>
                <SectionHeader title="Human ship gate" />
                <Button
                  disabled={busy || detail.devQueueStatus === "shipped"}
                  onClick={() =>
                    run(async () => {
                      const res = await api.devApproveShip(detail.id);
                      setDetail(res.feature);
                      await refreshAll();
                      const parts: string[] = [];
                      if (res.githubPrMerged) {
                        parts.push(
                          res.githubMergeMessage ?? `GitHub PR merged${res.githubMergeSha ? ` (${res.githubMergeSha.slice(0, 7)})` : ""}.`,
                        );
                      } else if (res.githubMergeError) {
                        parts.push(res.githubMergeError);
                      }
                      if (res.customerEmailSent) {
                        parts.push("Customer notified by email.");
                      } else if (res.customerEmailError) {
                        parts.push(`Email failed: ${res.customerEmailError}`);
                      } else if (parts.length === 0) {
                        parts.push("Shipped — email skipped (no Resend key).");
                      } else {
                        parts.push("Shipped — email skipped (no Resend key).");
                      }
                      setMessage(parts.join(" "));
                    })
                  }
                >
                  Approve & ship
                </Button>
                <Textarea
                  label="Request fixes"
                  rows={2}
                  className="mt-2"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <Button
                  variant="secondary"
                  className="mt-2"
                  disabled={busy || rejectReason.length < 5}
                  onClick={() =>
                    run(async () => {
                      const { feature } = await api.devRejectShip(detail.id, rejectReason);
                      setDetail(feature);
                      setRejectReason("");
                      await refreshAll();
                    })
                  }
                >
                  Send back
                </Button>
              </Card>
            </>
          ) : view !== "team" ? (
            <Card>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Select a request from the pipeline or inbox to see AI analysis, logs, and actions.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

export { VendoInternalPage as DevQueuePage };
