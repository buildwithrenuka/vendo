import { useCallback, useEffect, useState } from "react";
import type { FeatureRequest } from "@vendo/shared";
import { FEATURE_REQUEST_STATUS_LABELS } from "@vendo/shared";
import { studioFeedbackApi, storageKey } from "../../lib/studio-api";
import { Button, Input, Textarea } from "../ui";

type Props = {
  projectId: string;
  apiKey: string;
  productName?: string;
  compact?: boolean;
};

export function StudioFeedbackPanel({ projectId, apiKey, productName, compact }: Props) {
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState<"feature" | "bug">("feature");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const storedEmail = localStorage.getItem(storageKey(projectId, "email")) ?? undefined;
    const { requests: list } = await studioFeedbackApi.list(apiKey, storedEmail);
    setRequests(list);
  }, [apiKey, projectId]);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(projectId, "email"));
    if (stored) setEmail(stored);
    load().catch(() => setRequests([]));
  }, [load, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (email) localStorage.setItem(storageKey(projectId, "email"), email);
      await studioFeedbackApi.submit(apiKey, {
        title,
        description,
        requestType,
        submitterEmail: email || undefined,
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div>
        <h2 className="text-lg font-bold text-[var(--color-landing-text)]">
          {productName ? `Feedback for ${productName}` : "Send feedback"}
        </h2>
        <p className="mt-1 text-sm text-landing-muted">
          AI triages your request, tracks status, and ships approved features to the repo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Your email (optional — to track your requests)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Type</span>
          <select
            className="app-field w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as "feature" | "bug")}
          >
            <option value="feature">Feature</option>
            <option value="bug">Bug</option>
          </select>
        </label>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        <Textarea
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={10}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={busy || title.length < 3 || description.length < 10}>
          {busy ? "AI is reviewing…" : "Submit for AI review"}
        </Button>
      </form>

      {requests.length > 0 && (
        <ul className="space-y-3 border-t border-[var(--color-landing-border)] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-landing-muted">Your requests</p>
          {requests.map((req) => (
            <li key={req.id} className="rounded-xl border border-[var(--color-landing-border)] p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{req.title}</span>
                <span className="shrink-0 rounded-full bg-[var(--color-landing-accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-landing-accent)]">
                  {FEATURE_REQUEST_STATUS_LABELS[req.status]}
                </span>
              </div>
              {req.aiFeedback && <p className="mt-2 text-xs text-landing-muted">{req.aiFeedback}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
