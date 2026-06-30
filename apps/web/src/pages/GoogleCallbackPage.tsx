import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Shell } from "../components/ui";

/** magic-secretary style — Google redirects here (APP_URL/auth/google/callback) */
export function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [status, setStatus] = useState("Completing Google sign-in…");
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(oauthError === "access_denied" ? "Google access was declined" : oauthError);
      return;
    }

    if (!code || !state) {
      setError("Missing OAuth code or state.");
      return;
    }

    handledRef.current = true;

    (async () => {
      try {
        setStatus("Verifying your Google account…");
        const result = await api.googleCallback({ code, state });
        await refresh();
        navigate(result.redirect ?? "/dashboard", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      }
    })();
  }, [params, navigate, refresh]);

  return (
    <Shell title={error ? "Sign-in failed" : "Signing in with Google"} subtitle={error ?? status}>
      {error ? <Button onClick={() => navigate("/login")}>Back to login</Button> : null}
    </Shell>
  );
}
