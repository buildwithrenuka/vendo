import { Link, Navigate, useParams } from "react-router-dom";
import { JalLogo } from "../JalLogo";
import { ThemeToggle } from "../ThemeToggle";
import { useTheme } from "../../context/ThemeContext";
import { MarkdownDoc } from "./MarkdownDoc";
import {
  DEFAULT_DOC_SLUG,
  DOC_NAV,
  DOC_PAGES,
  isDocSlug,
  type DocSlug,
} from "../../docs/docs-content";
import { JAL_STUDIO } from "../../lib/jal-brand";

function DocsSidebar({ active }: { active: DocSlug }) {
  return (
    <aside className="docs-sidebar">
      <Link to="/docs" className="docs-sidebar-brand">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-landing-accent)]">Docs</span>
      </Link>
      <nav className="docs-nav">
        {DOC_NAV.map((group) => (
          <div key={group.section} className="docs-nav-group">
            <p className="docs-nav-section">{group.section}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.slug}>
                  <Link
                    to={`/docs/${item.slug}`}
                    className={`docs-nav-link ${active === item.slug ? "active" : ""}`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="docs-sidebar-footer">
        <Link to="/" className="docs-nav-link text-sm">← Back to home</Link>
        <Link to="/studio/onboard" className="docs-nav-link text-sm">Open Studio</Link>
      </div>
    </aside>
  );
}

export function DocsLayout() {
  const { slug } = useParams<{ slug?: string }>();
  const { theme } = useTheme();

  if (!slug) {
    return <Navigate to={`/docs/${DEFAULT_DOC_SLUG}`} replace />;
  }

  if (!isDocSlug(slug)) {
    return <Navigate to={`/docs/${DEFAULT_DOC_SLUG}`} replace />;
  }

  const page = DOC_PAGES[slug];

  return (
    <div className="docs-root min-h-screen bg-[var(--color-landing-bg)] text-[var(--color-landing-text)]">
      <header className="docs-topbar">
        <Link to="/" className="flex items-center gap-2">
          <JalLogo size={28} variant={theme === "light" ? "light" : "dark"} showWordmark showTagline={false} />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/studio/onboard" className="btn-primary hidden rounded-lg px-3 py-1.5 text-xs font-bold sm:inline-flex">
            Attach repo
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="docs-layout">
        <DocsSidebar active={slug} />
        <main className="docs-main">
          <MarkdownDoc source={page.body} />
          <footer className="docs-page-footer">
            {slug !== "troubleshooting" && (
              <p>
                Next:{" "}
                {slug === "overview" && <Link to="/docs/get-started" className="docs-link">Get started →</Link>}
                {slug === "get-started" && <Link to="/docs/studio" className="docs-link">{JAL_STUDIO} →</Link>}
                {slug === "studio" && <Link to="/docs/widget" className="docs-link">Embed widget →</Link>}
                {slug === "widget" && <Link to="/docs/api" className="docs-link">API reference →</Link>}
                {slug === "npm" && <Link to="/docs/api" className="docs-link">API reference →</Link>}
                {slug === "api" && <Link to="/docs/troubleshooting" className="docs-link">Troubleshooting →</Link>}
              </p>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
