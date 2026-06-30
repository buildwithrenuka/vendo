export type UserRole = "undecided" | "buyer" | "supplier";

export type BuyerVerificationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "auto_approved"
  | "pending_review"
  | "approved"
  | "rejected";

export type PricingTier = "standard" | "enterprise";

export type FeatureRequestType = "feature" | "bug";

export type FeatureRequestStatus =
  | "received"
  | "ai_review"
  | "planned"
  | "in_development"
  | "shipped"
  | "declined"
  | "already_exists";

export interface ClarificationMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface FeatureRequestPrdOutline {
  problemStatement: string;
  goals: string[];
  userStories: string[];
  acceptanceCriteria: string[];
  nonGoals?: string[];
}

export interface FeatureRequestAssessment {
  businessFit: "strong" | "moderate" | "weak" | "out_of_scope";
  targetUser: "buyer" | "supplier" | "both" | "unknown";
  verdict: string;
  reasoning: string[];
  suggestedNextStep: string;
  prdOutline?: FeatureRequestPrdOutline;
}

export interface FeatureRequest {
  id: string;
  buyerId: string;
  title: string;
  description: string;
  requestType: FeatureRequestType;
  currentPain: string | null;
  status: FeatureRequestStatus;
  devQueueStatus: DevQueueStatus | null;
  declineReason: string | null;
  existingFeatureUrl: string | null;
  aiFeedback: string | null;
  aiAssessment: FeatureRequestAssessment | null;
  clarificationThread: ClarificationMessage[];
  createdAt: string;
  updatedAt: string;
}

export type DevQueueStatus =
  | "queued"
  | "building"
  | "in_review"
  | "fix_needed"
  | "ready_for_approval"
  | "shipped";

export type DevTaskStatus = "backlog" | "in_progress" | "in_review" | "done";

export interface FeatureDevTask {
  id: string;
  featureRequestId: string;
  title: string;
  description: string | null;
  status: DevTaskStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type PrReviewStatus = "pending" | "ai_review" | "fix_needed" | "ready" | "approved" | "rejected";

export interface FeaturePullRequest {
  id: string;
  featureRequestId: string;
  prNumber: number;
  prUrl: string;
  branch: string | null;
  headSha: string | null;
  reviewStatus: PrReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export type CodeReviewVerdict = "pass" | "fix_needed" | "reject" | "approve_ship";

export interface CodeReviewFinding {
  severity: "blocking" | "non_blocking";
  category: string;
  message: string;
  file?: string;
}

export interface FeatureCodeReview {
  id: string;
  featureRequestId: string;
  prId: string | null;
  reviewerType: "ai" | "human";
  verdict: CodeReviewVerdict;
  summary: string;
  findings: CodeReviewFinding[];
  createdAt: string;
}

export type ActivityActorType = "customer" | "ai" | "employee" | "system";

export interface FeatureRequestActivity {
  id: string;
  featureRequestId: string;
  actorType: ActivityActorType;
  actorEmail: string | null;
  event: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DevFeatureDetail extends FeatureRequest {
  buyerEmail?: string;
  buyerName?: string | null;
  tasks: FeatureDevTask[];
  pullRequests: FeaturePullRequest[];
  reviews: FeatureCodeReview[];
  activityLog: FeatureRequestActivity[];
}

export interface InternalInboxItem extends FeatureRequest {
  buyerEmail?: string;
  buyerName?: string | null;
}

export interface InternalDashboardStats {
  total: number;
  features: number;
  bugs: number;
  inPipeline: number;
  awaitingApproval: number;
}

export type VendoEmployeeRole = "admin" | "engineer";

export interface VendoEmployeePublic {
  id: string;
  userId: string;
  username: string;
  email: string;
  name: string | null;
  employeeRole: VendoEmployeeRole;
  isActive: boolean;
  createdAt: string;
}

export const DEV_QUEUE_STATUS_LABELS: Record<DevQueueStatus, string> = {
  queued: "Queued",
  building: "Started working",
  in_review: "PR / AI review",
  fix_needed: "Fix needed",
  ready_for_approval: "Ready to ship",
  shipped: "Shipped",
};

/** ShipFlow pipeline order for employee board columns */
export const SHIPFLOW_PIPELINE: DevQueueStatus[] = [
  "queued",
  "building",
  "in_review",
  "fix_needed",
  "ready_for_approval",
  "shipped",
];

export const REQUEST_TYPE_LABELS: Record<FeatureRequestType, string> = {
  feature: "Feature",
  bug: "Bug",
};

export const DEV_TASK_STATUS_LABELS: Record<DevTaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

export const FEATURE_REQUEST_STATUS_LABELS: Record<FeatureRequestStatus, string> = {
  received: "Received",
  ai_review: "AI Review",
  planned: "Planned",
  in_development: "In Development",
  shipped: "Shipped",
  declined: "Declined",
  already_exists: "Already Exists",
};

export const FEATURE_REQUEST_STATUS_DESCRIPTIONS: Record<FeatureRequestStatus, string> = {
  received: "Submitted — entering product discovery",
  ai_review: "AI is checking business fit and gathering missing context",
  planned: "Accepted — requirements captured, queued for build",
  in_development: "Engineering is implementing this feature",
  shipped: "Live in your workspace",
  declined: "Not aligned with product direction right now",
  already_exists: "You already have this — see where to find it",
};

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  buyerVerificationStatus: BuyerVerificationStatus;
  pricingTier: PricingTier;
  companyName: string | null;
  createdAt: string;
}

export interface Invite {
  id: string;
  buyerId: string;
  email: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "file" | "date" | "select" | "textarea";
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  buyerId: string;
  name: string;
  version: number;
  schema: FormSchema;
  publishedAt: string | null;
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  formTemplateId: string;
  supplierId: string;
  buyerId: string;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  ruleResults: RuleCheckResult[] | null;
  createdAt: string;
  submittedAt: string | null;
}

export type RuleOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_empty"
  | "date_not_expired"
  | "matches_pattern";

export interface StructuredRule {
  id: string;
  field: string;
  operator: RuleOperator;
  value?: string;
  description: string;
}

export interface RuleCheckResult {
  ruleId: string;
  passed: boolean;
  message: string;
}

export interface ApprovalRuleset {
  id: string;
  buyerId: string;
  naturalLanguage: string;
  structuredRules: StructuredRule[];
  createdAt: string;
}

export interface PrefillSuggestion {
  fieldId: string;
  value: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export type ScorecardRating = "green" | "yellow" | "red";

export interface SupplierScorecard {
  rating: ScorecardRating;
  approvedCount: number;
  rejectedCount: number;
  autoApprovedCount: number;
}

export interface SupplierProfile {
  supplierId: string;
  profileData: Record<string, unknown>;
  verifiedAt: string | null;
}

export type GstMatchStatus = "pending" | "matched" | "mismatch" | "missing";

export interface GstInvoice {
  id: string;
  buyerId: string;
  supplierId: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  supplierGst: string | null;
  taxableAmount: number | null;
  gstAmount: number | null;
  matchStatus: GstMatchStatus;
  matchedSubmissionId: string | null;
  notes: string | null;
  createdAt: string;
}

export const STANDARD_TIER_MAX_SUPPLIERS = 3;

export interface ApiError {
  error: string;
  code?: string;
}
