import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { JalLogo } from "../JalLogo";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const links = [
  { href: "#river", label: "River" },
  { href: "#studio", label: "Studio" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`jal-nav google-nav-bar fixed inset-x-0 top-0 z-50 ${scrolled ? "is-scrolled" : ""}`}>
      <div className="jal-container flex h-[3.25rem] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Jal home" style={{ fontSize: 28 }}>
          <JalLogo size={28} variant={theme === "light" ? "light" : "dark"} showWordmark iconStyle="mark" />
        </Link>

        <nav className="hidden items-center md:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link px-3 py-2">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link to="/docs" className="nav-link hidden px-3 py-2 sm:inline">
            Docs
          </Link>
          {user && (
            <Link to="/dashboard" className="nav-link hidden px-3 py-2 md:inline">
              Dashboard
            </Link>
          )}
          <Link to="/studio/onboard" className="btn-primary ml-1 px-4 py-2 text-sm">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
