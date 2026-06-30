import { useState } from "react";
import {
  copyInviteLink,
  formReminderWhatsAppUrl,
  isLocalInviteUrl,
  mailtoInviteUrl,
  supplierInviteWhatsAppUrl,
  type SupplierInviteShareInput,
} from "../lib/whatsapp";
import { WhatsAppIcon } from "./WhatsAppIcon";

type Props = {
  share: SupplierInviteShareInput;
  phone?: string | null;
  compact?: boolean;
  emailSent?: boolean;
  showUrl?: boolean;
};

export function InviteShareActions({
  share,
  phone,
  compact = false,
  emailSent = true,
  showUrl = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const isLocal = isLocalInviteUrl(share.inviteUrl);
  const mailto = mailtoInviteUrl(share);

  const copyLink = async () => {
    await copyInviteLink(share.inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const btnClass = compact
    ? "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5"
    : "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5";

  return (
    <div className={compact ? "space-y-2" : "mt-3 space-y-3"}>
      {!emailSent && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Email not sent — add <code className="font-mono">RESEND_API_KEY</code> in{" "}
          <code className="font-mono">apps/api/.dev.vars</code>, or use WhatsApp / email app below.
        </p>
      )}

      {isLocal && (
        <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          Local dev link — works on this computer only. Open the link in a new tab here to test, or deploy to share with suppliers on other devices.
        </p>
      )}

      {showUrl && (
        <p className="break-all font-mono text-xs text-[var(--color-ink-muted)]">{share.inviteUrl}</p>
      )}

      <div className={`flex flex-wrap gap-2 ${compact ? "" : ""}`}>
        <button
          type="button"
          onClick={copyLink}
          className={`${btnClass} border-[var(--color-border)] bg-white/5 text-[var(--color-ink)] hover:bg-white/10`}
          title="Copy invite link"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>

        <a
          href={supplierInviteWhatsAppUrl(share, phone)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnClass} border-emerald-500/35 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25`}
          title={phone ? "Open WhatsApp chat with pre-filled invite" : "Open WhatsApp to pick a contact"}
        >
          <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {phone ? "WhatsApp to supplier" : "WhatsApp share"}
        </a>

        {mailto && !emailSent && (
          <a
            href={mailto}
            className={`${btnClass} border-[var(--color-border)] bg-white/5 text-[var(--color-ink)] hover:bg-white/10`}
            title="Open your email app with a pre-filled invite"
          >
            Email app
          </a>
        )}

        <a
          href={formReminderWhatsAppUrl(share, phone)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnClass} border-[var(--color-border)] bg-white/5 text-[var(--color-ink-muted)] hover:bg-white/10 hover:text-[var(--color-ink)]`}
          title="Send form-fill reminder on WhatsApp"
        >
          <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          Reminder
        </a>
      </div>
    </div>
  );
}
