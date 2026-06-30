import { Link } from "react-router-dom";
import { GoogleIcon, googleAuthStartUrl } from "../../lib/google-auth";
import { VendoLogo } from "../VendoLogo";
import { ThemeToggle } from "../ThemeToggle";
import { useTheme } from "../../context/ThemeContext";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#feature-requests", label: "Feature requests" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const { theme } = useTheme();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="glass-nav mx-auto flex max-w-5xl items-center justify-between rounded-full px-2 py-2 pl-4">
        <Link to="/" className="flex items-center gap-2">
          <VendoLogo size={28} variant={theme === "light" ? "light" : "dark"} showTagline showWordmark className="hidden sm:inline-flex" />
          <VendoLogo size={28} variant={theme === "light" ? "light" : "dark"} showWordmark className="sm:hidden" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link rounded-full px-3.5 py-1.5 text-sm">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="nav-link hidden rounded-full px-3 py-1.5 text-sm sm:inline">
            Sign in
          </Link>
          <a
            href={googleAuthStartUrl({ redirect: "/dashboard" })}
            className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
          >
            <GoogleIcon size={14} />
            Start free
          </a>
        </div>
      </div>
    </header>
  );
}
