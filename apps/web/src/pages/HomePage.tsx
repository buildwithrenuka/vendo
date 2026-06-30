import { Link } from "react-router-dom";
import { LandingNav } from "../components/landing/LandingNav";
import { GoogleIcon, googleAuthStartUrl } from "../lib/google-auth";

const offerings = [
  {
    title: "Message-first invites",
    desc: "Share onboarding links on WhatsApp, email, or any channel — wherever your suppliers already are.",
    icon: "💬",
  },
  {
    title: "Compliance in one place",
    desc: "Tax IDs, certificates, bank details — one form per supplier. Versioned and audit-ready.",
    icon: "📋",
  },
  {
    title: "Tax & invoice matching",
    desc: "Match supplier invoices against your books — GST, VAT, or local tax rules. Catch mismatches early.",
    icon: "🧾",
  },
  {
    title: "Auto-approve the easy ones",
    desc: "Set rules in plain language. Clear submissions approve in seconds — you only review exceptions.",
    icon: "⚡",
  },
];

const steps = [
  {
    n: "1",
    title: "Invite your supplier",
    desc: "Create a secure link from your dashboard and share it on WhatsApp, email, or SMS.",
  },
  {
    n: "2",
    title: "Supplier fills the form",
    desc: "They sign in with Google, complete your compliance checklist, and submit.",
  },
  {
    n: "3",
    title: "Approve or auto-approve",
    desc: "Valid docs pass your rules instantly. Only edge cases land in your queue.",
  },
];

const lifeEasier = [
  "No more compliance docs lost in chat threads",
  "One dashboard — see who's onboarding, approved, or pending",
  "Suppliers verify once and reuse with new buyers worldwide",
  "Full audit trail when finance or compliance asks",
];

const without = [
  "Docs scattered across WhatsApp and email",
  "Same checks repeated for every supplier",
  "Excel doesn’t remember who’s reliable",
  "Enterprise tools need tickets and months of waiting",
];

const withVendo = [
  "One link, one form, one status tracker",
  "Rules auto-approve what’s clearly valid",
  "Green / yellow / red supplier scorecard",
  "Feature requests tracked — not lost in a queue",
];

const procurementFor = [
  { role: "Procurement teams", desc: "Onboard raw-material and packaging vendors before peak season — anywhere you operate." },
  { role: "Finance & compliance", desc: "Collect tax IDs, certificates, and vendor docs with a full audit trail." },
  { role: "Growing buyers", desc: "Replace spreadsheet vendor lists with one structured process, in any market." },
];

const requestStatuses = ["Received", "AI Review", "Planned", "In Development", "Shipped"];

const faqItems = [
  {
    q: "Is Vendo a procurement app?",
    a: "Yes. Vendo is a procurement platform for buyers worldwide — onboard, verify, and manage suppliers with vendor compliance, tax docs, approvals, and scorecards in one place.",
  },
  {
    q: "Is it really free to start?",
    a: "Yes — up to 3 suppliers, no credit card. Upgrade when you need tax reconciliation, more suppliers, or priority support.",
  },
  {
    q: "Is Vendo only for one country?",
    a: "No. Vendo is built for procurement teams globally. Tax and compliance fields adapt to your market — GST in India, VAT in the EU, EIN in the US, and more.",
  },
  {
    q: "Does every feature request get built?",
    a: "Every request gets reviewed and honest feedback. Not all will ship — but you'll always see status in your dashboard, not a black hole.",
  },
];

function IconCheck() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[var(--color-landing-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="landing-card overflow-hidden rounded-2xl">
      <div className="border-b border-[var(--color-landing-border)] px-4 py-3">
        <p className="text-center text-[11px] font-medium uppercase tracking-wide text-[var(--color-landing-accent)] opacity-80">
          Procurement dashboard
        </p>
        <p className="text-center text-[11px] text-landing-muted">Onboard vendors fast</p>
      </div>
      <div className="space-y-2 p-4">
        {[
          { name: "Peak Materials (RM vendor)", status: "Approved", ok: true },
          { name: "Nova Components (packaging)", status: "Auto-approved", ok: true },
          { name: "Acme Logistics (3PL)", status: "Pending docs", ok: false },
        ].map((row) => (
          <div
            key={row.name}
            className="landing-row flex items-center justify-between rounded-xl border border-[var(--color-landing-border)] px-4 py-3"
          >
            <span className="text-sm font-medium">{row.name}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                row.ok ? "status-ok" : "status-pill-active"
              }`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="section-label">{label}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-landing-muted">{subtitle}</p>}
    </div>
  );
}

export function HomePage() {
  return (
    <div className="relative min-h-screen bg-[var(--color-landing-bg)] text-[var(--color-landing-text)]">
      <div className="landing-grid pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10">
        <LandingNav />

        {/* Hero */}
        <section className="mesh-hero px-6 pb-20 pt-28 lg:pb-28 lg:pt-32">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-landing-border)] bg-[var(--color-landing-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-landing-accent)]">
                Onboard vendors fast
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Invite vendors. Verify compliance.{" "}
                <span className="text-genZ">Approve without the chaos.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-landing-muted">
                Vendo is a procurement platform for buyers worldwide — share a link on any channel,
                collect compliance docs, auto-approve clear cases, and keep finance audit-ready.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-landing-muted">
                {["Vendor onboarding", "Tax compliance", "Supplier scorecards", "Purchase-ready vendors"].map((tag) => (
                  <span key={tag} className="rounded-full border border-[var(--color-landing-border)] px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={googleAuthStartUrl({ redirect: "/dashboard" })}
                  className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold"
                >
                  <GoogleIcon size={18} />
                  Start free — 3 suppliers
                </a>
                <a href="#how" className="btn-secondary inline-flex rounded-xl px-6 py-3.5 text-sm font-semibold">
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-sm text-landing-muted">No credit card · Setup in minutes</p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* Who it's for — procurement */}
        <section className="border-b border-[var(--color-landing-border)] px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-sm font-medium text-landing-muted">
              Built for procurement teams managing vendors worldwide
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {procurementFor.map((item) => (
                <div key={item.role} className="landing-card rounded-xl px-5 py-4 text-center md:text-left">
                  <p className="text-sm font-bold text-[var(--color-landing-accent)]">{item.role}</p>
                  <p className="mt-1 text-sm text-landing-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What we offer */}
        <section id="features" className="border-t border-[var(--color-landing-border)] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              label="procurement features"
              title="What your procurement team gets"
              subtitle="Vendor onboarding, compliance, and approvals — for procurement teams in every market."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {offerings.map((item) => (
                <article key={item.title} className="landing-card rounded-2xl p-6">
                  <span className="text-2xl" aria-hidden>{item.icon}</span>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-landing-muted">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="landing-section-alt px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              label="how it works"
              title="Three steps. That's it."
            />
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.n} className="landing-card rounded-2xl p-6 text-center md:text-left">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-landing-accent-soft)] text-sm font-bold text-[var(--color-landing-accent)]">
                    {step.n}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-landing-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Life gets easier */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-start gap-12 lg:grid-cols-2">
              <div>
                <p className="section-label">why teams switch</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  We make procurement life easier.
                </h2>
                <p className="mt-4 text-landing-muted">
                  You shouldn&apos;t spend your week forwarding PDFs and asking &quot;did you fill the form yet?&quot;
                </p>
                <ul className="mt-8 space-y-4">
                  {lifeEasier.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <IconCheck />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="landing-card overflow-hidden rounded-2xl">
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-[var(--color-landing-border)] p-6 md:border-b-0 md:border-r">
                    <p className="text-xs font-semibold uppercase tracking-wide text-landing-muted">Without Vendo</p>
                    <ul className="mt-4 space-y-3 text-sm text-landing-muted">
                      {without.map((t) => (
                        <li key={t} className="flex gap-2">
                          <span className="text-landing-muted opacity-60">✕</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="with-panel p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-landing-accent)]">With Vendo</p>
                    <ul className="mt-4 space-y-3 text-sm">
                      {withVendo.map((t) => (
                        <li key={t} className="flex gap-2">
                          <IconCheck />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature requests */}
        <section id="feature-requests" className="landing-section-alt px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="section-label">product feedback</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Need something for your procurement workflow? Ask us.
                </h2>
                <p className="mt-4 text-landing-muted">
                  Unlike legacy tools where you file a support ticket and wait months, submit a feature
                  request from your dashboard — AI triages it, and you track every step until it ships.
                </p>
                <p className="mt-3 text-sm text-landing-muted">
                  Every request reviewed · honest feedback · not every request will be built
                </p>
                <a
                  href={googleAuthStartUrl({ redirect: "/dashboard#feature-requests" })}
                  className="btn-primary mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-semibold"
                >
                  Submit a feature request
                </a>
                <p className="mt-3 text-xs text-landing-muted">
                  Most requests reviewed within 48 hours · Enterprise gets priority queue + 72hr SLA
                </p>
              </div>

              <div className="landing-card rounded-2xl p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-landing-muted">
                  Request status — always visible
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {requestStatuses.map((status, i) => (
                    <span
                      key={status}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        i === 1 ? "status-pill-active" : "status-pill-inactive"
                      }`}
                    >
                      {status}
                    </span>
                  ))}
                </div>
                <p className="mt-4 border-t border-[var(--color-landing-border)] pt-4 text-sm text-landing-muted">
                  Also: <span className="text-[var(--color-landing-text)]">Declined (with reason)</span> ·{" "}
                  <span className="text-[var(--color-landing-text)]">Already exists</span> — so you never wait for
                  something Vendo already has.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="landing-section-alt px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              label="pricing"
              title="Simple plans. No commission on orders."
              subtitle="Start free anywhere. Upgrade when you outgrow 3 suppliers. Local currency billing available."
            />
            <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-3">
              <div className="landing-card rounded-2xl p-6">
                <p className="text-sm font-semibold text-[var(--color-sage)]">Free</p>
                <p className="mt-2 text-4xl font-bold">$0</p>
                <ul className="mt-6 space-y-2.5 text-sm text-landing-muted">
                  {["Up to 3 suppliers", "WhatsApp & link invites", "Basic forms & scorecard", "Submit feature requests"].map((f) => (
                    <li key={f} className="flex gap-2"><IconCheck />{f}</li>
                  ))}
                </ul>
                <a
                  href={googleAuthStartUrl({ redirect: "/dashboard" })}
                  className="btn-secondary mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-semibold"
                >
                  Start free
                </a>
              </div>

              <div className="landing-card pricing-popular relative rounded-2xl p-6">
                <span className="absolute -top-2.5 right-4 rounded-full bg-[var(--color-landing-accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[var(--color-landing-btn-primary-text)]">
                  Popular
                </span>
                <p className="text-sm font-semibold text-landing-muted">Standard</p>
                <p className="mt-2 text-4xl font-bold">
                  $149<span className="text-base font-normal text-landing-muted">/mo</span>
                </p>
                <p className="mt-1 text-xs text-landing-muted">~₹9,999/mo in India · local pricing on request</p>
                <ul className="mt-6 space-y-2.5 text-sm text-landing-muted">
                  {["50 suppliers", "Tax / invoice reconciliation", "Auto-approval rules", "Roadmap feature requests"].map((f) => (
                    <li key={f} className="flex gap-2"><IconCheck />{f}</li>
                  ))}
                </ul>
                <a
                  href={googleAuthStartUrl({ redirect: "/buyer/verify" })}
                  className="btn-primary mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-semibold"
                >
                  Start trial
                </a>
              </div>

              <div className="landing-card rounded-2xl p-6">
                <p className="text-sm font-semibold text-landing-muted">Enterprise</p>
                <p className="mt-2 text-4xl font-bold">Custom</p>
                <ul className="mt-6 space-y-2.5 text-sm text-landing-muted">
                  {["Unlimited suppliers", "SSO & audit exports", "Priority feature queue", "72hr status SLA"].map((f) => (
                    <li key={f} className="flex gap-2"><IconCheck />{f}</li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@vendo.app"
                  className="btn-secondary mt-6 flex w-full justify-center rounded-xl py-3 text-sm font-semibold"
                >
                  Contact sales
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <SectionHeading label="questions" title="Quick answers" />
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
          <div className="mx-auto max-w-3xl rounded-3xl dark-panel px-8 py-14 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Start onboarding vendors today</h2>
          <p className="mx-auto mt-3 max-w-md text-landing-muted">
              Free for 3 suppliers. Used by procurement teams globally — not enterprise ticket queues.
            </p>
            <a
              href={googleAuthStartUrl({ redirect: "/dashboard" })}
              className="btn-primary mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold"
            >
              <GoogleIcon size={18} />
              Get started free
            </a>
          </div>
        </section>

        <footer className="border-t border-[var(--color-landing-border)] py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-landing-muted sm:flex-row">
            <p>© {new Date().getFullYear()} Vendo · Onboard vendors fast</p>
            <div className="flex gap-6">
              <Link to="/login" className="transition hover:text-[var(--color-landing-text)]">Sign in</Link>
              <a href="#pricing" className="transition hover:text-[var(--color-landing-text)]">Pricing</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
