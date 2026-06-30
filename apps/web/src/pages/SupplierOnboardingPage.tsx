import { useEffect, useState } from "react";
import type { FormSchemaPayload } from "@vendo/forms";
import { getActiveFields, isInteractiveField } from "@vendo/forms";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { FormFieldRenderer } from "../components/forms/FormFieldRenderer";
import { Badge, Button, Card, Alert, Shell, SectionHeader } from "../components/ui";

export function SupplierOnboardingPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [schema, setSchema] = useState<FormSchemaPayload | null>(null);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState<string>("draft");
  const [message, setMessage] = useState<string | null>(null);
  const [verifiedProfileAt, setVerifiedProfileAt] = useState<string | null>(null);

  useEffect(() => {
    api.getSupplierOnboarding()
      .then((res) => {
        setBuyerName(res.buyer.name);
        setBuyerId(res.buyer.id);
        setTemplateId(res.template.id);
        setSchema(res.template.schema);
        if (res.submission) {
          setData(res.submission.data);
          setStatus(res.submission.status);
        } else if (res.verifiedProfile) {
          setVerifiedProfileAt(res.verifiedProfile.verifiedAt);
          setData(res.verifiedProfile.profileData);
          setMessage("Verified profile loaded — review and update for this buyer.");
        }
        if (res.verifiedProfile) {
          setVerifiedProfileAt(res.verifiedProfile.verifiedAt);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load onboarding"))
      .finally(() => setLoading(false));
  }, []);

  const runPrefill = async () => {
    const companyName = String(data.company_name ?? "");
    if (!companyName) return;
    const result = await api.prefill(companyName);
    const next = { ...data };
    for (const s of result.suggestions) {
      if (!next[s.fieldId]) next[s.fieldId] = s.value;
    }
    setData(next);
    setMessage("AI suggestions applied — please review before submitting.");
  };

  const applyVerifiedProfile = async () => {
    const companyName = String(data.company_name ?? user?.name ?? "");
    const result = await api.prefill(companyName || "Supplier");
    const next = { ...data };
    for (const s of result.suggestions) {
      next[s.fieldId] = s.value;
    }
    setData(next);
    setMessage("Verified Once profile applied — confirm details before submit.");
  };

  const save = async (submit: boolean) => {
    if (!templateId || !buyerId) return;
    const result = await api.submitForm({ formTemplateId: templateId, buyerId, data, submit });
    setStatus(result.status);
    setMessage(
      submit
        ? result.status === "auto_approved"
          ? "Submitted and auto-approved!"
          : "Submitted — awaiting buyer review."
        : "Draft saved.",
    );
  };

  if (loading) return <Shell title="Loading onboarding…" />;
  if (error) {
    return (
      <Shell title="Onboarding unavailable">
        <Card><p className="text-red-600">{error}</p></Card>
      </Shell>
    );
  }

  const activeFields = schema
    ? getActiveFields(schema.fields, data).filter(isInteractiveField)
    : [];

  return (
    <Shell
      title="Supplier onboarding"
      subtitle={buyerName ?? undefined}
      actions={
        <>
          <Badge tone={status === "auto_approved" || status === "approved" ? "success" : status === "pending_review" ? "warning" : "neutral"}>
            {status.replace(/_/g, " ")}
          </Badge>
          <Button variant="ghost" onClick={() => logout()}>Sign out</Button>
        </>
      }
    >
      {message && <Alert tone="success">{message}</Alert>}

      {verifiedProfileAt && (
        <div className="app-callout mb-6 max-w-2xl mx-auto">
          <p className="app-kicker">Verified Once</p>
          <p className="text-sm text-[var(--color-ink-muted)]">
            You verified on {new Date(verifiedProfileAt).toLocaleDateString()} — reuse your profile with new buyers.
          </p>
          <Button variant="secondary" className="mt-3" onClick={applyVerifiedProfile}>
            Apply verified profile
          </Button>
        </div>
      )}

      <Card className="mx-auto max-w-2xl space-y-5">
        <SectionHeader
          label="Compliance form"
          title={schema?.title ?? "Onboarding"}
          description={schema?.description}
        />

        {activeFields.map((field) => (
          <FormFieldRenderer
            key={field.id}
            field={field}
            value={data[field.id]}
            onChange={(value) => setData({ ...data, [field.id]: value })}
          />
        ))}

        <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
          <Button variant="secondary" onClick={runPrefill} disabled={!data.company_name}>AI prefill</Button>
          <Button variant="secondary" onClick={() => save(false)}>Save draft</Button>
          <Button onClick={() => save(true)}>Submit for review</Button>
        </div>

        <p className="text-xs text-[var(--color-ink-muted)]">
          Signed in as {user?.email}. AI only suggests values — you always submit yourself.
        </p>
      </Card>
    </Shell>
  );
}
