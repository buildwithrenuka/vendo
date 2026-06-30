import type { FormSchemaPayload } from "@vendo/forms";
import { Button } from "./ui";

type QueueItem = {
  id: string;
  supplier_name?: string;
  supplier_email?: string;
  status?: string;
  submitted_at?: string;
  data?: Record<string, unknown>;
  ruleResults?: Array<{ rule?: string; passed?: boolean; message?: string }> | null;
};

function fieldLabel(schema: FormSchemaPayload, fieldId: string): string {
  const field = schema.fields.find((f) => f.id === fieldId);
  return field?.label ?? fieldId.replace(/_/g, " ");
}

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

const statusTone: Record<string, string> = {
  pending_review: "app-badge-warning",
  submitted: "app-badge-warning",
  auto_approved: "app-badge-success",
  approved: "app-badge-success",
  rejected: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
  draft: "app-badge-neutral",
  invited: "app-badge-neutral",
  onboarding: "app-badge-accent",
};

export function SubmissionReviewCard({
  item,
  formSchema,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  formSchema: FormSchemaPayload;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const data = item.data ?? {};
  const dataKeys = Object.keys(data);
  const status = String(item.status ?? "unknown");

  return (
    <li className="app-list-item text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[var(--color-ink)]">
            {item.supplier_name ?? item.supplier_email ?? "Supplier"}
          </p>
          {item.supplier_email && item.supplier_name && (
            <p className="text-xs text-[var(--color-ink-muted)]">{item.supplier_email}</p>
          )}
        </div>
        <span className={`app-badge rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[status] ?? "app-badge-neutral"}`}>
          {status.replace(/_/g, " ")}
        </span>
      </div>

      {dataKeys.length > 0 && (
        <dl className="mt-4 grid gap-3 rounded-xl border border-[var(--color-border)] bg-black/20 p-3 sm:grid-cols-2">
          {dataKeys.map((key) => (
            <div key={key}>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                {fieldLabel(formSchema, key)}
              </dt>
              <dd className="mt-0.5 break-words text-[var(--color-ink)]">{formatValue(data[key])}</dd>
            </div>
          ))}
        </dl>
      )}

      {item.ruleResults && item.ruleResults.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {item.ruleResults.map((r, i) => (
            <li key={i} className={r.passed ? "text-emerald-400" : "text-amber-300"}>
              {r.passed ? "✓" : "○"} {r.message ?? r.rule ?? "Rule check"}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <Button onClick={onApprove}>Approve</Button>
        <Button variant="secondary" onClick={onReject}>Reject</Button>
      </div>
    </li>
  );
}

export function ScorecardBadge({ rating }: { rating: "green" | "yellow" | "red" }) {
  const styles = {
    green: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
    yellow: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
    red: "bg-red-500/15 text-red-300 ring-red-500/25",
  };
  const labels = { green: "Reliable", yellow: "Watch", red: "At risk" };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles[rating]}`}>
      {labels[rating]}
    </span>
  );
}

export function SupplierStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    invited: "Invited",
    onboarding: "Onboarding",
    draft: "Draft",
    submitted: "Submitted",
    pending_review: "Pending review",
    auto_approved: "Auto-approved",
    approved: "Approved",
    rejected: "Rejected",
  };

  return (
    <span className={`app-badge inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[status] ?? "app-badge-neutral"}`}>
      {labels[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}
