import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { FormSchemaPayload } from "@vendo/forms";
import { SUPPLIER_STARTER_FIELDS } from "@vendo/forms";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { OnboardingFormBuilder } from "../components/forms/OnboardingFormBuilder";
import { InviteShareActions } from "../components/InviteShareActions";
import { supplierInviteWhatsAppUrl } from "../lib/whatsapp";
import { FeatureRequestTracker } from "../components/FeatureRequestTracker";
import { SubmissionReviewCard, SupplierStatusBadge, ScorecardBadge } from "../components/SupplierReview";
import { GstReconciliationPanel } from "../components/GstReconciliationPanel";
import {
  Badge,
  Button,
  Card,
  DashboardTabs,
  Input,
  Shell,
  StatCard,
  SectionHeader,
  SubTabs,
  Alert,
  Textarea,
} from "../components/ui";
import type { FeatureRequest, GstInvoice } from "@vendo/shared";
import { STANDARD_TIER_MAX_SUPPLIERS } from "@vendo/shared";
import { clearJudgeTryDraft, loadJudgeTryDraft, type JudgeTryDraft } from "../lib/judge-try";

type DashboardTab = "overview" | "suppliers" | "setup" | "feedback";
type SetupSection = "form" | "rules" | "gst";

type InviteRow = {
  id: string;
  email: string;
  phone?: string | null;
  expires_at?: string;
  accepted_at?: string | null;
};

type ShareState = {
  inviteUrl: string;
  expiresAt: string;
  phone?: string | null;
  supplierEmail?: string;
  emailSent?: boolean;
};

type SupplierRow = {
  inviteId: string;
  email: string;
  phone?: string | null;
  invitedAt: string;
  acceptedAt?: string | null;
  supplierName?: string | null;
  submissionId?: string | null;
  status: string;
  submittedAt?: string | null;
  scorecard?: {
    rating: "green" | "yellow" | "red";
    approvedCount: number;
    rejectedCount: number;
    autoApprovedCount: number;
  } | null;
};

type QueueItem = {
  id: string;
  supplier_name?: string;
  supplier_email?: string;
  status?: string;
  submitted_at?: string;
  data?: Record<string, unknown>;
  ruleResults?: Array<{ rule?: string; passed?: boolean; message?: string }> | null;
};

export function BuyerDashboard() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [setupSection, setSetupSection] = useState<SetupSection>("form");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [rulesText, setRulesText] = useState("");
  const [structuredRules, setStructuredRules] = useState<Array<Record<string, unknown>>>([]);
  const [showRulesJson, setShowRulesJson] = useState(false);
  const [formSchema, setFormSchema] = useState<FormSchemaPayload>({
    title: "Supplier Onboarding",
    description: "",
    fields: SUPPLIER_STARTER_FIELDS,
  });
  const [formVersion, setFormVersion] = useState<number | null>(null);
  const [formPublishedAt, setFormPublishedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "info">("success");
  const [latestShare, setLatestShare] = useState<ShareState | null>(null);
  const [shareByInviteId, setShareByInviteId] = useState<Record<string, ShareState>>({});
  const [loadingShareId, setLoadingShareId] = useState<string | null>(null);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [submittingFeature, setSubmittingFeature] = useState(false);
  const [judgeDraft, setJudgeDraft] = useState<JudgeTryDraft | null>(null);
  const [gstInvoices, setGstInvoices] = useState<GstInvoice[]>([]);

  const buyerName = user?.companyName ?? user?.name ?? "Your company";
  const isEnterprise = user?.pricingTier === "enterprise";
  const atSupplierLimit = !isEnterprise && invites.length >= STANDARD_TIER_MAX_SUPPLIERS;
  const verified = user?.buyerVerificationStatus === "approved";

  const refresh = async () => {
    const [inv, supplierList, review, rules, form, features] = await Promise.all([
      api.listInvites(),
      api.listSuppliers(),
      api.getReviewQueue(),
      api.getRules(),
      api.getOnboardingForm(),
      api.listFeatureRequests(),
    ]);
    setInvites(inv.invites as InviteRow[]);
    setSuppliers(supplierList.suppliers);
    setQueue(review.queue as QueueItem[]);
    if (rules.ruleset && typeof rules.ruleset === "object" && rules.ruleset !== null) {
      const rs = rules.ruleset as { naturalLanguage?: string; structuredRules?: Array<Record<string, unknown>> };
      setRulesText(rs.naturalLanguage ?? "");
      setStructuredRules(rs.structuredRules ?? []);
    }
    const schema = form.template?.schema ?? form.defaultSchema;
    setFormSchema(schema);
    setFormVersion(form.template?.version ?? null);
    setFormPublishedAt(form.template?.publishedAt ?? null);
    setFeatureRequests(features.requests);

    if (user?.pricingTier === "enterprise") {
      try {
        const gst = await api.listGstInvoices();
        setGstInvoices(gst.invoices);
      } catch {
        setGstInvoices([]);
      }
    }
  };

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  useEffect(() => {
    if (searchParams.get("tab") === "feedback") {
      setTab("feedback");
    }
    const draft = loadJudgeTryDraft();
    if (draft?.path === "vendo") {
      setJudgeDraft(draft);
      setTab("feedback");
      clearJudgeTryDraft();
    }
  }, [searchParams]);

  const sendInvite = async () => {
    setMessage(null);
    setLatestShare(null);
    try {
      const result = await api.createInvite({
        email: inviteEmail,
        phone: invitePhone.trim() || undefined,
      });
      const sentEmail = inviteEmail;
      const sentPhone = invitePhone.trim() || result.phone;
      setInviteEmail("");
      setInvitePhone("");
      const share = {
        inviteUrl: result.inviteUrl,
        expiresAt: result.expiresAt,
        phone: result.phone,
        supplierEmail: sentEmail,
        emailSent: result.emailSent,
      };
      setLatestShare(share);
      setMessage(
        result.emailSent
          ? "Invite emailed. You can also share on WhatsApp below."
          : result.emailError
            ? `Invite created, but email failed: ${result.emailError}`
            : "Invite created — share via WhatsApp or copy the link below.",
      );
      setMessageTone(result.emailSent ? "success" : "info");
      if (sentPhone) {
        window.open(
          supplierInviteWhatsAppUrl(
            { buyerName, inviteUrl: result.inviteUrl, expiresAt: result.expiresAt, supplierEmail: sentEmail },
            sentPhone,
          ),
          "_blank",
          "noopener,noreferrer",
        );
      }
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Invite failed");
      setMessageTone("info");
    }
  };

  const loadShareLink = async (invite: InviteRow) => {
    setLoadingShareId(invite.id);
    try {
      const result = await api.refreshInviteShareLink(invite.id);
      const share: ShareState = {
        inviteUrl: result.inviteUrl,
        expiresAt: result.expiresAt,
        phone: result.phone ?? invite.phone,
      };
      setShareByInviteId((prev) => ({ ...prev, [invite.id]: share }));
    } finally {
      setLoadingShareId(null);
    }
  };

  const dashboardTabs = [
    { id: "overview", label: "Overview", badge: queue.length },
    { id: "suppliers", label: "Suppliers", badge: suppliers.length },
    { id: "setup", label: "Setup" },
    { id: "feedback", label: "Feedback", badge: featureRequests.length },
  ];

  const setupTabs = [
    { id: "form", label: "Form" },
    { id: "rules", label: "Auto-approval" },
    { id: "gst", label: isEnterprise ? "GST" : "GST · Enterprise" },
  ];

  return (
    <Shell
      title={user?.companyName ?? "Workspace"}
      subtitle={user?.email ?? undefined}
      actions={
        <>
          <Badge tone={verified ? "success" : "warning"}>
            {verified ? "Verified" : "Pending"}
          </Badge>
          <Button variant="ghost" onClick={() => logout()}>Sign out</Button>
        </>
      }
    >
      <DashboardTabs tabs={dashboardTabs} active={tab} onChange={(id) => setTab(id as DashboardTab)} />

      {message && <Alert tone={messageTone}>{message}</Alert>}

      {tab === "overview" && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Suppliers" value={suppliers.length} />
            <StatCard
              label="Pending review"
              value={queue.length}
              highlight={queue.length > 0}
            />
            <StatCard
              label="Form"
              value={formVersion ? `v${formVersion}` : "Default"}
            />
          </div>

          {verified && suppliers.length === 0 && (
            <div className="app-callout mb-6">
              <p className="text-sm text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">Getting started:</span>{" "}
                invite a supplier below, then review their submission when it arrives.
                Customize your form anytime under{" "}
                <button type="button" className="text-[var(--color-copper)] underline underline-offset-2" onClick={() => { setTab("setup"); setSetupSection("form"); }}>
                  Setup → Form
                </button>.
              </p>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card id="invites">
              <SectionHeader title="Invite a supplier" />
              <div className="space-y-3">
                <Input
                  label="Email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="supplier@company.com"
                />
                <Input
                  label="WhatsApp (optional)"
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="9876543210"
                />
              </div>
              <Button
                className="mt-4"
                disabled={!verified || !inviteEmail || atSupplierLimit}
                onClick={sendInvite}
              >
                Send invite
              </Button>
              {!verified && (
                <p className="mt-2 text-xs text-[var(--color-ink-muted)]">Complete verification to send invites.</p>
              )}
              {atSupplierLimit && (
                <p className="mt-2 text-xs text-amber-300">
                  Standard plan limit ({STANDARD_TIER_MAX_SUPPLIERS} suppliers). Upgrade for unlimited.
                </p>
              )}

              {latestShare && (
                <div className="app-highlight-box mt-4">
                  <p className="text-sm font-medium">Invite ready</p>
                  <InviteShareActions
                    showUrl
                    emailSent={latestShare.emailSent}
                    share={{
                      buyerName,
                      inviteUrl: latestShare.inviteUrl,
                      expiresAt: latestShare.expiresAt,
                      supplierEmail: latestShare.supplierEmail,
                    }}
                    phone={latestShare.phone}
                  />
                </div>
              )}
            </Card>

            <Card>
              <SectionHeader
                title="Review queue"
                description={queue.length ? `${queue.length} waiting for you` : undefined}
              />
              {queue.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-muted)]">Nothing to review right now.</p>
              ) : (
                <ul className="space-y-4">
                  {queue.map((item) => (
                    <SubmissionReviewCard
                      key={item.id}
                      item={item}
                      formSchema={formSchema}
                      onApprove={async () => {
                        const result = await api.reviewSubmission(item.id, "approve");
                        setMessage(
                          result.emailSent
                            ? "Supplier approved — confirmation email sent."
                            : result.emailError
                              ? `Supplier approved, but email failed: ${result.emailError}`
                              : "Supplier approved.",
                        );
                        setMessageTone(result.emailSent ? "success" : "info");
                        await refresh();
                      }}
                      onReject={async () => {
                        const result = await api.reviewSubmission(item.id, "reject");
                        setMessage(
                          result.emailSent
                            ? "Submission rejected — supplier notified by email."
                            : result.emailError
                              ? `Rejected, but email failed: ${result.emailError}`
                              : "Submission rejected.",
                        );
                        setMessageTone(result.emailSent ? "success" : "info");
                        await refresh();
                      }}
                    />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      {tab === "suppliers" && (
        <div className="space-y-5">
          <Card>
            <SectionHeader title="All suppliers" description="Track onboarding from invite to approval." />
            {suppliers.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">
                No suppliers yet.{" "}
                <button type="button" className="text-[var(--color-copper)] underline underline-offset-2" onClick={() => setTab("overview")}>
                  Send your first invite
                </button>
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {suppliers.map((s) => (
                  <li key={s.inviteId} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium">{s.supplierName ?? s.email}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {s.email}
                        {s.acceptedAt ? ` · joined ${new Date(s.acceptedAt).toLocaleDateString()}` : " · not joined yet"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <SupplierStatusBadge status={s.status} />
                      {s.scorecard && <ScorecardBadge rating={s.scorecard.rating} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {invites.length > 0 && (
            <Card>
              <SectionHeader title="Invites" description="Pending and accepted invitations." />
              <ul className="space-y-3 text-sm">
                {invites.map((inv) => {
                  const share = shareByInviteId[inv.id];
                  const pending = !inv.accepted_at;

                  return (
                    <li key={inv.id} className="app-list-item">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{inv.email}</p>
                          {inv.phone && (
                            <p className="text-xs text-[var(--color-ink-muted)]">WhatsApp: {inv.phone}</p>
                          )}
                        </div>
                        <Badge tone={inv.accepted_at ? "success" : "neutral"}>
                          {inv.accepted_at ? "Accepted" : "Pending"}
                        </Badge>
                      </div>

                      {pending && (
                        <div className="mt-3">
                          {!share ? (
                            <Button
                              variant="secondary"
                              className="text-xs"
                              disabled={loadingShareId === inv.id}
                              onClick={() => loadShareLink(inv)}
                            >
                              {loadingShareId === inv.id ? "Loading…" : "Get share link"}
                            </Button>
                          ) : (
                            <InviteShareActions
                              compact
                              showUrl
                              share={{
                                buyerName,
                                inviteUrl: share.inviteUrl,
                                expiresAt: share.expiresAt,
                                supplierEmail: inv.email,
                              }}
                              phone={share.phone}
                            />
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === "setup" && (
        <>
          <SubTabs
            tabs={setupTabs}
            active={setupSection}
            onChange={(id) => setSetupSection(id as SetupSection)}
          />

          {setupSection === "form" && (
            <OnboardingFormBuilder
              initialSchema={formSchema}
              publishedVersion={formVersion}
              publishedAt={formPublishedAt}
              onSave={async (schema, publish) => {
                await api.saveOnboardingForm({ name: "Supplier Onboarding", schema, publish });
                setMessage(publish ? "Form published." : "Form draft saved.");
                await refresh();
              }}
            />
          )}

          {setupSection === "rules" && (
            <Card className="max-w-2xl">
              <SectionHeader
                title="Auto-approval rules"
                description="Write requirements in plain language. Matching submissions approve instantly."
              />
              <Textarea
                label="Rules"
                rows={6}
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                placeholder='e.g. "GST must be valid, company name filled, certificate not expired"'
              />
              <Button
                className="mt-4"
                onClick={async () => {
                  const result = await api.createRules(rulesText);
                  setStructuredRules(result.structuredRules as Array<Record<string, unknown>>);
                  setMessage("Rules saved.");
                }}
                disabled={rulesText.length < 10}
              >
                Save rules
              </Button>
              {structuredRules.length > 0 && (
                <div className="mt-4">
                  <Button variant="ghost" className="text-xs" onClick={() => setShowRulesJson((v) => !v)}>
                    {showRulesJson ? "Hide" : "View"} parsed rules
                  </Button>
                  {showRulesJson && (
                    <pre className="mt-2 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-landing-elevated)] p-3 font-mono text-xs text-[var(--color-ink-muted)]">
                      {JSON.stringify(structuredRules, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </Card>
          )}

          {setupSection === "gst" && (
            <GstReconciliationPanel
              isEnterprise={isEnterprise}
              invoices={gstInvoices}
              onRefresh={refresh}
            />
          )}
        </>
      )}

      {tab === "feedback" && (
        <FeatureRequestTracker
          requests={featureRequests}
          submitting={submittingFeature}
          initialDraft={
            judgeDraft
              ? {
                  title: judgeDraft.title,
                  description: judgeDraft.description,
                  requestType: judgeDraft.requestType,
                  targetUser: judgeDraft.targetUser,
                  currentPain: judgeDraft.currentPain,
                }
              : null
          }
            onSubmit={async (data) => {
              setSubmittingFeature(true);
              try {
                await api.createFeatureRequest(data);
                setMessage("AI product review complete — see assessment below.");
                await refresh();
              } finally {
                setSubmittingFeature(false);
              }
            }}
          onClarify={async (id, reply) => {
            await api.clarifyFeatureRequest(id, reply);
            setMessage("Clarification sent.");
            await refresh();
          }}
        />
      )}
    </Shell>
  );
}
