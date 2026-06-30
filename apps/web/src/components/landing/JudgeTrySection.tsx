import { Link } from "react-router-dom";
import {
  JAL_STUDIO_TRY_IDEAS,
  VENDO_DEMO_TRY_IDEAS,
  judgeTryToStudioDraft,
  judgeTryToVendoDraft,
  saveJudgeTryDraft,
  type JudgeTryIdea,
} from "../../lib/judge-try";
import { JAL_STUDIO } from "../../lib/jal-brand";
import { googleAuthStartUrl, GoogleIcon } from "../../lib/google-auth";
import { SectionHeading } from "../ui/SectionHeading";

function IdeaCard({ idea, onTry }: { idea: JudgeTryIdea; onTry: () => void }) {
  return (
    <button
      type="button"
      onClick={onTry}
      className="judge-try-card w-full rounded-xl border border-[var(--color-landing-border)] bg-[var(--color-landing-surface)] p-4 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--color-landing-accent)]">{idea.tag}</span>
        <span className="text-xs text-landing-muted">{idea.seconds}</span>
      </div>
      <p className="mt-2 text-sm font-medium">{idea.title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-landing-muted">{idea.description}</p>
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
    <section id="try" className="jal-section">
      <div className="jal-container">
        <SectionHeading
          label="Try it"
          title="Under two minutes."
          subtitle="Pick an idea — we pre-fill the form so you can submit and watch AI triage instantly."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-[var(--color-landing-accent)]">{JAL_STUDIO}</p>
            <p className="mt-1 text-lg font-semibold">Your repo, your product</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {JAL_STUDIO_TRY_IDEAS.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onTry={() => tryStudio(idea)} />
              ))}
            </div>
            <Link to="/studio/onboard" className="jal-link jal-link-chevron mt-6 inline-block">
              Open Studio
            </Link>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-landing-accent)]">Vendo demo</p>
            <p className="mt-1 text-lg font-semibold">Procurement reference app</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {VENDO_DEMO_TRY_IDEAS.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onTry={() => tryVendo(idea)} />
              ))}
            </div>
            <a
              href={googleAuthStartUrl({ redirect: "/dashboard?tab=feedback" })}
              className="btn-secondary-outline mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <GoogleIcon size={16} /> Sign in blank
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
