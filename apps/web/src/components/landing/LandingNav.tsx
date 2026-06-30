import { Link } from "react-router-dom";
import { JalLogo } from "../JalLogo";
import { ThemeToggle } from "../ThemeToggle";
import { useTheme } from "../../context/ThemeContext";
import { JAL_TAGLINE } from "../../lib/jal-brand";

const links = [
  { href: "#river", label: "River" },
  { href: "#studio", label: "Studio" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#dual", label: "Studio + npm" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const { theme } = useTheme();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="glass-nav mx-auto flex max-w-5xl items-center justify-between rounded-full px-2 py-2 pl-4">
        <Link to="/" className="flex items-center gap-2.5">
          <JalLogo
            size={32}
            variant={theme === "light" ? "light" : "dark"}
            animated
            showWordmark
            showTagline
            tagline={JAL_TAGLINE}
            className="hidden sm:inline-flex"
          />
          <JalLogo
            size={32}
            variant={theme === "light" ? "light" : "dark"}
            animated={false}
            showWordmark={false}
            className="sm:hidden"
          />
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
          <Link to="/docs" className="nav-link hidden rounded-full px-3 py-1.5 text-sm sm:inline">
            Docs
          </Link>
          <Link to="/studio" className="nav-link hidden rounded-full px-3 py-1.5 text-sm lg:inline">
            Studio
          </Link>
          <Link to="/studio/onboard" className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold">
            Attach repo
          </Link>
        </div>
      </div>
    </header>
  );
}
