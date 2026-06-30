import { Link, useLocation } from "react-router-dom";
import { JalLogo } from "../JalLogo";
import { useAuth } from "../../context/AuthContext";

export function StudioNav() {
  const { user } = useAuth();
  const loc = useLocation();
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="studio-nav sticky top-0 z-50">
      <div className="studio-nav-inner">
        <Link to="/studio" className="flex items-center gap-2.5 transition opacity-90 hover:opacity-100">
          <JalLogo size={30} showWordmark showTagline={false} />
          <span className="studio-badge studio-badge-accent">Studio</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { to: "/studio", label: "Projects", match: /^\/studio\/?$/ },
            { to: "/studio/onboard", label: "Attach repo", match: /^\/studio\/onboard/ },
          ].map((item) => {
            const active = item.match.test(loc.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--color-landing-accent-soft)] text-[var(--color-landing-accent)]"
                    : "text-landing-muted hover:text-[var(--color-landing-text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="studio-user-pill">
              <span className="studio-user-avatar">{initials}</span>
              <span className="max-w-[120px] truncate">{user.name ?? user.email}</span>
            </div>
          )}
          <Link to="/" className="hidden text-sm text-landing-muted transition hover:text-[var(--color-landing-text)] sm:inline">
            Home
          </Link>
          <Link to="/studio/onboard" className="btn-primary rounded-full px-4 py-2 text-sm">
            + Attach repo
          </Link>
        </div>
      </div>
    </header>
  );
}
