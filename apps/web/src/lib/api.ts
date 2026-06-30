const API_BASE = "/api";

type ApiRequestInit = RequestInit & { timeoutMs?: number };

async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { timeoutMs = 10_000, ...fetchInit } = init ?? {};
  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchInit,
    credentials: "include",
    signal: fetchInit.signal ?? AbortSignal.timeout(timeoutMs),
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const msg = err.details ?? err.error ?? "Request failed";
    throw new Error(typeof msg === "string" ? msg : "Request failed");
  }

  return res.json() as Promise<T>;
}

export const api = {
  session: () =>
    request<{
      authenticated: boolean;
      user: import("@vendo/shared").User | null;
      isDeveloper: boolean;
      isVendoAdmin: boolean;
      employeeUsername: string | null;
    }>("/me/session"),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  employeeLogin: (data: { username: string; password: string }) =>
    request<{ ok: boolean; redirect: string }>("/auth/employee/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listEmployees: () =>
    request<{ items: import("@vendo/shared").VendoEmployeePublic[] }>("/dev/employees"),

  onboardEmployee: (data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    employeeRole?: "admin" | "engineer";
  }) =>
    request<{ employee: import("@vendo/shared").VendoEmployeePublic }>("/dev/employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateEmployee: (
    id: string,
    data: { isActive?: boolean; password?: string; employeeRole?: "admin" | "engineer" },
  ) =>
    request<{ employee: import("@vendo/shared").VendoEmployeePublic | undefined }>(
      `/dev/employees/${id}`,
      { method: "PATCH", body: JSON.stringify(data) },
    ),

  googleLogin: (data: { credential?: string; code?: string; access_token?: string; invite?: string }) =>
    request("/auth/google", { method: "POST", body: JSON.stringify(data) }),

  googleCallback: (data: { code: string; state: string }) =>
    request<{ ok: boolean; redirect: string }>("/auth/google/callback", { method: "POST", body: JSON.stringify(data) }),

  oidcExchange: (data: { oidcToken?: string; code?: string; invite?: string }) =>
    request("/auth/oidc-exchange", { method: "POST", body: JSON.stringify(data) }),

  validateInvite: (token: string) =>
    request<{ valid: boolean; email?: string; buyerName?: string; expiresAt?: string; error?: string }>(
      `/invites/${token}/validate`,
    ),

  submitBuyerVerification: (data: { businessEmail: string; companyName: string; gstNumber?: string }) =>
    request("/buyer/verify", { method: "POST", body: JSON.stringify(data) }),

  listInvites: () => request<{ invites: Array<Record<string, unknown>> }>("/invites"),
  createInvite: (data: { email: string; phone?: string }) =>
    request<{ id: string; email: string; phone?: string | null; expiresAt: string; emailSent: boolean; emailError?: string; inviteUrl: string }>(
      "/invites",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),
  refreshInviteShareLink: (inviteId: string) =>
    request<{ id: string; email: string; phone?: string | null; expiresAt: string; inviteUrl: string }>(
      `/invites/${inviteId}/share-link`,
      { method: "POST" },
    ),

  getOnboardingForm: () => request<{
    template: {
      schema: import("@vendo/forms").FormSchemaPayload;
      version?: number;
      publishedAt?: string;
    } | null;
    defaultSchema: import("@vendo/forms").FormSchemaPayload;
  }>("/buyer/onboarding-form"),

  saveOnboardingForm: (data: { name: string; schema: import("@vendo/forms").FormSchemaPayload; publish?: boolean }) =>
    request("/buyer/onboarding-form", { method: "POST", body: JSON.stringify(data) }),

  getRules: () => request<{ ruleset: unknown }>("/rules"),
  createRules: (naturalLanguage: string) =>
    request<{ structuredRules: Array<Record<string, unknown>> }>("/rules", { method: "POST", body: JSON.stringify({ naturalLanguage }) }),

  getReviewQueue: () => request<{ queue: Array<Record<string, unknown>> }>("/review/queue"),
  reviewSubmission: (id: string, action: "approve" | "reject") =>
    request<{ ok: boolean; status: string; emailSent?: boolean; emailError?: string }>(
      `/review/${id}/action`,
      { method: "POST", body: JSON.stringify({ action }) },
    ),

  listSuppliers: () =>
    request<{
      suppliers: Array<{
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
      }>;
    }>("/buyer/suppliers"),

  getSupplierOnboarding: () => request<{
    buyer: { id: string; name: string | null };
    template: { id: string; name: string; version: number; schema: import("@vendo/forms").FormSchemaPayload };
    submission: { id: string; data: Record<string, unknown>; status: string } | null;
    verifiedProfile: { profileData: Record<string, unknown>; verifiedAt: string } | null;
  }>("/supplier/onboarding"),

  prefill: (companyName: string) =>
    request<{ suggestions: import("@vendo/shared").PrefillSuggestion[] }>("/supplier/prefill", {
      method: "POST",
      body: JSON.stringify({ companyName }),
    }),

  submitForm: (data: {
    formTemplateId: string;
    buyerId: string;
    data: Record<string, unknown>;
    submit: boolean;
  }) => request<{ id: string; status: string; ruleResults?: unknown }>("/supplier/submit", { method: "POST", body: JSON.stringify(data) }),

  devLogin: (data: { email: string; name?: string; role?: string; invite?: string }) =>
    request("/auth/dev-login", { method: "POST", body: JSON.stringify(data) }),

  listFeatureRequests: () =>
    request<{ requests: import("@vendo/shared").FeatureRequest[] }>("/buyer/feature-requests"),

  createFeatureRequest: (data: {
    title: string;
    description: string;
    requestType?: "feature" | "bug";
    targetUser?: "buyer" | "supplier" | "both" | "unknown";
    currentPain?: string;
  }) =>
    request<{ request: import("@vendo/shared").FeatureRequest }>("/buyer/feature-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  clarifyFeatureRequest: (id: string, reply: string) =>
    request<{ request: import("@vendo/shared").FeatureRequest }>(
      `/buyer/feature-requests/${id}/clarify`,
      { method: "POST", body: JSON.stringify({ reply }) },
    ),

  extractBuyerVerification: (documentText: string) =>
    request<{ extracted: { companyName?: string; gstNumber?: string; businessEmail?: string } }>(
      "/buyer/verify/extract",
      { method: "POST", body: JSON.stringify({ documentText }) },
    ),

  listGstInvoices: () =>
    request<{ invoices: import("@vendo/shared").GstInvoice[] }>("/buyer/gst/invoices"),

  addGstInvoice: (data: {
    invoiceNumber: string;
    invoiceDate: string;
    supplierGst?: string;
    supplierId?: string;
    taxableAmount?: number;
    gstAmount?: number;
  }) =>
    request<{ id: string }>("/buyer/gst/invoices", { method: "POST", body: JSON.stringify(data) }),

  reconcileGst: () =>
    request<{ ok: boolean; updated: number }>("/buyer/gst/reconcile", { method: "POST" }),

  devStats: () =>
    request<{ stats: import("@vendo/shared").InternalDashboardStats }>("/dev/stats"),

  devInbox: (type?: "feature" | "bug") =>
    request<{ items: import("@vendo/shared").InternalInboxItem[] }>(
      type ? `/dev/inbox?type=${type}` : "/dev/inbox",
    ),

  devConfig: () =>
    request<{ githubConfigured: boolean; githubRepo: string | null }>("/dev/config"),

  devQueue: () =>
    request<{ items: import("@vendo/shared").FeatureRequest[] }>("/dev/queue"),

  devFeature: (id: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(`/dev/features/${id}`),

  devStartWorking: (featureId: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(
      `/dev/features/${featureId}/start`,
      { method: "POST" },
    ),

  devMovePipeline: (featureId: string, status: import("@vendo/shared").DevQueueStatus, note?: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(
      `/dev/features/${featureId}/pipeline`,
      { method: "PATCH", body: JSON.stringify({ status, note }) },
    ),

  devEnqueue: (id: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(`/dev/features/${id}/enqueue`, {
      method: "POST",
    }),

  devUpdateTask: (taskId: string, status: import("@vendo/shared").DevTaskStatus) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(`/dev/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  devLinkPr: (featureId: string, prNumber: number) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(`/dev/features/${featureId}/pr`, {
      method: "POST",
      body: JSON.stringify({ prNumber }),
    }),

  devAiReview: (featureId: string, prNumber?: number) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(
      `/dev/features/${featureId}/review/ai`,
      { method: "POST", body: JSON.stringify({ prNumber }) },
    ),

  devAiBuild: (featureId: string) =>
    request<{
      feature: import("@vendo/shared").DevFeatureDetail;
      build: { prNumber: number; prUrl: string; branch: string; summary: string; files: string[] };
    }>(`/dev/features/${featureId}/build`, { method: "POST" }),

  devApproveShip: (featureId: string) =>
    request<{
      feature: import("@vendo/shared").DevFeatureDetail;
      customerEmailSent?: boolean;
      customerEmailError?: string;
      githubPrMerged?: boolean;
      githubMergeSha?: string | null;
      githubMergeMessage?: string | null;
      githubMergeError?: string | null;
    }>(
      `/dev/features/${featureId}/approve-ship`,
      { method: "POST" },
    ),

  devRejectShip: (featureId: string, reason: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(
      `/dev/features/${featureId}/reject-ship`,
      { method: "POST", body: JSON.stringify({ reason }) },
    ),

  // Jal Studio
  studioListProjects: () =>
    request<{ projects: import("@vendo/shared").JalProjectPublic[] }>("/studio/projects"),

  studioCreateProject: (data: {
    name: string;
    githubRepo: string;
    jalContext?: Partial<import("@vendo/shared").JalProjectContext>;
  }) =>
    request<{ project: import("@vendo/shared").JalProjectPublic; apiKey: string }>("/studio/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  studioGetProject: (projectId: string) =>
    request<{ project: import("@vendo/shared").JalProjectPublic }>(`/studio/projects/${projectId}`),

  studioUpdateProject: (
    projectId: string,
    data: { name?: string; githubRepo?: string; jalContext?: Partial<import("@vendo/shared").JalProjectContext> },
  ) =>
    request<{ project: import("@vendo/shared").JalProject }>(`/studio/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  studioScanRepo: (projectId: string) =>
    request<{ scan: import("@vendo/shared").JalRepoScanResult; jalContext: import("@vendo/shared").JalProjectContext }>(
      `/studio/projects/${projectId}/scan`,
      { method: "POST", timeoutMs: 120_000 },
    ),

  studioRegenerateKey: (projectId: string) =>
    request<{ apiKey: string }>(`/studio/projects/${projectId}/regenerate-key`, { method: "POST" }),

  studioEmbedInfo: (projectId: string) =>
    request<{ projectId: string; embedUrl: string; widgetSnippet: string; npmSnippet: string; iframeUrl: string }>(
      `/studio/projects/${projectId}/embed`,
    ),

  studioStats: (projectId: string) =>
    request<{ stats: import("@vendo/shared").InternalDashboardStats }>(`/studio/projects/${projectId}/stats`),

  studioInbox: (projectId: string, type?: "feature" | "bug") =>
    request<{ items: import("@vendo/shared").InternalInboxItem[] }>(
      type ? `/studio/projects/${projectId}/inbox?type=${type}` : `/studio/projects/${projectId}/inbox`,
    ),

  studioQueue: (projectId: string) =>
    request<{ items: import("@vendo/shared").FeatureRequest[] }>(`/studio/projects/${projectId}/queue`),

  studioFeature: (projectId: string, featureId: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(
      `/studio/projects/${projectId}/features/${featureId}`,
    ),

  studioEnqueue: (projectId: string, featureId: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(
      `/studio/projects/${projectId}/features/${featureId}/enqueue`,
      { method: "POST" },
    ),

  studioBuild: (projectId: string, featureId: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail; build: Record<string, unknown> }>(
      `/studio/projects/${projectId}/features/${featureId}/build`,
      { method: "POST" },
    ),

  studioAiReview: (projectId: string, featureId: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(
      `/studio/projects/${projectId}/features/${featureId}/review/ai`,
      { method: "POST" },
    ),

  studioApproveShip: (projectId: string, featureId: string) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail; githubPrMerged: boolean }>(
      `/studio/projects/${projectId}/features/${featureId}/approve-ship`,
      { method: "POST" },
    ),

  studioMovePipeline: (projectId: string, featureId: string, status: import("@vendo/shared").DevQueueStatus) =>
    request<{ feature: import("@vendo/shared").DevFeatureDetail }>(
      `/studio/projects/${projectId}/features/${featureId}/pipeline`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    ),

  studioPublicProject: (projectId: string) =>
    request<{ projectId: string; name: string; productName: string }>(`/studio/projects/${projectId}/public`),

  studioSetup: () =>
    request<{ githubConfigured: boolean; openaiConfigured: boolean; ready: boolean }>("/studio/setup"),
};
