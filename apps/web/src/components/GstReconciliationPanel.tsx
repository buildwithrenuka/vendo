import { useState } from "react";
import type { GstInvoice } from "@vendo/shared";
import { api } from "../lib/api";
import { Button, Card, Input, SectionHeader } from "./ui";

type Props = {
  isEnterprise: boolean;
  invoices: GstInvoice[];
  onRefresh: () => Promise<void>;
};

export function GstReconciliationPanel({ isEnterprise, invoices, onRefresh }: Props) {
  const [form, setForm] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    supplierGst: "",
    taxableAmount: "",
    gstAmount: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isEnterprise) {
    return (
      <Card id="gst">
        <SectionHeader
          title="GST / ITC reconciliation"
          description="Enterprise plan — match supplier invoices against onboarded GST numbers."
        />
        <p className="text-sm text-[var(--color-ink-muted)]">
          Upgrade to Enterprise to auto-match invoices and catch GST mismatches before ITC claims.
        </p>
      </Card>
    );
  }

  const addInvoice = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.addGstInvoice({
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        supplierGst: form.supplierGst || undefined,
        taxableAmount: form.taxableAmount ? Number(form.taxableAmount) : undefined,
        gstAmount: form.gstAmount ? Number(form.gstAmount) : undefined,
      });
      setForm({ invoiceNumber: "", invoiceDate: "", supplierGst: "", taxableAmount: "", gstAmount: "" });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add invoice");
    } finally {
      setBusy(false);
    }
  };

  const runReconcile = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.reconcileGst();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reconciliation failed");
    } finally {
      setBusy(false);
    }
  };

  const statusTone: Record<string, string> = {
    matched: "text-emerald-400",
    mismatch: "text-red-400",
    missing: "text-amber-300",
    pending: "text-[var(--color-ink-muted)]",
  };

  return (
    <Card id="gst">
      <SectionHeader
        title="GST / ITC reconciliation"
        description="Add invoices and match supplier GST from approved onboarding data."
      />
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Invoice number"
          value={form.invoiceNumber}
          onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
        />
        <Input
          label="Invoice date"
          type="date"
          value={form.invoiceDate}
          onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
        />
        <Input
          label="Supplier GST"
          value={form.supplierGst}
          onChange={(e) => setForm({ ...form, supplierGst: e.target.value })}
          placeholder="22AAAAA0000A1Z5"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy || !form.invoiceNumber || !form.invoiceDate} onClick={addInvoice}>
          Add invoice
        </Button>
        <Button variant="secondary" disabled={busy} onClick={runReconcile}>
          Run reconciliation
        </Button>
      </div>

      <ul className="mt-6 divide-y divide-[var(--color-border)]">
        {invoices.length === 0 ? (
          <li className="py-4 text-sm text-[var(--color-ink-muted)]">No invoices yet.</li>
        ) : (
          invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-medium">{inv.invoiceNumber}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {inv.invoiceDate}
                  {inv.supplierGst ? ` · ${inv.supplierGst}` : ""}
                </p>
                {inv.notes && <p className="text-xs text-amber-300">{inv.notes}</p>}
              </div>
              <span className={`text-xs font-semibold uppercase ${statusTone[inv.matchStatus] ?? ""}`}>
                {inv.matchStatus.replace(/_/g, " ")}
              </span>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
