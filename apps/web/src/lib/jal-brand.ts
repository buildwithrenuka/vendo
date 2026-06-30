/** Jal product copy + design tokens — single source of truth */

export const JAL_TAGLINE = "Feedback flows. Features ship.";

export const JAL_TAGLINE_LONG =
  "The context-adaptive AI pipeline that turns customer feedback into merged pull requests.";

export const JAL_HERO_HEADLINE = "From customer feedback to";
export const JAL_HERO_HEADLINE_ACCENT = "merged pull request.";

/** Phosphor Abyss — bioluminescent river palette */
export const JAL_COLORS = {
  abyss: "#010a0f",
  abyssMid: "#021418",
  phosphor: "#00f5d4",
  phosphorDim: "#00c4aa",
  current: "#7c5cff",
  currentSoft: "#a78bfa",
  coral: "#ff6b4a",
  coralSoft: "#ff8f73",
  ember: "#ffc857",
  pearl: "#d4fff8",
  seaweed: "#6b9e96",
  dawn: "#ecfbf9",
  lagoonInk: "#0a2e33",
  reefTeal: "#00a896",
} as const;

export type JalColorToken = keyof typeof JAL_COLORS;
