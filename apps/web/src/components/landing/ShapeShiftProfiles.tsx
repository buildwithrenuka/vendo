import { useEffect, useState } from "react";

const PROFILES = [
  {
    id: "vendo",
    name: "Procurement",
    env: "JAL_PROFILE=vendo",
    headline: "Supplier onboarding and compliance",
    bullets: ["WhatsApp invites", "GST document checks", "Auto-approval rules"],
  },
  {
    id: "travel",
    name: "Travel",
    env: "JAL_PROFILE=travel",
    headline: "Flights, hotels, and itineraries",
    bullets: ["Multi-city search", "Seat selection", "Booking confirmations"],
  },
  {
    id: "generic",
    name: "Your product",
    env: "JAL_PROFILE=generic",
    headline: "Custom domain context",
    bullets: ["Custom product markdown", "Stack-aware code builder", "Feature catalog JSON"],
  },
];

export function ShapeShiftProfiles() {
  const [index, setIndex] = useState(0);
  const profile = PROFILES[index];

  useEffect(() => {
    const t = window.setInterval(() => setIndex((i) => (i + 1) % PROFILES.length), 6000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <div className="landing-card p-8">
        <div className="flex flex-wrap gap-2">
          {PROFILES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                i === index
                  ? "bg-[var(--color-landing-accent)] text-white"
                  : "text-landing-muted hover:text-[var(--color-landing-text)]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <code className="mt-6 block font-mono text-sm text-landing-muted">{profile.env}</code>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight">{profile.headline}</h3>
        <ul className="mt-5 space-y-3">
          {profile.bullets.map((b) => (
            <li key={b} className="text-base text-landing-muted">
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
