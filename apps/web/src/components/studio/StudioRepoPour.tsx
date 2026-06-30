import type { JalRepoScanResult } from "@vendo/shared";
import { GitHubIcon } from "./StudioUI";

type Props = {
  repo: string;
  scan: JalRepoScanResult;
};

/** Repo attach success — liquid fills the container */
export function StudioRepoPour({ repo, scan }: Props) {
  return (
    <div className="studio-pour-scene">
      <div className="studio-pour-vessel">
        <div className="studio-pour-liquid" />
        <div className="studio-pour-shine" aria-hidden />
        <div className="studio-pour-content">
          <GitHubIcon className="mx-auto h-10 w-10 text-[var(--color-landing-accent)]" />
          <p className="mt-3 font-mono text-sm font-bold text-[var(--color-landing-text)]">{repo}</p>
          <p className="mt-1 text-xs text-landing-muted">Context absorbed</p>
        </div>
      </div>
      <div className="studio-pour-orbit mt-8">
        {scan.detectedStack.slice(0, 6).map((tag, i) => (
          <span
            key={tag}
            className="studio-pour-tag"
            style={{ animationDelay: `${0.2 + i * 0.12}s` }}
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-6 text-center text-sm font-semibold text-[var(--color-landing-text)]">{scan.productName}</p>
      <p className="mx-auto mt-2 max-w-lg text-center text-xs leading-relaxed text-landing-muted">{scan.productContext}</p>
    </div>
  );
}
