import { useEffect, useState } from "react";

const PROFILES = [
  {
    id: "vendo",
    name: "Procurement",
    env: "JAL_PROFILE=vendo",
    headline: "Supplier onboarding & compliance",
    bullets: ["WhatsApp invites", "GST document checks", "Auto-approval rules"],
    gradient: "from-[#00f5d4]/20 via-[#7c5cff]/12 to-[#ff6b4a]/14",
  },
  {
    id: "travel",
    name: "Travel",
    env: "JAL_PROFILE=travel",
    headline: "Flights, hotels & itineraries",
    bullets: ["Multi-city search", "Seat selection", "Booking confirmations"],
    gradient: "from-[#00f5d4]/15 via-[#7c5cff]/14 to-[#ff6b4a]/12",
  },
  {
    id: "generic",
    name: "Your product",
    env: "JAL_PROFILE=generic",
    headline: "Fully custom domain context",
    bullets: ["Custom product markdown", "Stack-aware code builder", "Feature catalog JSON"],
    gradient: "from-[#00f5d4]/18 via-[#7c5cff]/10 to-[#ff6b4a]/14",
  },
];

export function ShapeShiftProfiles() {
  const [index, setIndex] = useState(0);
  const profile = PROFILES[index];

  useEffect(() => {
    const t = window.setInterval(() => setIndex((i) => (i + 1) % PROFILES.length), 4000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <div className="jal-morph-card relative overflow-hidden rounded-3xl border border-[var(--color-landing-border)] p-8">
        <div
          className={`jal-morph-bg pointer-events-none absolute inset-0 bg-gradient-to-br ${profile.gradient} transition-opacity duration-700`}
          aria-hidden
        />
        <div className="relative">
          <div className="flex gap-2">
            {PROFILES.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  i === index
                    ? "bg-[var(--color-landing-accent)] text-[var(--color-landing-btn-primary-text)]"
                    : "border border-[var(--color-landing-border)] text-landing-muted hover:text-[var(--color-landing-text)]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <code className="mt-5 inline-block rounded-lg border border-[var(--color-landing-border)] bg-[var(--color-landing-elevated)] px-3 py-1.5 font-mono text-xs text-[var(--color-landing-accent)]">
            {profile.env}
          </code>
          <h3 className="mt-4 text-2xl font-bold tracking-tight">{profile.headline}</h3>
          <ul className="mt-4 space-y-2">
            {profile.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-landing-muted">
                <span className="h-1 w-1 rounded-full bg-[var(--color-landing-accent)]" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-landing-muted">
            One pipeline. Switch context — Jal adapts like water to whatever product you host.
          </p>
        </div>
      </div>
    </div>
  );
}
