import { Link } from "react-router-dom";
import type { JalProjectPublic } from "@vendo/shared";
import { JalLogo } from "../JalLogo";
import { GitHubIcon } from "./StudioUI";

type Props = {
  projects: JalProjectPublic[];
};

export function StudioNexus({ projects }: Props) {
  return (
    <div className="studio-nexus">
      <div className="studio-nexus-core" aria-hidden>
        <div className="studio-nexus-ring studio-nexus-ring-1" />
        <div className="studio-nexus-ring studio-nexus-ring-2" />
        <div className="studio-nexus-ring studio-nexus-ring-3" />
        <div className="studio-nexus-orb">
          <JalLogo size={48} showWordmark={false} animated />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="studio-nexus-empty animate-fade-up">
          <p className="section-label">The feedback river</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Customer feedback flows in.
            <br />
            <span className="text-genZ">Merged PRs flow out.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-landing-muted">
            No other tool shows your product as a living river — attach a repo, watch requests become droplets,
            ship them downstream to GitHub.
          </p>
          <Link to="/studio/onboard" className="btn-primary mt-8 inline-flex rounded-xl px-8 py-3.5 text-sm font-bold">
            Pour your first repo →
          </Link>
        </div>
      ) : (
        <ul className="studio-nexus-orbit">
          {projects.map((p, i) => (
            <li
              key={p.id}
              className="studio-nexus-card landing-card-hover"
              style={{ "--orbit-i": i, "--orbit-n": projects.length } as React.CSSProperties}
            >
              <div className="studio-nexus-card-inner">
                <div className="flex items-center gap-3">
                  <div className="studio-project-icon shrink-0">
                    <GitHubIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{p.name}</h3>
                    <p className="truncate font-mono text-xs text-[var(--color-landing-accent)]">{p.githubRepo}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to={`/studio/projects/${p.id}`} className="btn-primary flex-1 rounded-lg py-2 text-center text-xs font-bold">
                    River
                  </Link>
                  <Link to={`/studio/projects/${p.id}/embed`} className="btn-secondary rounded-lg px-3 py-2 text-xs font-bold">
                    Widget
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
