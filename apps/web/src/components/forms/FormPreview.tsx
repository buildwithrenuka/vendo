import type { FormSchemaPayload } from "@vendo/forms";
import { getActiveFields, isInteractiveField, isStructuralField } from "@vendo/forms";
import { FormFieldRenderer } from "./FormFieldRenderer";

type Props = {
  schema: FormSchemaPayload;
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
};

export function FormPreview({ schema, values, onChange }: Props) {
  const activeFields = getActiveFields(schema.fields, values);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{schema.title}</h3>
        {schema.description && (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{schema.description}</p>
        )}
      </div>

      {activeFields.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">Add fields to see a preview.</p>
      ) : (
        activeFields.map((field) => {
          if (field.type === "page_break") {
            return (
              <div key={field.id} className="border-t border-dashed border-[var(--color-border)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-copper)]">
                  {field.label || "Next page"}
                </p>
                {field.sectionDescription && (
                  <p className="text-sm text-[var(--color-ink-muted)]">{field.sectionDescription}</p>
                )}
              </div>
            );
          }

          if (isStructuralField(field)) {
            return (
              <div key={field.id} className="border-t border-[var(--color-border)] pt-4">
                <h4 className="font-semibold text-[var(--color-copper)]">{field.label}</h4>
                {field.sectionDescription && (
                  <p className="text-sm text-[var(--color-ink-muted)]">{field.sectionDescription}</p>
                )}
              </div>
            );
          }

          if (!isInteractiveField(field)) return null;

          const widthClass = field.fieldWidth === "half" ? "sm:max-w-[calc(50%-0.5rem)]" : "";

          return (
            <div key={field.id} className={widthClass}>
              <FormFieldRenderer
                field={field}
                value={values[field.id]}
                onChange={(value) => onChange(field.id, value)}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
