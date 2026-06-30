/** Minimal types for standalone npm publish (compatible with host-app models). */

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

export interface CodeReviewFinding {
  severity: "blocking" | "non_blocking";
  category: string;
  message: string;
  file?: string;
}
