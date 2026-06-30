import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { VendoLogo } from "./VendoLogo";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";

export function Shell({
  children,
  title,
  subtitle,
  actions,
}: {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <div className="app-shell relative min-h-screen">
      <header className="app-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/dashboard" className="shrink-0 transition opacity-90 hover:opacity-100">
              <VendoLogo size={32} variant={theme === "light" ? "light" : "dark"} animated={false} />
            </Link>
            <div className="min-w-0 border-l border-[var(--color-border)] pl-4">
              {title && (
                <h1 className="truncate text-base font-semibold tracking-tight text-[var(--color-ink)] sm:text-lg">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="truncate text-xs text-[var(--color-ink-muted)] sm:text-sm">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <ThemeToggle />
            <Link to="/" className="hidden text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] sm:inline">
              Home
            </Link>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`app-stat-card rounded-2xl p-4 ${highlight ? "app-stat-card--active" : ""}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-ink)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{hint}</p>}
    </div>
  );
}

export function SectionHeader({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      {label && <p className="app-kicker">{label}</p>}
      <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p>}
    </div>
  );
}

export function Alert({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "info" }) {
  return (
    <div className={`app-alert app-alert--${tone} mb-6 rounded-2xl px-4 py-3 text-sm`}>
      {children}
    </div>
  );
}

export function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`app-card rounded-2xl p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "app-btn-primary",
    secondary: "app-btn-secondary",
    ghost: "app-btn-ghost",
  };

  return (
    <button
      className={`app-btn inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const fieldClass =
  "app-field w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[var(--color-ink-muted)]/60";

export function Input({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <input className={fieldClass} {...props} />
    </label>
  );
}

export function Textarea({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <textarea className={`${fieldClass} min-h-[88px] resize-y`} {...props} />
    </label>
  );
}

export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "accent"; className?: string }) {
  const tones = {
    neutral: "app-badge-neutral",
    success: "app-badge-success",
    warning: "app-badge-warning",
    accent: "app-badge-accent",
  };
  return (
    <span className={`app-badge inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function DashboardTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="app-dashboard-tabs -mx-1 mb-6 flex gap-1 overflow-x-auto px-1 pb-1" aria-label="Dashboard sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? "page" : undefined}
          className={`app-dashboard-tab ${active === tab.id ? "app-dashboard-tab--active" : ""}`}
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span className="app-dashboard-tab-badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}

export function SubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="app-sub-tabs mb-5 flex gap-1 overflow-x-auto border-b border-[var(--color-border)] pb-3" aria-label="Section">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? "page" : undefined}
          className={`app-sub-tab ${active === tab.id ? "app-sub-tab--active" : ""}`}
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span className="app-dashboard-tab-badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
