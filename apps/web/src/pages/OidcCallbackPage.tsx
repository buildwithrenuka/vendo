import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Shell } from "../components/ui";

const OIDC_CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID ?? "vendo";
const OIDC_CLIENT_SECRET = import.meta.env.VITE_OIDC_CLIENT_SECRET ?? "vendo_secret";
const OIDC_ISSUER = import.meta.env.VITE_OIDC_ISSUER ?? "";

const SS = {
  invite: "vendo_invite",
  redirect: "vendo_redirect",
  state: "vendo_oidc_state",
  legacyInvite: "vinmaya_invite",
  legacyRedirect: "vinmaya_redirect",
  legacyState: "vinmaya_oidc_state",
};

function readSession(key: string, legacyKey: string): string | undefined {
  return sessionStorage.getItem(key) ?? sessionStorage.getItem(legacyKey) ?? undefined;
}

/** Poll-Seeker OIDCCallback pattern — exchange code with SeekID, then Vendo session */
export function OidcCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [status, setStatus] = useState("Logging you in via SeekID…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const invite = readSession(SS.invite, SS.legacyInvite);
    const redirect = readSession(SS.redirect, SS.legacyRedirect) ?? "/dashboard";

    if (!code) {
      setError("No authorization code found.");
      return;
    }

    (async () => {
      try {
        setStatus("Exchanging authorization code…");
        const redirectUri = `${window.location.origin}/callback`;

        if (OIDC_ISSUER) {
          const tokenRes = await fetch(`${OIDC_ISSUER.replace(/\/$/, "")}/oidc/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
              client_id: OIDC_CLIENT_ID,
              client_secret: OIDC_CLIENT_SECRET,
            }),
          });

          if (!tokenRes.ok) {
            const err = await tokenRes.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error ?? "Token exchange failed");
          }

          const tokens = (await tokenRes.json()) as { access_token: string };
          setStatus("Creating your Vendo session…");
          await api.oidcExchange({ oidcToken: tokens.access_token, invite });
        } else {
          await api.oidcExchange({ code, invite });
        }

        [SS.invite, SS.redirect, SS.legacyInvite, SS.legacyRedirect].forEach((k) =>
          sessionStorage.removeItem(k),
        );
        await refresh();
        navigate(redirect, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    })();
  }, [params, navigate, refresh]);

  return (
    <Shell title={error ? "Login failed" : "Signing in"} subtitle={error ?? status}>
      {error ? (
        <Button onClick={() => navigate("/login")}>Back to login</Button>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">Securely completing SeekID sign-in…</p>
      )}
    </Shell>
  );
}

export function startSeekIdLogin(options?: { invite?: string; redirect?: string }) {
  if (options?.invite) sessionStorage.setItem(SS.invite, options.invite);
  if (options?.redirect) sessionStorage.setItem(SS.redirect, options.redirect ?? "/dashboard");

  if (OIDC_ISSUER) {
    const state = crypto.randomUUID();
    sessionStorage.setItem(SS.state, state);
    const url = new URL(`${OIDC_ISSUER.replace(/\/$/, "")}/oidc/auth`);
    url.searchParams.set("client_id", OIDC_CLIENT_ID);
    url.searchParams.set("redirect_uri", `${window.location.origin}/callback`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    window.location.href = url.toString();
    return;
  }

  window.location.href = `/api/auth/seekid?invite=${options?.invite ?? ""}&redirect=${encodeURIComponent(options?.redirect ?? "/dashboard")}`;
}
