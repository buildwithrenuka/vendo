import { Link } from "react-router-dom";
import { JAL_ONE_MORE_BODY, JAL_ONE_MORE_THING, JAL_POCKET_PITCH } from "../../lib/jal-brand";
import { Reveal } from "../ui/Reveal";

/** Classic keynote beat — the moment people remember. */
export function OneMoreThing() {
  return (
    <section id="one-more-thing" className="jal-one-more jal-section text-center">
      <Reveal className="jal-container-narrow mx-auto">
        <p className="jal-one-more-label">{JAL_ONE_MORE_THING}</p>
        <h2 className="mt-4 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight">
          {JAL_POCKET_PITCH}
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-landing-muted">{JAL_ONE_MORE_BODY}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/studio/onboard" className="btn-primary px-8 py-3">
            Attach your repo
          </Link>
          <a href="#try" className="jal-link jal-link-chevron">
            Try a demo idea
          </a>
        </div>
      </Reveal>
    </section>
  );
}
