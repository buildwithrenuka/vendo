import overview from "@jal/docs/overview.md?raw";
import getStarted from "@jal/docs/get-started.md?raw";
import studio from "@jal/docs/studio.md?raw";
import widget from "@jal/docs/widget.md?raw";
import npm from "@jal/docs/npm.md?raw";
import api from "@jal/docs/api.md?raw";
import troubleshooting from "@jal/docs/troubleshooting.md?raw";

export type DocSlug =
  | "overview"
  | "get-started"
  | "studio"
  | "widget"
  | "npm"
  | "api"
  | "troubleshooting";

export const DOC_PAGES: Record<DocSlug, { title: string; body: string }> = {
  overview: { title: "Overview", body: overview },
  "get-started": { title: "Get started", body: getStarted },
  studio: { title: "Jal Studio", body: studio },
  widget: { title: "Embed widget", body: widget },
  npm: { title: "npm package", body: npm },
  api: { title: "API reference", body: api },
  troubleshooting: { title: "Troubleshooting", body: troubleshooting },
};

export const DOC_NAV: { section: string; items: { slug: DocSlug; title: string }[] }[] = [
  {
    section: "Introduction",
    items: [
      { slug: "overview", title: "Overview" },
      { slug: "get-started", title: "Get started" },
    ],
  },
  {
    section: "Jal Studio",
    items: [
      { slug: "studio", title: "Studio walkthrough" },
      { slug: "widget", title: "Embed widget" },
    ],
  },
  {
    section: "Developers",
    items: [
      { slug: "npm", title: "npm package" },
      { slug: "api", title: "API reference" },
      { slug: "troubleshooting", title: "Troubleshooting" },
    ],
  },
];

export function isDocSlug(s: string | undefined): s is DocSlug {
  return s !== undefined && s in DOC_PAGES;
}

export const DEFAULT_DOC_SLUG: DocSlug = "overview";
