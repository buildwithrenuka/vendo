import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { GoogleIcon, googleAuthStartUrl } from "../lib/google-auth";
import { startSeekIdLogin } from "./OidcCallbackPage";
import { Button, Card, Shell } from "../components/ui";

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<{ email?: string; buyerName?: string; valid: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    api.validateInvite(token)
      .then(setInvite)
      .catch(() => setInvite({ valid: false, error: "Invalid invite" }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Shell title="Checking invite…" />;

  if (!invite?.valid) {
    return (
      <Shell title="Invite unavailable">
        <Card className="max-w-lg">
          <p className="text-[var(--color-ink-muted)]">{invite?.error ?? "This invite link has expired or was already used."}</p>
          <Button className="mt-4" onClick={() => navigate("/login")}>Go to sign in</Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell title={`${invite.buyerName} invited you`} subtitle="Complete onboarding as a supplier">
      <Card className="max-w-lg space-y-4">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Sign in with <strong>{invite.email}</strong> to accept this invite and start supplier onboarding.
        </p>
        <a
          href={googleAuthStartUrl({ invite: token, redirect: "/supplier/onboarding" })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-landing-btn-primary-bg)] px-4 py-3 text-sm font-medium text-[var(--color-landing-btn-primary-text)] transition hover:bg-[var(--color-landing-btn-primary-hover)]"
        >
          <GoogleIcon size={18} />
          Accept invite with Google
        </a>
        <Button className="w-full" variant="secondary" onClick={() => startSeekIdLogin({ invite: token, redirect: "/supplier/onboarding" })}>
          Accept invite with SeekID
        </Button>
        {import.meta.env.DEV && (
          <Button className="w-full" variant="secondary" onClick={async () => {
            await api.devLogin({ email: invite.email!, name: "Invited Supplier", invite: token });
            await refresh();
            navigate("/supplier/onboarding");
          }}>
            Dev: Accept invite
          </Button>
        )}
        <p className="text-xs text-[var(--color-ink-muted)]">
          Already signed in? <Link className="text-[var(--color-landing-accent)] underline" to="/dashboard">Go to dashboard</Link>
        </p>
      </Card>
    </Shell>
  );
}
