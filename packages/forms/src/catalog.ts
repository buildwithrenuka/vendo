import { FieldSchema, FormFieldsSchema, type FormField } from "./schemas";

export function validateFieldValue(field: FormField, value: unknown): string | null {
  const stringValue = Array.isArray(value) ? value.join(",") : String(value ?? "");

  if (field.required && !stringValue.trim()) return "This field is required";
  if (field.minLength > 0 && stringValue.length < field.minLength) {
    return `Minimum ${field.minLength} characters required`;
  }
  if (field.maxLength > 0 && stringValue.length > field.maxLength) {
    return `Maximum ${field.maxLength} characters allowed`;
  }

  if (field.validationPreset && field.validationPreset !== "none" && stringValue) {
    const preset = VALIDATION_PRESETS.find((p) => p.value === field.validationPreset);
    const pattern = field.validationPreset === "custom" ? field.customPattern : preset?.pattern;
    if (pattern && !new RegExp(pattern).test(stringValue)) {
      return field.errorMessage || preset?.hint || "Invalid format";
    }
  }

  return null;
}

export const VALIDATION_PRESETS: {
  value: FormField["validationPreset"];
  label: string;
  pattern: string;
  hint: string;
}[] = [
  { value: "none", label: "None", pattern: "", hint: "No extra validation" },
  { value: "letters-only", label: "Letters Only", pattern: "^[A-Za-z\\s]+$", hint: "Only letters & spaces" },
  { value: "numbers-only", label: "Numbers Only", pattern: "^[0-9]+$", hint: "Only digits" },
  { value: "alphanumeric", label: "Alphanumeric", pattern: "^[A-Za-z0-9]+$", hint: "Letters and numbers only" },
  { value: "pan", label: "PAN Number", pattern: "^[A-Z]{5}[0-9]{4}[A-Z]$", hint: "e.g. ABCDE1234F" },
  { value: "gst", label: "GST Number", pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", hint: "e.g. 22AAAAA0000A1Z5" },
  { value: "ifsc", label: "IFSC Code", pattern: "^[A-Z]{4}0[A-Z0-9]{6}$", hint: "e.g. HDFC0001234" },
  { value: "pincode", label: "PIN Code", pattern: "^[0-9]{6}$", hint: "6-digit postal code" },
  { value: "custom", label: "Custom Regex", pattern: "", hint: "Enter your own pattern" },
];

export type FieldCatalogItem = { type: FormField["type"]; label: string; icon: string };

export const FIELD_CATALOG: FieldCatalogItem[] = [
  { type: "text", label: "Text", icon: "Aa" },
  { type: "email", label: "Email", icon: "@" },
  { type: "phone", label: "Phone", icon: "☎" },
  { type: "textarea", label: "Long text", icon: "¶" },
  { type: "number", label: "Number", icon: "#" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "url", label: "URL", icon: "🔗" },
  { type: "currency", label: "Currency", icon: "₹" },
  { type: "select", label: "Dropdown", icon: "▾" },
  { type: "radio", label: "Single choice", icon: "◉" },
  { type: "checkbox", label: "Multi choice", icon: "☑" },
  { type: "multi_select", label: "Multi dropdown", icon: "▾▾" },
  { type: "file", label: "File upload", icon: "📎" },
  { type: "gst", label: "GST", icon: "GST" },
  { type: "pan", label: "PAN", icon: "PAN" },
  { type: "ifsc", label: "IFSC", icon: "IFSC" },
  { type: "pincode", label: "PIN code", icon: "PIN" },
  { type: "section", label: "Section", icon: "—" },
  { type: "page_break", label: "Page break", icon: "📄" },
];

export const FIELD_CATALOG_GROUPS: { label: string; types: FormField["type"][] }[] = [
  {
    label: "Basic",
    types: ["text", "email", "phone", "textarea", "number", "date", "url", "currency", "file"],
  },
  {
    label: "Choice",
    types: ["select", "radio", "checkbox", "multi_select"],
  },
  {
    label: "Compliance",
    types: ["gst", "pan", "ifsc", "pincode"],
  },
  {
    label: "Layout",
    types: ["section", "page_break"],
  },
];

export const OPTION_FIELD_TYPES = new Set<FormField["type"]>([
  "select", "radio", "checkbox", "multi_select",
]);

export function fieldHasOptions(type: FormField["type"]): boolean {
  return OPTION_FIELD_TYPES.has(type);
}

export const CONDITIONAL_OPERATORS: {
  value: FormField["conditionalOperator"];
  label: string;
}[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
];

export function makeFieldId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function defaultField(type: FormField["type"]): FormField {
  const label = FIELD_CATALOG.find((f) => f.type === type)?.label ?? type;
  const preset =
    type === "gst" ? "gst"
    : type === "pan" ? "pan"
    : type === "ifsc" ? "ifsc"
    : type === "pincode" ? "pincode"
    : type === "email" ? "email"
    : type === "phone" ? "phone"
    : type === "url" ? "url"
    : "none";

  return FieldSchema.parse({
    id: makeFieldId(),
    type,
    label: type === "section" ? "Section title" : type === "page_break" ? "Page 2" : label,
    placeholder: type === "textarea" ? "Enter details…" : `Enter ${label.toLowerCase()}…`,
    required: false,
    options: fieldHasOptions(type) ? ["Option 1", "Option 2"] : [],
    validationPreset: preset,
    helperText: "",
    min: type === "rating" ? 1 : 0,
    max: type === "rating" ? 5 : 100,
    sectionDescription: type === "page_break" ? "Additional details" : "",
  });
}

export const SUPPLIER_STARTER_FIELDS: FormField[] = FormFieldsSchema.parse([
  { id: "company_name", type: "text", label: "Company Name", required: true },
  { id: "gst_number", type: "gst", label: "GST Number", required: true, validationPreset: "gst" },
  { id: "pan_number", type: "pan", label: "PAN Number", required: false, validationPreset: "pan" },
  { id: "registered_address", type: "textarea", label: "Registered Address", required: true },
  { id: "contact_email", type: "email", label: "Contact Email", required: true },
  { id: "contact_phone", type: "phone", label: "Contact Phone", required: false },
  { id: "gst_certificate_expiry", type: "date", label: "GST Certificate Expiry", required: false },
]);
