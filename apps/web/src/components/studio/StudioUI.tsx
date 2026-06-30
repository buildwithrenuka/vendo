import type { ReactNode } from "react";
import { StudioNav } from "./StudioNav";

export function StudioShell({ children }: { children: ReactNode }) {
  return (
    <div className="studio-root relative min-h-screen text-[var(--color-landing-text)]">
      <div className="relative z-10 flex min-h-screen flex-col">
        <StudioNav />
        {children}
      </div>
    </div>
  );
}

export function StudioMain({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className={`studio-main mx-auto w-full flex-1 px-6 py-10 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>
      {children}
    </main>
  );
}

export function StudioPageHeader({
  eyebrow,
  title,
  subtitle,
  back,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  back?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="studio-page-header animate-fade-up mb-10">
      {back}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && <p className="section-label">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 text-base leading-relaxed text-landing-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function StudioGlassCard({
  children,
  className = "",
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`studio-glass-card ${glow ? "studio-glass-glow" : ""} ${className}`}>{children}</div>
  );
}

export function StudioStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`studio-stat ${accent ? "studio-stat-accent" : ""}`}>
      <p className="studio-stat-value">{value}</p>
      <p className="studio-stat-label">{label}</p>
    </div>
  );
}

export function StudioBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "accent" | "warning";
}) {
  return <span className={`studio-badge studio-badge-${tone}`}>{children}</span>;
}

export function StudioEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="studio-empty">
      {icon && <div className="studio-empty-icon">{icon}</div>}
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-landing-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StudioStepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="studio-step-bar">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={`studio-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
            <span className="studio-step-dot">{done ? "✓" : i + 1}</span>
            <span className="studio-step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function GitHubIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 1.005 0 2.01.345 3.015 1.05.885-.225 1.815-.345 2.76-.345.945 0 1.875.12 2.76.345 1.005-.705 2.01-1.05 3.015-1.05.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function StudioLoading({ label = "Loading Studio…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="studio-spinner" aria-hidden />
      <p className="text-sm text-landing-muted">{label}</p>
    </div>
  );
}
