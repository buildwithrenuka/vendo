import type { FormField } from "./schemas";

export function isStructuralField(field: Pick<FormField, "type">): boolean {
  return field.type === "section" || field.type === "section_divider" || field.type === "page_break";
}

export function isInteractiveField(field: Pick<FormField, "type">): boolean {
  return !isStructuralField(field);
}

function normalizeValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(",").trim().toLowerCase();
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value).trim().toLowerCase();
  return String(value).trim().toLowerCase();
}

export function isFieldConditionMet(field: FormField, values: Record<string, unknown>): boolean {
  if (!field.conditionalParentId) return true;

  const sourceValue = values[field.conditionalParentId];
  const normalizedValue = normalizeValue(sourceValue);
  const expectedValue = normalizeValue(field.conditionalValue);

  switch (field.conditionalOperator) {
    case "not_equals":
      return normalizedValue !== expectedValue;
    case "contains":
      return normalizedValue.includes(expectedValue);
    case "greater_than":
      return Number(sourceValue ?? 0) > Number(field.conditionalValue ?? 0);
    case "less_than":
      return Number(sourceValue ?? 0) < Number(field.conditionalValue ?? 0);
    case "is_empty":
      return normalizedValue.length === 0;
    case "is_not_empty":
      return normalizedValue.length > 0;
    case "equals":
    default:
      return normalizedValue === expectedValue;
  }
}

export function getActiveFields(fields: FormField[], values: Record<string, unknown>): FormField[] {
  return fields.filter((field) => !field.hidden && isFieldConditionMet(field, values));
}

export type FormPage = {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
};

export function getFormPages(fields: FormField[], values: Record<string, unknown>): FormPage[] {
  const activeFields = getActiveFields(fields, values);
  const pages: FormPage[] = [];
  let currentPage: FormPage = { id: "page-1", title: "Page 1", description: "", fields: [] };

  for (const field of activeFields) {
    if (field.type === "page_break") {
      if (currentPage.fields.length > 0 || pages.length === 0) pages.push(currentPage);
      currentPage = {
        id: field.id,
        title: field.label || `Page ${pages.length + 1}`,
        description: field.sectionDescription || "",
        fields: [],
      };
      continue;
    }
    currentPage.fields.push(field);
  }

  if (currentPage.fields.length > 0 || pages.length === 0) pages.push(currentPage);
  return pages;
}
