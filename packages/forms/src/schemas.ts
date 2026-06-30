import { z } from "zod";

export const FieldTypeEnum = z.enum([
  "text", "email", "password", "phone", "number",
  "date", "time", "url", "currency", "textarea",
  "checkbox", "radio", "select", "multi_select", "range", "rating",
  "file", "section", "page_break",
  "section_divider", "scale", "pan", "gst", "ifsc", "pincode",
]);
export type FieldType = z.infer<typeof FieldTypeEnum>;

export const ValidationPresetEnum = z.enum([
  "none", "letters-only", "numbers-only", "alphanumeric",
  "pan", "gst", "ifsc", "pincode", "email", "phone", "url", "custom",
]);
export type ValidationPreset = z.infer<typeof ValidationPresetEnum>;

export const ConditionalOperatorEnum = z.enum([
  "equals", "not_equals", "contains", "greater_than", "less_than", "is_empty", "is_not_empty",
]);
export type ConditionalOperator = z.infer<typeof ConditionalOperatorEnum>;

const FieldWidthEnum = z.enum(["full", "half"]);

export const FieldSchema = z.object({
  id: z.string().min(1),
  type: FieldTypeEnum,
  label: z.string().min(1).max(200),
  placeholder: z.string().max(200).optional().default(""),
  required: z.boolean().default(false),
  options: z.array(z.string().max(100)).optional().default([]),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().optional(),
  maxLength: z.number().int().optional(),
  validationPreset: ValidationPresetEnum.optional(),
  customPattern: z.string().optional(),
  customRegex: z.string().optional(),
  errorMessage: z.string().max(500).optional(),
  helperText: z.string().max(500).optional(),
  helpText: z.string().max(500).optional(),
  fieldWidth: FieldWidthEnum.optional().default("full"),
  hidden: z.boolean().optional().default(false),
  conditionalParentId: z.string().optional().default(""),
  conditionalOperator: ConditionalOperatorEnum.optional().default("equals"),
  conditionalValue: z.string().max(200).optional().default(""),
  prefix: z.string().max(20).optional().default(""),
  suffix: z.string().max(20).optional().default(""),
  sectionColor: z.string().max(50).optional().default(""),
  sectionDescription: z.string().max(500).optional().default(""),
  halfWidth: z.boolean().optional(),
}).transform((field) => ({
  ...field,
  helperText: field.helperText ?? field.helpText ?? "",
  fieldWidth: field.fieldWidth ?? (field.halfWidth ? "half" as const : "full" as const),
  customPattern: field.customPattern ?? field.customRegex ?? "",
  conditionalParentId: field.conditionalParentId ?? "",
  conditionalOperator: field.conditionalOperator ?? "equals" as const,
  conditionalValue: field.conditionalValue ?? "",
  options: field.options ?? [],
  min: field.min ?? 0,
  max: field.max ?? 100,
  minLength: field.minLength ?? 0,
  maxLength: field.maxLength ?? 0,
  validationPreset: field.validationPreset ?? "none" as const,
  errorMessage: field.errorMessage ?? "",
  prefix: field.prefix ?? "",
  suffix: field.suffix ?? "",
  sectionColor: field.sectionColor ?? "#c17f3a",
  sectionDescription: field.sectionDescription ?? "",
}));

export type FormField = z.infer<typeof FieldSchema>;

export const FormFieldsSchema = z.array(FieldSchema);

export const FormSchemaPayload = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fields: FormFieldsSchema,
});
export type FormSchemaPayload = z.infer<typeof FormSchemaPayload>;

export const SaveFormInput = z.object({
  name: z.string().min(2),
  schema: FormSchemaPayload,
  publish: z.boolean().optional(),
});
