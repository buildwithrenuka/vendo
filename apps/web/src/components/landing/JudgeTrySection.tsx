import { Link } from "react-router-dom";
import {
  JAL_STUDIO_TRY_IDEAS,
  VENDO_DEMO_TRY_IDEAS,
  judgeTryToStudioDraft,
  judgeTryToVendoDraft,
  saveJudgeTryDraft,
  type JudgeTryIdea,
} from "../../lib/judge-try";
import { googleAuthStartUrl, GoogleIcon } from "../../lib/google-auth";

function IdeaCard({
  idea,
  onTry,
}: {
  idea: JudgeTryIdea;
  onTry: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTry}
      className="judge-try-card group w-full rounded-xl border border-[var(--color-landing-border)] bg-[var(--color-landing-surface)] p-4 text-left transition hover:border-[var(--jal-phosphor)]/40 hover:bg-[rgba(var(--jal-phosphor-rgb),0.06)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-[rgba(var(--jal-phosphor-rgb),0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--jal-phosphor)]">
          {idea.tag}
        </span>
        <span className="shrink-0 text-[10px] font-medium text-landing-muted">{idea.seconds}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-[var(--color-landing-text)] group-hover:text-[var(--jal-phosphor)]">
        {idea.title}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-landing-muted">{idea.description}</p>
      <p className="mt-3 text-xs font-semibold text-[var(--jal-coral)]">Try this →</p>
    </button>
  );
}

export function JudgeTrySection() {
  const tryVendo = (idea: JudgeTryIdea) => {
    saveJudgeTryDraft(judgeTryToVendoDraft(idea));
    window.location.href = googleAuthStartUrl({ redirect: "/dashboard?tab=feedback&try=1" });
  };

  const tryStudio = (idea: JudgeTryIdea) => {
    saveJudgeTryDraft(judgeTryToStudioDraft(idea));
    window.location.href = "/studio/onboard?try=1";
  };

  return (
    <section id="try" className="landing-section-alt px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="section-label">For judges & evaluators</p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Try Jal & Vendo in under 2 minutes</h2>
        <p className="mt-4 max-w-2xl text-landing-muted">
          <strong className="text-[var(--color-landing-text)]">Jal</strong> is the product — Feedback River, Studio, widget, npm.
          {" "}
          <strong className="text-[var(--color-landing-text)]">Vendo</strong> is the live demo app (procurement) proving the same pipeline on a real product.
          Pick a feature idea — we pre-fill the form so you can submit and watch AI triage instantly.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="landing-card rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--jal-phosphor)]">Jal Studio</p>
                <h3 className="mt-1 text-lg font-bold">Attach your repo · your product</h3>
              </div>
              <Link to="/studio/onboard" className="btn-secondary shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold">
                Open Studio
              </Link>
            </div>
            <p className="mt-2 text-sm text-landing-muted">
              Sign in → paste GitHub repo → submit feedback → see it on the river → AI build → PR.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {JAL_STUDIO_TRY_IDEAS.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onTry={() => tryStudio(idea)} />
              ))}
            </div>
          </div>

          <div className="landing-card rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--jal-coral)]">Vendo demo</p>
                <h3 className="mt-1 text-lg font-bold">Real procurement app · buyer + dev queue</h3>
              </div>
              <Link to="/internal/login" className="btn-secondary shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold">
                Dev queue
              </Link>
            </div>
            <p className="mt-2 text-sm text-landing-muted">
              Sign in as buyer → Feedback tab → AI assesses fit for suppliers, GST, invites. Internal queue ships PRs.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {VENDO_DEMO_TRY_IDEAS.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onTry={() => tryVendo(idea)} />
              ))}
            </div>
            <a
              href={googleAuthStartUrl({ redirect: "/dashboard?tab=feedback" })}
              className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold sm:w-auto sm:px-6"
            >
              <GoogleIcon size={16} /> Or sign in blank — submit your own idea
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-landing-muted">
          Fast path: homepage <a href="#river" className="text-[var(--jal-phosphor)] underline">#river</a>
          {" · "}
          <Link to="/docs/get-started" className="text-[var(--jal-phosphor)] underline">docs</Link>
          {" · "}
          <Link to="/internal/login" className="text-[var(--jal-phosphor)] underline">Vendo internal</Link>
        </p>
      </div>
    </section>
  );
}
