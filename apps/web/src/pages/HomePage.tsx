import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FlowRiverHero } from "../components/landing/FlowRiverHero";
import { FeedbackRiverShowcase } from "../components/landing/FeedbackRiverShowcase";
import { ShapeShiftProfiles } from "../components/landing/ShapeShiftProfiles";
import { LandingNav } from "../components/landing/LandingNav";
import { JudgeTrySection } from "../components/landing/JudgeTrySection";
import { OneMoreThing } from "../components/landing/OneMoreThing";
import { JalLogo } from "../components/JalLogo";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Reveal } from "../components/ui/Reveal";
import { GoogleIcon, googleAuthStartUrl } from "../lib/google-auth";
import { JAL_TAGLINE, JAL_TAGLINE_LONG, JAL_HERO_LINE1, JAL_HERO_LINE2, JAL_HERO_SUB, JAL_MANIFESTO, JAL_NAME, JAL_STUDIO, JAL_NPM } from "../lib/jal-brand";

const GITHUB_URL = "https://github.com/buildwithrenuka/vendo";
const NPM_URL = "https://www.npmjs.com/package/@jal_ai/jal";
const NPM_INSTALL = "npm install @jal_ai/jal";

const features = [
  {
    eyebrow: "Attach",
    title: "Your repo. Your context.",
    body: `Paste owner/repo in Studio. ${JAL_NAME} reads README, package.json, and your tree — then locks product context for every triage and build.`,
    code: "github.com/your-org/your-app",
    reverse: false,
  },
  {
    eyebrow: "Widget",
    title: "Customers submit. You ship.",
    body: "Drop one component in your app. Users see a floating icon, submit ideas, and track status — without ever seeing your dev queue.",
    code: '<JalWidget projectId="…" apiKey="jal_live_…" />',
    reverse: true,
  },
  {
    eyebrow: "Pipeline",
    title: "Triage to merge. Automatic.",
    body: "Inbox, AI triage, tasks, code builder, PR review, approve and merge — scoped to the repo you attached.",
    code: "Triage → Tasks → Build → PR → Merge",
    reverse: false,
  },
];

const pipelineSteps = [
  { title: "AI triage", desc: "Classify every request — planned, duplicate, out of scope, or needs clarification." },
  { title: "Tasks", desc: "Approved requests become structured assessments and concrete dev tasks." },
  { title: "AI build", desc: `${JAL_NAME} reads your repo, implements the change, and opens a GitHub PR.` },
  { title: "Review", desc: "PR diff validated against requirements — pass, fix, or escalate." },
  { title: "Merge", desc: "Human approves once. Full audit trail from feedback to ship." },
];

const pricingPlans = [
  {
    name: "Free trial",
    price: "$0",
    period: " to start",
    highlight: false,
    cta: "Try Studio",
    ctaHref: "/studio/onboard",
    primary: false,
    external: false,
    features: ["3 pipeline runs", "1 repo attach", "Customer widget", "AI triage"],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    highlight: true,
    badge: "Popular",
    cta: "Get started",
    ctaHref: "/studio/onboard",
    primary: true,
    external: false,
    features: ["Unlimited runs", "Multiple repos", "GitHub PR automation", "Studio + npm"],
  },
  {
    name: "Team",
    price: "Custom",
    period: "",
    highlight: false,
    cta: "Contact",
    ctaHref: "mailto:hello@jal.dev",
    primary: false,
    external: true,
    features: ["SSO and audit exports", "Custom context packs", "Dedicated support", "SLA"],
  },
];

const faqItems = [
  {
    q: "What happens when I attach a repo?",
    a: `${JAL_NAME} scans your GitHub repository, detects stack and product context, and uses it for every triage and AI build. Code lands in that repo as pull requests.`,
  },
  {
    q: "How does the widget work?",
    a: "After attach, you get an API key and a JalWidget component. Customers submit feedback and track status. They never see internal tools.",
  },
  {
    q: "Studio or npm?",
    a: "Studio for speed — connect repo, copy widget, ship. npm for embedding the engine in your own backend. Same pipeline either way.",
  },
  {
    q: "What is Vendo?",
    a: `A reference app showing ${JAL_NAME} on a real product — buyer feedback plus internal dev queue. Proof the pipeline works end-to-end.`,
  },
];

function FeatureVisual({ code }: { code: string }) {
  return (
    <div className="jal-device-frame">
      <div className="jal-device-chrome">
        <span className="jal-device-dot" />
        <span className="jal-device-dot" />
        <span className="jal-device-dot" />
      </div>
      <div className="p-6 sm:p-8">
        <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-[var(--color-landing-text)]">{code}</pre>
      </div>
    </div>
  );
}

export function HomePage() {
  const { theme } = useTheme();
  const logoVariant = theme === "light" ? "light" : "dark";

  return (
    <div className="min-h-screen bg-[var(--color-landing-bg)] text-[var(--color-landing-text)]">
      <LandingNav />

      {/* Hero — centered, Apple-style */}
      <section className="mesh-hero relative px-6 pb-20 pt-24 text-center lg:pb-24 lg:pt-28">
        <div className="jal-hero-motion jal-container-narrow mx-auto">
          <div className="flex justify-center">
            <JalLogo size={56} variant={logoVariant} iconStyle="badge" showWordmark={false} className="jal-hero-mark" />
          </div>
          <p className="jal-memorable-pill mt-8">{JAL_MANIFESTO}</p>
          <h1 className="jal-hero-headline mt-6">
            {JAL_HERO_LINE1}
            <br />
            <span className="jal-hero-accent">{JAL_HERO_LINE2}</span>
          </h1>
          <p className="jal-hero-sub mx-auto mt-6">{JAL_HERO_SUB}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link to="/studio/onboard" className="btn-primary px-7 py-3">
              Get started
            </Link>
            <a href="#river" className="jal-link jal-link-chevron">
              See how it works
            </a>
          </div>
        </div>
        <div className="jal-hero-device jal-container mx-auto mt-16 max-w-2xl">
          <FlowRiverHero />
        </div>
        <a href="#river" className="jal-scroll-cue" aria-label="Scroll to Feedback River">
          <span className="jal-scroll-cue-line" />
        </a>
      </section>

      {/* River */}
      <section id="river" className="landing-section-alt jal-section">
        <div className="jal-container">
          <Reveal>
            <SectionHeading
              label="Feedback River"
              title="One stream. Two lenses."
              subtitle="Customer view on the left. Ship console on the right. Same request — click any droplet to explore."
            />
          </Reveal>
          <Reveal delay={120} className="mt-12">
            <FeedbackRiverShowcase />
          </Reveal>
        </div>
      </section>

      {/* Studio features — alternating rows */}
      <section id="studio" className="jal-section">
        <div className="jal-container">
          <Reveal>
            <SectionHeading label={JAL_STUDIO} title="Repo in. Widget out. Features ship." />
          </Reveal>
          <div className="mt-8 divide-y divide-[var(--color-landing-border)]">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <article className={`jal-feature-row ${f.reverse ? "reverse" : ""}`}>
                  <div className="jal-feature-copy">
                    <p className="jal-feature-eyebrow">{f.eyebrow}</p>
                    <h3 className="jal-feature-title">{f.title}</h3>
                    <p className="jal-feature-body">{f.body}</p>
                    {f.eyebrow === "Widget" && (
                      <Link to="/studio/onboard" className="jal-link jal-link-chevron mt-6 inline-block">
                        Open Studio
                      </Link>
                    )}
                  </div>
                  <div className="jal-feature-visual">
                    {f.eyebrow === "Widget" ? (
                      <div className="jal-device-frame">
                        <div className="relative flex min-h-[220px] items-center justify-center bg-[var(--color-landing-elevated)] p-8">
                          <span className="text-sm text-landing-muted">Your app</span>
                          <span className="jal-widget-float absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-landing-accent)] shadow-lg">
                            <JalLogo size={24} variant="dark" iconStyle="mark" showWordmark={false} />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <FeatureVisual code={f.code} />
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="landing-section-alt jal-section">
        <div className="jal-container">
          <Reveal>
            <SectionHeading
              label="Pipeline"
              title="Not codegen. A product loop."
              subtitle="Feedback → triage → build → PR → merge. Traceable end to end."
            />
          </Reveal>
          <Reveal className="jal-stagger mt-12">
            <div className="jal-pipeline-strip">
              {pipelineSteps.map((step, i) => (
                <div key={step.title} className="jal-pipeline-step">
                  <p className="jal-pipeline-step-num">{i + 1}</p>
                  <p className="jal-pipeline-step-title">{step.title}</p>
                  <p className="jal-pipeline-step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Dual path */}
      <section id="dual" className="jal-section">
        <div className="jal-container">
          <Reveal>
            <SectionHeading label="Two paths" title="Studio or npm. One engine." />
          </Reveal>
          <Reveal className="jal-stagger mt-12 grid gap-6 md:grid-cols-2">
            <article className="landing-card landing-card-hover p-8">
              <p className="text-sm font-semibold text-[var(--color-landing-accent)]">Zero setup</p>
              <h3 className="mt-2 text-2xl font-semibold">{JAL_STUDIO}</h3>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-landing-muted">
                Hosted UI — connect GitHub, scan repo, get widget snippet, run dev queue in browser.
              </p>
              <Link to="/studio/onboard" className="btn-primary mt-8 inline-flex px-6 py-2.5 text-base">
                Open Studio
              </Link>
            </article>
            <article className="landing-card landing-card-hover p-8">
              <p className="text-sm font-semibold text-[var(--color-landing-accent)]">Full control</p>
              <h3 className="mt-2 text-2xl font-semibold">{JAL_NPM}</h3>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-landing-muted">
                Embed @jal_ai/jal in your backend — same triage, build, and PR pipeline on your infra.
              </p>
              <a href={NPM_URL} target="_blank" rel="noreferrer" className="jal-link jal-link-chevron mt-8 inline-block">
                View on npm
              </a>
            </article>
          </Reveal>
        </div>
      </section>

      {/* Profiles */}
      <section id="profiles" className="landing-section-alt jal-section">
        <div className="jal-container">
          <Reveal>
            <SectionHeading label="Adaptive" title="One pipeline. Any product." subtitle="Procurement, travel, fintech — or your own repo context from AI scan." />
          </Reveal>
          <Reveal delay={100} className="mt-12">
            <ShapeShiftProfiles />
          </Reveal>
        </div>
      </section>

      <JudgeTrySection />

      {/* Vendo */}
      <section id="demo" className="jal-section">
        <div className="jal-container">
          <Reveal>
            <div className="jal-feature-row">
            <div className="jal-feature-copy">
              <p className="jal-feature-eyebrow">Live demo</p>
              <h3 className="jal-feature-title">Vendo — {JAL_NAME} on a real product</h3>
              <p className="jal-feature-body">
                Procurement app with buyer feedback and internal dev queue. Try pre-filled ideas in{" "}
                <a href="#try" className="text-[var(--color-landing-accent)] underline">
                  Try it
                </a>
                .
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/internal/login" className="btn-primary px-6 py-2.5 text-base">
                  Dev queue
                </Link>
                <a
                  href={googleAuthStartUrl({ redirect: "/dashboard#feature-requests" })}
                  className="btn-secondary-outline inline-flex items-center gap-2 px-6 py-2.5"
                >
                  <GoogleIcon size={16} /> Buyer demo
                </a>
              </div>
            </div>
            <FeatureVisual code={`# npm\n${NPM_INSTALL}\n\n# Studio\n/studio/onboard → attach → widget → ship`} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section-alt jal-section">
        <div className="jal-container">
          <Reveal>
            <SectionHeading label="Pricing" title="Start free. Scale when you ship." />
          </Reveal>
          <Reveal className="jal-stagger mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`landing-card flex flex-col p-6 ${plan.highlight ? "pricing-popular relative" : ""}`}>
                {plan.badge && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[var(--color-landing-accent)] px-2.5 py-0.5 text-xs font-medium text-white">
                    {plan.badge}
                  </span>
                )}
                <p className="text-sm font-semibold text-[var(--color-landing-accent)]">{plan.name}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {plan.price}
                  {plan.period && <span className="text-base font-normal text-landing-muted">{plan.period}</span>}
                </p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-landing-muted">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {plan.external ? (
                  <a href={plan.ctaHref} className={`mt-8 flex justify-center py-2.5 ${plan.primary ? "btn-primary w-full" : "jal-link"}`}>
                    {plan.cta}
                  </a>
                ) : (
                  <Link to={plan.ctaHref} className={`mt-8 flex justify-center py-2.5 ${plan.primary ? "btn-primary w-full" : "jal-link"}`}>
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="jal-section">
        <div className="jal-container-narrow">
          <Reveal>
            <SectionHeading label="FAQ" title="Questions." />
          </Reveal>
          <Reveal delay={80} className="mt-10">
            <dl>
              {faqItems.map((item) => (
                <div key={item.q} className="jal-faq-item">
                  <dt className="text-[1.0625rem] font-semibold">{item.q}</dt>
                  <dd className="mt-2 text-base leading-relaxed text-landing-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <OneMoreThing />

      {/* CTA */}
      <section className="landing-section-alt jal-section text-center">
        <Reveal className="jal-container-narrow mx-auto">
          <p className="jal-memorable-quote">{JAL_TAGLINE}</p>
          <p className="mx-auto mt-4 max-w-md text-[1.0625rem] leading-relaxed text-landing-muted">{JAL_TAGLINE_LONG}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/studio/onboard" className="btn-primary px-8 py-3">
              Get started
            </Link>
            <a href={NPM_URL} target="_blank" rel="noreferrer" className="jal-link jal-link-chevron">
              npm install
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="jal-footer">
        <div className="jal-container flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <JalLogo size={32} variant={logoVariant} showWordmark showTagline tagline={JAL_TAGLINE} iconStyle="mark" />
          <nav className="jal-footer-links flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Footer">
            <Link to="/studio">Studio</Link>
            <Link to="/docs">Docs</Link>
            <a href={NPM_URL} target="_blank" rel="noreferrer">
              npm
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Link to="/internal/login">Vendo</Link>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-landing-muted">Copyright © {new Date().getFullYear()} {JAL_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}
