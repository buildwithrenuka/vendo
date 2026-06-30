import { Link } from "react-router-dom";
import { GoogleIcon, googleAuthStartUrl } from "../lib/google-auth";
import { startSeekIdLogin } from "./OidcCallbackPage";
import { Button } from "../components/ui";
import { LandingNav } from "../components/landing/LandingNav";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

function DevLogin({ invite }: { invite?: string }) {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="mt-4 border-t border-[var(--color-landing-border)] pt-4">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-landing-muted">dev login</p>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" type="button" onClick={async () => {
          await api.devLogin({ email: "buyer@acme.com", name: "Acme Buyer", role: "buyer" });
          await refresh();
          navigate("/dashboard");
        }}>Dev: buyer</Button>
        <Button variant="secondary" type="button" onClick={async () => {
          await api.devLogin({ email: "supplier@vendor.com", name: "Vendor Co", role: "supplier", invite });
          await refresh();
          navigate("/dashboard");
        }}>Dev: supplier</Button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [params] = useSearchParams();
  const invite = params.get("invite") ?? undefined;
  const error = params.get("error");
  const redirect = "/dashboard";

  return (
    <div className="relative min-h-screen mesh-hero bg-[var(--color-landing-bg)] text-[var(--color-landing-text)]">
      <div className="landing-grid pointer-events-none fixed inset-0" />
      <LandingNav />
      <main className="relative mx-auto flex max-w-md flex-col px-6 pb-16 pt-28">
        <Link to="/" className="mb-8 font-mono text-xs uppercase tracking-wide text-landing-muted transition hover:text-[var(--color-landing-accent)]">
          ← back
        </Link>

        <div className="landing-card rounded-2xl p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">sign in</h1>
          <p className="mt-1 text-sm text-landing-muted">
            one flow — invite link auto-assigns supplier role.
          </p>

          <div className="mt-6 space-y-3">
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {decodeURIComponent(error.replace(/\+/g, " "))}
              </div>
            )}

            <a
              href={googleAuthStartUrl({ invite, redirect })}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold"
            >
              <GoogleIcon size={20} />
              Continue with Google
            </a>

            <button
              type="button"
              onClick={() => startSeekIdLogin({ invite, redirect })}
              className="btn-secondary inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold"
            >
              Continue with SeekID
            </button>

            <DevLogin invite={invite} />
          </div>
        </div>
      </main>
    </div>
  );
}
