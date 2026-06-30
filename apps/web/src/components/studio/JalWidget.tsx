import { useState } from "react";
import { JalLogo } from "../JalLogo";
import { JAL_NAME } from "../../lib/jal-brand";
import { StudioFeedbackPanel } from "./StudioFeedbackPanel";
import { storageKey } from "../../lib/studio-api";

type Props = {
  projectId: string;
  apiKey: string;
  productName?: string;
  placement?: "bottom-right" | "bottom-left";
};

export function JalWidget({ projectId, apiKey, productName, placement = "bottom-right" }: Props) {
  const [open, setOpen] = useState(false);
  const pos = placement === "bottom-left" ? "left-6" : "right-6";

  if (!apiKey) return null;

  localStorage.setItem(storageKey(projectId, "apiKey"), apiKey);

  return (
    <>
      {open && (
        <div
          className={`fixed bottom-24 ${pos} z-[9998] w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-[var(--color-landing-border)] bg-[var(--color-landing-surface)] shadow-2xl`}
          role="dialog"
          aria-label={`${JAL_NAME} feedback`}
        >
          <div className="flex items-center justify-between border-b border-[var(--color-landing-border)] px-4 py-3">
            <JalLogo size={24} showWordmark showTagline={false} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-sm text-landing-muted hover:bg-[var(--color-landing-elevated)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="max-h-[min(70vh,520px)] overflow-y-auto p-4">
            <StudioFeedbackPanel projectId={projectId} apiKey={apiKey} productName={productName} compact />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 ${pos} z-[9999] flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-landing-border)] bg-[var(--color-landing-accent)] shadow-lg transition hover:scale-105`}
        aria-label={open ? `Close ${JAL_NAME} feedback` : `Open ${JAL_NAME} feedback`}
        title={`Feedback powered by ${JAL_NAME}`}
      >
        <JalLogo size={28} variant="dark" showWordmark={false} iconStyle="badge" />
      </button>
    </>
  );
}
