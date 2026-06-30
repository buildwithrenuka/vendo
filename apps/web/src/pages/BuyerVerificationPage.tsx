import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input, SectionHeader, Shell, Textarea } from "../components/ui";

export function BuyerVerificationPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ businessEmail: "", companyName: "", gstNumber: "" });
  const [documentText, setDocumentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const extractFromDocument = async () => {
    if (documentText.trim().length < 20) return;
    setExtracting(true);
    setError(null);
    try {
      const { extracted } = await api.extractBuyerVerification(documentText);
      setForm((prev) => ({
        businessEmail: extracted.businessEmail ?? prev.businessEmail,
        companyName: extracted.companyName ?? prev.companyName,
        gstNumber: extracted.gstNumber ?? prev.gstNumber,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.submitBuyerVerification(form);
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title="Become a buyer" subtitle="Instant setup with your work email">
      <Card className="max-w-xl">
        <SectionHeader
          label="Onboarding"
          title="Verify your company"
          description="Use your work email — not Gmail or Yahoo. Paste GST certificate text for AI-assisted extraction."
        />
        <div className="mb-4 space-y-2">
          <Textarea
            label="GST / company document (optional)"
            rows={4}
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            placeholder="Paste certificate or registration text — AI extracts company name & GST"
          />
          <Button type="button" variant="secondary" disabled={extracting || documentText.length < 20} onClick={extractFromDocument}>
            {extracting ? "Extracting…" : "Extract with AI"}
          </Button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <Input
            label="Business email"
            type="email"
            required
            value={form.businessEmail}
            onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
            placeholder="you@yourcompany.com"
          />
          <Input
            label="Company name"
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <Input
            label="GST number (optional)"
            value={form.gstNumber}
            onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
            placeholder="22AAAAA0000A1Z5"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Setting up…" : "Start as buyer"}
          </Button>
        </form>
      </Card>
    </Shell>
  );
}
