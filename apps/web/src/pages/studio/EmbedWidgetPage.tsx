import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { StudioFeedbackPanel } from "../../components/studio/StudioFeedbackPanel";
import { JalLogo } from "../../components/JalLogo";
import { storageKey } from "../../lib/studio-api";

export function EmbedWidgetPage() {
  const { projectId = "" } = useParams();
  const [search] = useSearchParams();
  const [meta, setMeta] = useState<{ name: string; productName: string } | null>(null);
  const apiKey = search.get("key") ?? localStorage.getItem(storageKey(projectId, "apiKey")) ?? "";

  useEffect(() => {
    api.studioPublicProject(projectId)
      .then((p) => setMeta({ name: p.name, productName: p.productName }))
      .catch(() => setMeta({ name: "App", productName: "App" }));
    if (search.get("key")) {
      localStorage.setItem(storageKey(projectId, "apiKey"), search.get("key")!);
    }
  }, [projectId, search]);

  if (!apiKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-landing-bg)] p-6 text-center">
        <p className="text-sm text-landing-muted">Missing API key — open from Studio embed settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-landing-bg)] text-[var(--color-landing-text)]">
      <header className="border-b border-[var(--color-landing-border)] px-6 py-4">
        <JalLogo size={28} showWordmark showTagline={false} />
        <p className="mt-1 text-xs text-landing-muted">Powered by Jal · {meta?.productName}</p>
      </header>
      <main className="mx-auto max-w-lg px-6 py-8">
        <StudioFeedbackPanel projectId={projectId} apiKey={apiKey} productName={meta?.productName} />
      </main>
    </div>
  );
}
