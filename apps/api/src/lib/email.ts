export interface SendInviteEmailInput {
  to: string;
  buyerName: string;
  inviteUrl: string;
  expiresAt: string;
}

export type SendEmailResult = {
  sent: boolean;
  emailError?: string;
};

export type SendInviteEmailResult = SendEmailResult & {
  inviteUrl: string;
};

function formatFrom(fromEmail: string): string {
  return fromEmail.includes("<") ? fromEmail : `Jal <${fromEmail}>`;
}

function friendlyResendError(message: string): string {
  if (message.includes("domain is not verified")) {
    return "Sender domain not verified in Resend. For local dev use FROM_EMAIL=onboarding@resend.dev in apps/api/.dev.vars.";
  }
  if (message.includes("only send testing emails to your own email")) {
    return "Resend test mode: you can only send to the email address on your Resend account.";
  }
  return message.slice(0, 220);
}

async function sendResendEmail(
  apiKey: string,
  fromEmail: string,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: formatFrom(fromEmail),
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error: ${response.status} ${body}`);
  }
}

export async function sendEmailOrLog(
  apiKey: string | undefined,
  fromEmail: string,
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  if (!apiKey) {
    console.log("[dev] Email skipped — set RESEND_API_KEY. To:", to, "Subject:", subject);
    return { sent: false };
  }

  try {
    await sendResendEmail(apiKey, fromEmail, to, subject, html);
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed";
    console.error("[email] Send failed:", message);
    return { sent: false, emailError: friendlyResendError(message) };
  }
}

export async function sendInviteEmail(
  apiKey: string,
  fromEmail: string,
  input: SendInviteEmailInput,
): Promise<void> {
  const expiresDate = new Date(input.expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await sendResendEmail(
    apiKey,
    fromEmail,
    input.to,
    `${input.buyerName} invited you to join Vendo`,
    `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2>You've been invited to onboard as a supplier</h2>
        <p><strong>${input.buyerName}</strong> has invited you to complete supplier onboarding on Vendo.</p>
        <p><a href="${input.inviteUrl}" style="display:inline-block;padding:12px 24px;background:#c17f3a;color:#fff;text-decoration:none;border-radius:8px;">Accept invite & sign in</a></p>
        <p style="color:#666;font-size:14px;">This link expires on ${expiresDate}.</p>
      </div>
    `,
  );
}

export async function sendInviteEmailOrLog(
  apiKey: string | undefined,
  fromEmail: string,
  input: SendInviteEmailInput,
): Promise<SendInviteEmailResult> {
  if (!apiKey) {
    console.log("[dev] Invite email skipped — set RESEND_API_KEY. Invite URL:", input.inviteUrl);
    return { sent: false, inviteUrl: input.inviteUrl };
  }

  try {
    await sendInviteEmail(apiKey, fromEmail, input);
    return { sent: true, inviteUrl: input.inviteUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed";
    console.error("[email] Invite send failed:", message);
    return {
      sent: false,
      inviteUrl: input.inviteUrl,
      emailError: friendlyResendError(message),
    };
  }
}

export async function sendSubmissionReviewEmailOrLog(
  apiKey: string | undefined,
  fromEmail: string,
  input: {
    to: string;
    supplierName?: string | null;
    buyerName: string;
    action: "approve" | "reject";
    appUrl: string;
    notes?: string;
  },
): Promise<SendEmailResult> {
  const greeting = input.supplierName?.trim() || "there";
  const dashboardUrl = `${input.appUrl.replace(/\/$/, "")}/supplier/onboarding`;

  if (input.action === "approve") {
    return sendEmailOrLog(
      apiKey,
      fromEmail,
      input.to,
      `${input.buyerName} approved your supplier onboarding`,
      `
        <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2>You're approved</h2>
          <p>Hi ${greeting},</p>
          <p><strong>${input.buyerName}</strong> has approved your supplier onboarding on Vendo.</p>
          <p>You can view your status anytime:</p>
          <p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#c17f3a;color:#fff;text-decoration:none;border-radius:8px;">Open onboarding dashboard</a></p>
        </div>
      `,
    );
  }

  const notesBlock = input.notes?.trim()
    ? `<p style="color:#666;font-size:14px;"><strong>Note from buyer:</strong> ${input.notes}</p>`
    : "";

  return sendEmailOrLog(
    apiKey,
    fromEmail,
    input.to,
    `${input.buyerName} — update needed on your onboarding`,
    `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2>Submission not approved</h2>
        <p>Hi ${greeting},</p>
        <p><strong>${input.buyerName}</strong> reviewed your onboarding submission and asked for updates.</p>
        ${notesBlock}
        <p>Please sign in, update your form, and submit again:</p>
        <p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#c17f3a;color:#fff;text-decoration:none;border-radius:8px;">Update submission</a></p>
      </div>
    `,
  );
}

export async function sendFeatureShippedEmailOrLog(
  apiKey: string | undefined,
  fromEmail: string,
  input: {
    to: string;
    customerName?: string | null;
    title: string;
    requestType: "feature" | "bug";
    appUrl: string;
  },
): Promise<SendEmailResult> {
  const greeting = input.customerName?.trim() || "there";
  const feedbackUrl = `${input.appUrl.replace(/\/$/, "")}/dashboard?tab=feedback`;
  const isBug = input.requestType === "bug";

  const subject = isBug
    ? `Fixed: ${input.title}`
    : `Shipped: ${input.title} is now live on Vendo`;

  const headline = isBug ? "Your bug report has been fixed" : "Your feature request is live";
  const bodyLine = isBug
    ? `We've shipped a fix for the issue you reported: <strong>${input.title}</strong>.`
    : `Great news — we shipped your feature request: <strong>${input.title}</strong>. It's now available in your workspace.`;

  return sendEmailOrLog(
    apiKey,
    fromEmail,
    input.to,
    subject,
    `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2>${headline}</h2>
        <p>Hi ${greeting},</p>
        <p>${bodyLine}</p>
        <p>Track all your feedback and see what's in progress anytime:</p>
        <p><a href="${feedbackUrl}" style="display:inline-block;padding:12px 24px;background:#c17f3a;color:#fff;text-decoration:none;border-radius:8px;">Open Feedback dashboard</a></p>
        <p style="color:#666;font-size:14px;">Thank you for helping us improve Vendo.</p>
      </div>
    `,
  );
}
