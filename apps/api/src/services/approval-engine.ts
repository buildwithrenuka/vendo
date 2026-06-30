import type { StructuredRule } from "@vendo/shared";
import { openAiJson } from "../lib/openai";

const KNOWN_FIELDS = [
  "company_name",
  "gst_number",
  "pan_number",
  "registered_address",
  "contact_email",
  "contact_phone",
  "gst_certificate_expiry",
];

export function evaluateRules(
  rules: StructuredRule[],
  data: Record<string, unknown>,
): import("@vendo/shared").RuleCheckResult[] {
  return rules.map((rule) => evaluateRule(rule, data));
}

function evaluateRule(rule: StructuredRule, data: Record<string, unknown>): import("@vendo/shared").RuleCheckResult {
  const value = data[rule.field];
  const strValue = value == null ? "" : String(value);

  switch (rule.operator) {
    case "not_empty":
      return result(rule.id, strValue.trim().length > 0, rule.description, "Field is required");
    case "equals":
      return result(rule.id, strValue === (rule.value ?? ""), rule.description, `Expected "${rule.value}"`);
    case "not_equals":
      return result(rule.id, strValue !== (rule.value ?? ""), rule.description, `Must not equal "${rule.value}"`);
    case "contains":
      return result(
        rule.id,
        rule.value ? strValue.toLowerCase().includes(rule.value.toLowerCase()) : false,
        rule.description,
        `Must contain "${rule.value}"`,
      );
    case "matches_pattern": {
      if (!rule.value) return result(rule.id, false, rule.description, "Invalid pattern rule");
      try {
        const regex = new RegExp(rule.value);
        return result(rule.id, regex.test(strValue), rule.description, "Pattern mismatch");
      } catch {
        return result(rule.id, false, rule.description, "Invalid regex pattern");
      }
    }
    case "date_not_expired": {
      const parsed = Date.parse(strValue);
      const valid = !Number.isNaN(parsed) && parsed >= Date.now();
      return result(rule.id, valid, rule.description, "Date is expired or invalid");
    }
    default:
      return result(rule.id, false, rule.description, "Unknown rule operator");
  }
}

function result(ruleId: string, passed: boolean, description: string, failMessage: string): import("@vendo/shared").RuleCheckResult {
  return {
    ruleId,
    passed,
    message: passed ? description : failMessage,
  };
}

export function allRulesPassed(results: import("@vendo/shared").RuleCheckResult[]): boolean {
  return results.length > 0 && results.every((r) => r.passed);
}

function ruleBasedTranslation(input: string): StructuredRule[] {
  const lower = input.toLowerCase();
  const rules: StructuredRule[] = [];

  if (lower.includes("gst") && (lower.includes("valid") || lower.includes("present"))) {
    rules.push({
      id: crypto.randomUUID(),
      field: "gst_number",
      operator: "matches_pattern",
      value: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
      description: "GST number must be valid format",
    });
  }

  if (lower.includes("pan") && (lower.includes("valid") || lower.includes("present"))) {
    rules.push({
      id: crypto.randomUUID(),
      field: "pan_number",
      operator: "matches_pattern",
      value: "^[A-Z]{5}[0-9]{4}[A-Z]$",
      description: "PAN must be valid format",
    });
  }

  if (lower.includes("email")) {
    rules.push({
      id: crypto.randomUUID(),
      field: "contact_email",
      operator: "not_empty",
      description: "Contact email is required",
    });
  }

  if (lower.includes("not empty") || lower.includes("required") || lower.includes("filled")) {
    rules.push({
      id: crypto.randomUUID(),
      field: "company_name",
      operator: "not_empty",
      description: "Company name is required",
    });
  }

  if (lower.includes("expired") || lower.includes("expiry")) {
    rules.push({
      id: crypto.randomUUID(),
      field: "gst_certificate_expiry",
      operator: "date_not_expired",
      description: "GST certificate must not be expired",
    });
  }

  if (rules.length === 0) {
    rules.push({
      id: crypto.randomUUID(),
      field: "company_name",
      operator: "not_empty",
      description: "Company name is required (default rule)",
    });
  }

  return rules;
}

/** One-time AI translation → structured rules; deterministic checks at submit time */
export async function translateRulesFromPlainLanguage(
  input: string,
  apiKey?: string,
): Promise<StructuredRule[]> {
  if (apiKey) {
    const ai = await openAiJson<{ rules?: StructuredRule[] }>(
      apiKey,
      `Convert buyer verification requirements into structured rules for supplier onboarding.
Known field ids: ${KNOWN_FIELDS.join(", ")}.
Operators: not_empty, equals, not_equals, contains, matches_pattern, date_not_expired.
Return JSON: { "rules": [{ "id": "uuid", "field", "operator", "value"?, "description" }] }
Use Indian GST/PAN regex when relevant. Keep 1-6 practical rules.`,
      input,
    );

    const rules = (ai?.rules ?? [])
      .filter((r) => KNOWN_FIELDS.includes(r.field))
      .map((r) => ({ ...r, id: r.id || crypto.randomUUID() }));

    if (rules.length > 0) return rules;
  }

  return ruleBasedTranslation(input);
}
