import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FlowRiverHero } from "../components/landing/FlowRiverHero";
import { FeedbackRiverShowcase } from "../components/landing/FeedbackRiverShowcase";
import { ShapeShiftProfiles } from "../components/landing/ShapeShiftProfiles";
import { LandingNav } from "../components/landing/LandingNav";
import { JudgeTrySection } from "../components/landing/JudgeTrySection";
import { JalLogo } from "../components/JalLogo";
import { GoogleIcon, googleAuthStartUrl } from "../lib/google-auth";
import { JAL_TAGLINE, JAL_TAGLINE_LONG, JAL_HERO_HEADLINE, JAL_HERO_HEADLINE_ACCENT } from "../lib/jal-brand";

const GITHUB_URL = "https://github.com/buildwithrenuka/vendo";
const NPM_URL = "https://www.npmjs.com/package/@buildwithrenuka/jal";
const NPM_INSTALL = "npm install @buildwithrenuka/jal";

const studioSteps = [
  {
    step: "01",
    title: "Attach your repo",
    desc: "Paste owner/repo in Jal Studio. AI scans README, package.json, and your folder tree.",
    code: "github.com/your-org/your-app",
  },
  {
    step: "02",
    title: "Context locks in",
    desc: "Product name, stack, and existing features auto-detected — edit anytime.",
    code: "Jal reads → productContext + stackContext",
  },
  {
    step: "03",
    title: "Drop the widget",
    desc: "Floating Jal icon appears in your app. Customers submit features & track status.",
    code: '<JalWidget projectId="…" apiKey="jal_live_…" />',
  },
  {
    step: "04",
    title: "Dev queue ships",
    desc: "Your team triages, AI builds code, opens a PR, reviews, and merges on approval.",
    code: "Triage → Tasks → AI Build → PR → Merge",
  },
];

const dualDoors = [
  {
    title: "Jal Studio",
    badge: "Zero setup",
    desc: "Hosted UI — connect GitHub, scan repo, get widget snippet, run dev queue in browser.",
    cta: "Open Studio",
    href: "/studio/onboard",
    features: ["Repo scan & AI context", "Floating customer widget", "Full dev pipeline UI", "Per-project API keys"],
  },
  {
    title: "Jal npm",
    badge: "Full control",
    desc: "Embed the engine in your own backend — same triage, build, and PR pipeline, your infra.",
    cta: "View on npm",
    href: NPM_URL,
    external: true,
    features: ["@buildwithrenuka/jal package", "Self-host with env vars", "Wire your own routes", "Vendo = live reference"],
  },
];

const pipelineSteps = [
  { title: "AI triage", desc: "Every request classified — planned, duplicate, out of scope, or needs clarification." },
  { title: "Engineering tasks", desc: "Approved requests become structured assessments and concrete dev tasks." },
  { title: "AI code builder", desc: "Jal reads your attached repo, implements the change, opens a GitHub PR." },
  { title: "AI code review", desc: "PR diff validated against the original requirements — pass, fix, or escalate." },
  { title: "Approve & merge", desc: "Human approves once. Jal merges — full audit trail from feedback to ship." },
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
    features: ["3 pipeline runs", "1 repo attach", "Customer widget", "AI triage & status tracking"],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    highlight: true,
    badge: "Most popular",
    cta: "Attach repo",
    ctaHref: "/studio/onboard",
    primary: true,
    external: false,
    features: ["Unlimited pipeline runs", "Multiple repos", "GitHub PR automation", "npm + Studio bridge"],
  },
  {
    name: "Team",
    price: "Custom",
    period: "",
    highlight: false,
    cta: "Contact sales",
    ctaHref: "mailto:hello@jal.dev",
    primary: false,
    external: true,
    features: ["SSO & audit exports", "Custom context packs", "Dedicated support", "SLA"],
  },
];

const faqItems = [
  {
    q: "What happens when I attach a repo?",
    a: "Jal scans your GitHub repository, detects stack and product context, stores it per project, and uses it for every triage and AI build — code lands in that repo as PRs.",
  },
  {
    q: "How does the customer widget work?",
    a: "After attach, you get an API key and a <JalWidget /> component. Drop it in your app — customers see a floating icon, submit feedback, and track status. They never see the dev queue.",
  },
  {
    q: "Studio vs npm — which do I pick?",
    a: "Studio if you want speed: connect repo, copy widget, ship. npm if you want the engine inside your own product (like Vendo does for procurement). Use both — same pipeline.",
  },
  {
    q: "What is Vendo?",
    a: "A reference app in this repo showing Jal on a real product — buyer feedback widget + internal dev queue. Proof that the pipeline works end-to-end.",
  },
];

function IconCheck() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[var(--color-landing-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SectionHeading({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="section-label">{label}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-landing-muted">{subtitle}</p>}
    </div>
  );
}

export function HomePage() {
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen bg-[var(--color-landing-bg)] text-[var(--color-landing-text)]">
      <div className="landing-grid pointer-events-none fixed inset-0 z-0" />
      <div className="jal-ambient pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="relative z-10">
        <LandingNav />

        {/* Hero — copy + live river pipeline */}
        <section className="mesh-hero px-6 pb-20 pt-28 lg:pb-28 lg:pt-32">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-landing-border)] bg-[var(--color-landing-accent-soft)] px-3 py-1 font-display text-xs font-semibold tracking-wide text-[var(--color-landing-accent)]">
                <JalLogo size={18} variant={theme === "light" ? "light" : "dark"} animated={false} showWordmark={false} />
                {JAL_TAGLINE}
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                {JAL_HERO_HEADLINE}{" "}
                <span className="text-genZ">{JAL_HERO_HEADLINE_ACCENT}</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-landing-muted">
                <strong className="font-semibold text-[var(--color-landing-text)]">Attach your repo.</strong>{" "}
                AI reads your product context. Customers submit via a floating widget. Your team ships with PR automation —
                like water taking the shape of any container.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-landing-muted">
                {["Repo attach", "AI context scan", "Customer widget", "Dev queue", "GitHub PR merge"].map((tag) => (
                  <span key={tag} className="rounded-full border border-[var(--color-landing-border)] px-3 py-1">{tag}</span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/studio/onboard" className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold">
                  Attach your repo — free
                </Link>
                <a href="#river" className="btn-secondary inline-flex rounded-xl px-6 py-3.5 text-sm font-semibold">
                  See the river
                </a>
              </div>
              <p className="mt-4 text-sm text-landing-muted">No credit card · 3 free pipeline runs · Widget in minutes</p>
            </div>
            <FlowRiverHero />
          </div>
        </section>

        {/* Feedback River — interactive demo */}
        <section id="river" className="relative overflow-hidden border-y border-[var(--color-landing-border)] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              label="The Feedback River"
              title="Watch feedback flow downstream"
              subtitle="Click a droplet — customer lens on the left, your ship console on the right. Same request, two views."
            />
            <div className="mt-14">
              <FeedbackRiverShowcase />
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link to="/studio/onboard" className="btn-primary rounded-xl px-6 py-3 text-sm font-bold">
                Attach your repo
              </Link>
              <Link to="/studio" className="btn-secondary rounded-xl px-6 py-3 text-sm font-semibold">
                Open Studio
              </Link>
            </div>
          </div>
        </section>

        {/* Studio flow */}
        <section id="studio" className="border-y border-[var(--color-landing-border)] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              label="Jal Studio"
              title="Repo in. Widget out. Features ship."
              subtitle="Connect GitHub once — AI attaches to your codebase and your app simultaneously."
            />
            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              <div className="landing-card rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-landing-accent)]">Customer view</p>
                <h3 className="mt-2 text-xl font-bold">Floating widget in your app</h3>
                <p className="mt-2 text-sm text-landing-muted">
                  After attach, drop <code className="text-[var(--color-landing-accent)]">&lt;JalWidget /&gt;</code> anywhere.
                  Customers submit features, track Received → Shipped — never see internal tools.
                </p>
                <div className="relative mt-6 h-40 rounded-xl border border-dashed border-[var(--color-landing-border)] bg-[var(--color-landing-elevated)]">
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-landing-muted">Your app UI</span>
                  <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-landing-accent)] shadow-lg">
                    <JalLogo size={22} variant="dark" showWordmark={false} animated={false} />
                  </span>
                </div>
              </div>
              <div className="landing-card rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-landing-accent)]">Dev view</p>
                <h3 className="mt-2 text-xl font-bold">Full pipeline in Studio</h3>
                <p className="mt-2 text-sm text-landing-muted">
                  Inbox, AI triage, task kanban, AI Build → PR, code review, approve & merge. Scoped to your attached repo.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Inbox", "AI Build", "PR #42", "Merge"].map((s, i) => (
                    <span key={s} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${i === 2 ? "status-pill-active" : "status-pill-inactive"}`}>{s}</span>
                  ))}
                </div>
                <Link to="/studio" className="btn-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
                  Open Studio
                </Link>
              </div>
            </div>
            <div className="mt-14 space-y-0">
              {studioSteps.map((item, i) => (
                <div key={item.step} className="jal-step-row relative grid gap-6 pb-12 md:grid-cols-[auto_1fr] md:gap-10">
                  {i < studioSteps.length - 1 && (
                    <span className="jal-step-connector absolute left-[1.65rem] top-14 hidden h-[calc(100%-2rem)] w-px md:block" aria-hidden />
                  )}
                  <span className="jal-step-badge flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-landing-border)] bg-[var(--color-landing-surface)] font-mono text-sm font-bold text-[var(--color-landing-accent)]">
                    {item.step}
                  </span>
                  <div className="landing-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-landing-muted">{item.desc}</p>
                    <pre className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-landing-border)] bg-[var(--color-landing-elevated)] p-4 font-mono text-xs text-[var(--color-landing-accent)]">{item.code}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dual doors */}
        <section id="dual" className="landing-section-alt px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading label="Two doors, one engine" title="Studio or npm — your call" subtitle="Same @buildwithrenuka/jal pipeline. Pick hosted speed or self-hosted control." />
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {dualDoors.map((door) => (
                <article key={door.title} className="landing-card landing-card-hover flex flex-col rounded-2xl p-6">
                  <span className="text-xs font-bold uppercase text-[var(--color-landing-accent)]">{door.badge}</span>
                  <h3 className="mt-2 text-2xl font-bold">{door.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-landing-muted">{door.desc}</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {door.features.map((f) => (
                      <li key={f} className="flex gap-2"><IconCheck />{f}</li>
                    ))}
                  </ul>
                  {door.external ? (
                    <a href={door.href} target="_blank" rel="noreferrer" className="btn-secondary mt-6 rounded-xl py-3 text-center text-sm font-semibold">{door.cta}</a>
                  ) : (
                    <Link to={door.href} className="btn-primary mt-6 rounded-xl py-3 text-center text-sm font-semibold">{door.cta}</Link>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section id="pipeline" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading label="The pipeline" title="Not codegen — a complete product loop" subtitle="Feedback → triage → build → PR → merge. Traceable end to end." />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {pipelineSteps.map((item, i) => (
                <article key={item.title} className="landing-card landing-card-hover rounded-2xl p-5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-landing-accent)]">Stage {i + 1}</span>
                  <h3 className="mt-2 text-base font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-landing-muted">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Profiles */}
        <section id="profiles" className="landing-section-alt px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading label="Context-adaptive" title="One pipeline. Any product shape." subtitle="Procurement, travel, fintech — or your own repo context from AI scan." />
            <div className="mt-14"><ShapeShiftProfiles /></div>
          </div>
        </section>

        <JudgeTrySection />

        {/* Vendo demo */}
        <section id="demo" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="section-label">Live reference</p>
                <h2 className="mt-3 text-3xl font-bold">Vendo — Jal on a real product</h2>
                <p className="mt-4 text-landing-muted">
                  Procurement app with buyer feedback tab + internal dev queue. Same pipeline as Jal Studio — see ready-made ideas in <a href="#try" className="text-[var(--jal-phosphor)] underline">Try it</a>.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/internal/login" className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">Dev queue demo</Link>
                  <a href={googleAuthStartUrl({ redirect: "/dashboard#feature-requests" })} className="btn-secondary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold">
                    <GoogleIcon size={16} /> Buyer widget demo
                  </a>
                </div>
              </div>
              <div className="landing-card rounded-2xl p-6 font-mono text-xs">
                <p className="text-landing-muted"># npm — headless engine</p>
                <p className="mt-2 text-[var(--color-landing-accent)]">{NPM_INSTALL}</p>
                <p className="mt-4 text-landing-muted"># Studio — hosted UI</p>
                <p className="text-[var(--color-landing-text)]">/studio/onboard → attach → widget → ship</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="landing-section-alt px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading label="Pricing" title="Attach free. Ship more on Pro." />
            <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div key={plan.name} className={`landing-card flex flex-col rounded-2xl p-6 ${plan.highlight ? "pricing-popular relative" : ""}`}>
                  {plan.badge && <span className="absolute -top-2.5 right-4 rounded-full bg-[var(--color-landing-accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[var(--color-landing-btn-primary-text)]">{plan.badge}</span>}
                  <p className="text-sm font-semibold text-[var(--color-landing-accent)]">{plan.name}</p>
                  <p className="mt-2 text-4xl font-bold">{plan.price}{plan.period && <span className="text-base font-normal text-landing-muted">{plan.period}</span>}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm text-landing-muted">
                    {plan.features.map((f) => (<li key={f} className="flex gap-2"><IconCheck />{f}</li>))}
                  </ul>
                  {plan.external ? (
                    <a href={plan.ctaHref} className={`mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-semibold ${plan.primary ? "btn-primary" : "btn-secondary"}`}>{plan.cta}</a>
                  ) : (
                    <Link to={plan.ctaHref} className={`mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-semibold ${plan.primary ? "btn-primary" : "btn-secondary"}`}>{plan.cta}</Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <SectionHeading label="FAQ" title="Common questions" />
            <dl className="mt-10 space-y-4">
              {faqItems.map((item) => (
                <div key={item.q} className="landing-card rounded-xl p-5">
                  <dt className="font-semibold">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-landing-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-16 pt-4">
          <div className="jal-cta-panel mx-auto max-w-3xl rounded-3xl px-8 py-14 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Attach your repo. Ship this week.</h2>
            <p className="mx-auto mt-3 max-w-md text-landing-muted">{JAL_TAGLINE_LONG}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/studio/onboard" className="btn-primary rounded-xl px-8 py-3.5 text-sm font-semibold">Open Jal Studio</Link>
              <a href={NPM_URL} target="_blank" rel="noreferrer" className="btn-secondary rounded-xl px-8 py-3.5 text-sm font-semibold">npm install</a>
            </div>
          </div>
        </section>

        <footer className="border-t border-[var(--color-landing-border)] py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
            <JalLogo size={36} variant={theme === "light" ? "light" : "dark"} animated={false} showWordmark showTagline tagline={JAL_TAGLINE} className="opacity-90" />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-landing-muted">
              <Link to="/studio">Studio</Link>
              <Link to="/docs">Documentation</Link>
              <a href={NPM_URL} target="_blank" rel="noreferrer">npm</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
              <Link to="/internal/login">Vendo demo</Link>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-landing-muted">© {new Date().getFullYear()} Jal · MIT</p>
        </footer>
      </div>
    </div>
  );
}
