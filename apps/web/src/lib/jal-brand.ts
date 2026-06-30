/** Jal — product copy + design tokens */

/** Brand name — capital J */
export const JAL_NAME = "Jal";
export const JAL_STUDIO = "Jal Studio";
export const JAL_NPM = "Jal npm";

export const JAL_TAGLINE = "Feedback flows. Features ship.";

export const JAL_TAGLINE_LONG =
  "The pipeline that turns customer feedback into merged pull requests.";

/** The one sentence people remember — say it everywhere */
export const JAL_MANIFESTO = "One widget. Full pipeline.";

/** Pocket-sized pitch (iPod-style) */
export const JAL_POCKET_PITCH = "Customer idea → merged pull request.";

export const JAL_HERO_LINE1 = "Feedback in.";
export const JAL_HERO_LINE2 = "Features out.";
export const JAL_HERO_SUB =
  "Connect your repo. Capture requests in a widget. Ship pull requests — with AI from triage to merge.";

/** Jobs “one more thing” beat */
export const JAL_ONE_MORE_THING = "One more thing.";
export const JAL_ONE_MORE_BODY =
  "The whole pipeline — triage, build, PR, merge — in under two minutes. No setup deck. Just attach and go.";
/** @deprecated use JAL_HERO_LINE1 / JAL_HERO_LINE2 */
export const JAL_HERO_HEADLINE = JAL_HERO_LINE1;
/** @deprecated use JAL_HERO_LINE2 */
export const JAL_HERO_HEADLINE_ACCENT = JAL_HERO_LINE2;

/**
 * Jobs-style palette — ONE brand color, black CTAs, no rainbow.
 * Water teal = Jal (paani). Black = action. Gray = structure.
 */
export const JAL_COLORS = {
  /** Signature — deep water teal (blue-green, not generic SaaS blue) */
  brand: "#006B7D",
  brandHover: "#005A6A",
  brandLight: "#5AC8D8",
  brandSoft: "rgba(0, 107, 125, 0.12)",
  /** CTAs — Apple Store black pill */
  cta: "#1d1d1f",
  ctaHover: "#000000",
  ctaText: "#ffffff",
  /** Light surfaces */
  text: "#1d1d1f",
  textSecondary: "#6e6e73",
  textTertiary: "#86868b",
  bg: "#ffffff",
  bgSecondary: "#fbfbfd",
  bgTertiary: "#f5f5f7",
  border: "#d2d2d7",
  /** Dark mode */
  darkText: "#f5f5f7",
  darkTextSecondary: "#a1a1a6",
  darkBg: "#000000",
  darkSurface: "#1d1d1f",
  darkElevated: "#161617",
  darkBorder: "#424245",
  darkCta: "#f5f5f7",
  darkCtaHover: "#ffffff",
  darkCtaText: "#1d1d1f",
  /** Semantic only — never decorative */
  success: "#248A3D",
  error: "#D70015",
  onPrimary: "#ffffff",
  /** Water depth — blue-tinted surfaces & gradients */
  lagoon: "#003D47",
  mist: "#E8F4F6",
  aqua: "#4EC4D4",
  foam: "#F0FAFB",
  ember: "#ff9500",
} as const;

export type JalColorToken = keyof typeof JAL_COLORS;

export const JAL_MARK = {
  viewBox: "0 0 48 48",
  drop:
    "M24 9 C15 9 12 19 12 26 C12 32 17 38 24 40 C31 38 36 32 36 26 C36 19 33 9 24 9 Z",
  stream: "M24 13 C18 16 18 21 24 24 C30 27 30 32 24 35",
} as const;
