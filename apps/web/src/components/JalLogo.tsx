import { JAL_COLORS, JAL_MARK, JAL_NAME, JAL_TAGLINE } from "../lib/jal-brand";

type Props = {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: "dark" | "light";
  /** badge = app-icon tile; mark = droplet only */
  iconStyle?: "badge" | "mark";
  tagline?: string;
};

/** Minimal Jal mark — teal water + black wordmark. */
export function JalLogo({
  size = 32,
  showWordmark = true,
  showTagline = false,
  tagline = JAL_TAGLINE,
  className = "",
  variant = "light",
  iconStyle = "mark",
}: Props) {
  const isLight = variant === "light";
  const brand = isLight ? JAL_COLORS.brand : JAL_COLORS.brandLight;
  const textColor = isLight ? JAL_COLORS.text : JAL_COLORS.darkText;
  const mutedColor = isLight ? JAL_COLORS.textSecondary : JAL_COLORS.darkTextSecondary;
  const tileFill = isLight ? JAL_COLORS.brand : JAL_COLORS.brand;
  const dropFill = iconStyle === "badge" ? JAL_COLORS.onPrimary : "none";
  const dropStroke = iconStyle === "badge" ? "none" : brand;
  const streamStroke = iconStyle === "badge" ? tileFill : brand;

  return (
    <span className={`jal-logo-wrap inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={JAL_MARK.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={showWordmark}
        role={showWordmark ? undefined : "img"}
        aria-label={showWordmark ? undefined : JAL_NAME}
      >
        {iconStyle === "badge" && <rect width="48" height="48" rx="11" fill={tileFill} />}
        <path d={JAL_MARK.drop} fill={dropFill} stroke={dropStroke} strokeWidth={iconStyle === "badge" ? 0 : 2} />
        <path
          d={JAL_MARK.stream}
          stroke={streamStroke}
          strokeWidth="2.25"
          strokeLinecap="round"
          fill="none"
          opacity={iconStyle === "badge" ? 0.85 : 0.7}
        />
      </svg>

      {(showWordmark || showTagline) && (
        <span className="flex flex-col leading-none">
          {showWordmark && (
            <span className="jal-wordmark text-[length:inherit]" style={{ color: textColor, fontSize: size * 0.44 }}>
              {JAL_NAME}
            </span>
          )}
          {showTagline && (
            <span className="mt-1 text-[10px] font-normal leading-snug" style={{ color: mutedColor }}>
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export default JalLogo;
