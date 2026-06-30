import type { PrefillSuggestion } from "@vendo/shared";
import { openAiJson } from "../lib/openai";
import { getVerifiedProfile } from "./scorecard";

const KNOWN_FIELD_IDS = [
  "company_name",
  "gst_number",
  "pan_number",
  "registered_address",
  "contact_email",
  "contact_phone",
  "gst_certificate_expiry",
];

/** AI-assisted prefill — reuses verified profile first, then public/AI suggestions */
export async function suggestPrefill(
  companyName: string,
  options?: {
    apiKey?: string;
    supplierId?: string;
    db?: D1Database;
  },
): Promise<PrefillSuggestion[]> {
  const normalized = companyName.trim();
  if (!normalized) return [];

  const suggestions: PrefillSuggestion[] = [];

  if (options?.db && options.supplierId) {
    const profile = await getVerifiedProfile(options.db, options.supplierId);
    if (profile) {
      for (const fieldId of KNOWN_FIELD_IDS) {
        const value = profile.profileData[fieldId];
        if (value != null && String(value).trim()) {
          suggestions.push({
            fieldId,
            value: String(value),
            confidence: "high",
            source: "verified_profile",
          });
        }
      }
      if (suggestions.length > 0) return suggestions;
    }
  }

  suggestions.push({
    fieldId: "company_name",
    value: normalized,
    confidence: "high",
    source: "user_input",
  });

  if (options?.apiKey) {
    const ai = await openAiJson<{ suggestions?: PrefillSuggestion[] }>(
      options.apiKey,
      `You suggest supplier onboarding field values for Indian B2B procurement.
Return JSON: { "suggestions": [{ "fieldId", "value", "confidence": "high"|"medium"|"low", "source" }] }
Only use fieldIds: ${KNOWN_FIELD_IDS.join(", ")}.
Never invent a GST/PAN — only suggest if you can infer from company name patterns. Prefer empty over wrong.
Supplier always reviews before submit.`,
      `Company name: ${normalized}`,
    );

    for (const s of ai?.suggestions ?? []) {
      if (!KNOWN_FIELD_IDS.includes(s.fieldId) || s.fieldId === "company_name") continue;
      if (!s.value?.trim()) continue;
      suggestions.push({
        fieldId: s.fieldId,
        value: s.value.trim(),
        confidence: s.confidence ?? "low",
        source: s.source ?? "ai_inference",
      });
    }
  }

  if (suggestions.length === 1 && normalized.length > 3) {
    suggestions.push({
      fieldId: "registered_address",
      value: `${normalized}, India`,
      confidence: "low",
      source: "heuristic",
    });
  }

  return suggestions;
}

export interface ExtractedBuyerInfo {
  companyName?: string;
  gstNumber?: string;
  businessEmail?: string;
}

export async function extractBuyerInfoFromDocument(
  documentText: string,
  apiKey?: string,
): Promise<ExtractedBuyerInfo> {
  const text = documentText.trim();
  if (!text) return {};

  const gstMatch = text.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]/i);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

  const heuristic: ExtractedBuyerInfo = {
    gstNumber: gstMatch?.[0]?.toUpperCase(),
    businessEmail: emailMatch?.[0],
  };

  if (!apiKey) return heuristic;

  const ai = await openAiJson<ExtractedBuyerInfo>(
    apiKey,
    `Extract buyer company verification fields from GST certificate or company document text.
Return JSON: { "companyName"?: string, "gstNumber"?: string, "businessEmail"?: string }
Only include fields you find with reasonable confidence.`,
    text.slice(0, 4000),
  );

  return {
    companyName: ai?.companyName ?? heuristic.companyName,
    gstNumber: ai?.gstNumber ?? heuristic.gstNumber,
    businessEmail: ai?.businessEmail ?? heuristic.businessEmail,
  };
}
