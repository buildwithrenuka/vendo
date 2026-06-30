import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { JalLogo } from "../JalLogo";
import { HypnoticCursor } from "./HypnoticCursor";
import { HypnoticPortal } from "./HypnoticPortal";
import { JAL_HERO_HEADLINE, JAL_HERO_HEADLINE_ACCENT, JAL_TAGLINE } from "../../lib/jal-brand";

export function HypnoticHero() {
  const { theme } = useTheme();

  return (
    <section className="hypno-hero">
      <HypnoticCursor />
      <div className="hypno-noise" aria-hidden />
      <div className="hypno-hero-bg" aria-hidden />

      <div className="hypno-hero-stage">
        <HypnoticPortal />
      </div>

      <div className="hypno-hero-content animate-fade-up">
        <p className="hypno-badge">
          <JalLogo size={20} variant={theme === "light" ? "light" : "dark"} showWordmark={false} />
          <span>{JAL_TAGLINE}</span>
          <span className="hypno-live">LIVE</span>
        </p>

        <h1 className="hypno-title">
          {JAL_HERO_HEADLINE}
          <br />
          <span className="hypno-title-accent">{JAL_HERO_HEADLINE_ACCENT}</span>
        </h1>

        <p className="hypno-sub">
          Not tickets. Not kanban. A <strong>living river</strong> of feedback — droplets flow in, merged PRs flow out.
        </p>

        <div className="hypno-cta-row">
          <Link to="/studio/onboard" className="hypno-cta-primary btn-primary">
            Enter the river — free
          </Link>
          <a href="#river" className="hypno-cta-secondary btn-secondary">
            What is this?
          </a>
        </div>

        <p className="hypno-footnote">No credit card · Attach repo in 60 seconds</p>
      </div>

      <a href="#river" className="hypno-scroll-cue" aria-label="Scroll to Feedback River">
        <span className="hypno-scroll-line" />
        <span className="hypno-scroll-text">scroll</span>
      </a>
    </section>
  );
}
