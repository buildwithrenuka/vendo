/** Poll-Seeker-style WhatsApp deep links (wa.me) for supplier invites. */

export type SupplierInviteShareInput = {
  buyerName: string;
  inviteUrl: string;
  expiresAt?: string;
  supplierEmail?: string;
};

function formatExpiry(expiresAt?: string): string | null {
  if (!expiresAt) return null;
  return new Date(expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildSupplierInviteMessage(input: SupplierInviteShareInput): string {
  const buyer = input.buyerName.trim() || "A buyer";
  const expiry = formatExpiry(input.expiresAt);
  const greeting = input.supplierEmail ? "Hi,\n\n" : "";
  const expiryLine = expiry ? `\n\nThis link is valid until *${expiry}*.` : "";

  return `${greeting}📋 *${buyer}* has invited you to complete supplier onboarding on Vendo.

Fill out the form here:
${input.inviteUrl}${expiryLine}

— Sent via Vendo`;
}

export function buildFormReminderMessage(input: SupplierInviteShareInput): string {
  const buyer = input.buyerName.trim() || "A buyer";
  const expiry = formatExpiry(input.expiresAt);
  const expiryLine = expiry ? `\nThis link is valid until *${expiry}*.` : "";

  return `🔔 Reminder from *${buyer}*

Your supplier onboarding form is still pending. It takes about 2 minutes to complete:

${input.inviteUrl}
${expiryLine}

— Vendo`;
}

/** Normalize phone to wa.me digits (defaults +91 for 10-digit Indian numbers). */
export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function whatsappShareUrl(message: string, phone?: string | null): string {
  const text = encodeURIComponent(message);
  if (phone?.trim()) {
    return `https://wa.me/${normalizeWhatsAppPhone(phone)}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

export function supplierInviteWhatsAppUrl(input: SupplierInviteShareInput, phone?: string | null): string {
  return whatsappShareUrl(buildSupplierInviteMessage(input), phone);
}

export function formReminderWhatsAppUrl(input: SupplierInviteShareInput, phone?: string | null): string {
  return whatsappShareUrl(buildFormReminderMessage(input), phone);
}

export async function copyInviteLink(inviteUrl: string): Promise<void> {
  await navigator.clipboard.writeText(inviteUrl);
}

export function isLocalInviteUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function mailtoInviteUrl(input: SupplierInviteShareInput): string | null {
  if (!input.supplierEmail) return null;
  const subject = encodeURIComponent(`${input.buyerName} invited you to Vendo`);
  const body = encodeURIComponent(buildSupplierInviteMessage(input));
  return `mailto:${input.supplierEmail}?subject=${subject}&body=${body}`;
}
