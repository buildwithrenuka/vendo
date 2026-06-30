import { useEffect, useId, useState } from "react";

type Props = {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: "dark" | "light";
  animated?: boolean;
};

export function VendoLogo({
  size = 32,
  showWordmark = true,
  showTagline = false,
  className = "",
  variant = "dark",
  animated = true,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const isLight = variant === "light";
  const wordColor = isLight ? "text-[var(--color-landing-text)]" : "text-white";
  const gradId = `vendo-grad-${uid}`;
  const ringGradId = `vendo-ring-${uid}`;
  const trailGradId = `vendo-trail-${uid}`;
  const clipId = `vendo-clip-${uid}`;
  const markClass = animated ? "vendo-logo vendo-logo--alive" : "vendo-logo";
  const writeStart = 0.85;
  const typeDuration = 0.95;
  const writeEnd = writeStart + typeDuration;
  const [wordWritten, setWordWritten] = useState(!animated);

  useEffect(() => {
    if (!animated) {
      setWordWritten(true);
      return;
    }
    setWordWritten(false);
    const t = window.setTimeout(() => setWordWritten(true), (writeEnd + 0.2) * 1000);
    return () => window.clearTimeout(t);
  }, [animated, writeEnd]);

  const cyan = isLight ? "#0e7490" : "#22d3ee";
  const pink = isLight ? "#0891b2" : "#f472b6";
  const bg = isLight ? "#fefefe" : "#0a0a0a";
  const bgStroke = isLight ? "#e5e7eb" : "none";

  return (
    <span className={`vendo-logo-wrap inline-flex items-center gap-2.5 ${className}`}>
      <svg
        className={markClass}
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={showWordmark}
        role={showWordmark ? undefined : "img"}
        aria-label={showWordmark ? undefined : "Vendo"}
      >
        <defs>
          <clipPath id={clipId}>
            <rect width="48" height="48" rx="14" />
          </clipPath>
          <linearGradient id={gradId} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop className="vendo-logo-grad-a" stopColor={cyan} />
            <stop className="vendo-logo-grad-b" offset="1" stopColor={pink} />
          </linearGradient>
          <linearGradient id={ringGradId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor={cyan} stopOpacity="0.9" />
            <stop offset="0.45" stopColor={pink} stopOpacity="0.5" />
            <stop offset="1" stopColor={cyan} stopOpacity="0.15" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              from="0 24 24"
              to="360 24 24"
              dur="4s"
              repeatCount="indefinite"
            />
          </linearGradient>
          <linearGradient id={trailGradId} x1="24" y1="32" x2="24" y2="14" gradientUnits="userSpaceOnUse">
            <stop stopColor={cyan} stopOpacity="0" />
            <stop offset="0.6" stopColor={cyan} stopOpacity="0.85" />
            <stop offset="1" stopColor={pink} stopOpacity="1" />
          </linearGradient>
          <filter id={`vendo-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Spinning aurora ring */}
        <rect
          className="vendo-logo-ring"
          x="1.25"
          y="1.25"
          width="45.5"
          height="45.5"
          rx="13"
          fill="none"
          stroke={`url(#${ringGradId})`}
          strokeWidth="1.75"
          pathLength={100}
        />

        <rect
          className="vendo-logo-bg"
          width="48"
          height="48"
          rx="14"
          fill={bg}
          stroke={bgStroke !== "none" ? bgStroke : undefined}
          strokeWidth={isLight ? 1 : 0}
        />

        <g clipPath={`url(#${clipId})`}>
          {/* Aurora blobs inside */}
          <circle className="vendo-logo-blob vendo-logo-blob-a" cx="14" cy="16" r="10" fill={cyan} opacity={isLight ? 0.07 : 0.14} />
          <circle className="vendo-logo-blob vendo-logo-blob-b" cx="36" cy="30" r="11" fill={pink} opacity={isLight ? 0.06 : 0.12} />

          {/* Sonar ripples from vendor dot */}
          <circle className="vendo-logo-ripple vendo-logo-ripple-1" cx="24" cy="34" r="3" stroke={pink} strokeWidth="1" fill="none" />
          <circle className="vendo-logo-ripple vendo-logo-ripple-2" cx="24" cy="34" r="3" stroke={cyan} strokeWidth="1" fill="none" />
          <circle className="vendo-logo-ripple vendo-logo-ripple-3" cx="24" cy="34" r="3" stroke={pink} strokeWidth="0.75" fill="none" />

          {/* Orbiting vendor motes */}
          <g className="vendo-logo-orbit vendo-logo-orbit-a">
            <circle cx="24" cy="7" r="1.6" fill={cyan} opacity="0.9" />
          </g>
          <g className="vendo-logo-orbit vendo-logo-orbit-b">
            <circle cx="38" cy="24" r="1.3" fill={pink} opacity="0.85" />
          </g>
          <g className="vendo-logo-orbit vendo-logo-orbit-c">
            <circle cx="10" cy="28" r="1.2" fill={cyan} opacity="0.75" />
          </g>

          {/* Ghost V trail */}
          <path
            className="vendo-logo-v-ghost"
            d="M14 14 L24 34 L34 14"
            stroke={cyan}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.2"
            fill="none"
          />

          {/* Main V */}
          <path
            className="vendo-logo-v"
            d="M14 14 L24 34 L34 14"
            stroke={`url(#${gradId})`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            fill="none"
          />

          {/* Rocket trail */}
          <line
            className="vendo-logo-trail"
            x1="24"
            y1="32"
            x2="24"
            y2="16"
            stroke={`url(#${trailGradId})`}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Launch arrow */}
          <path
            className="vendo-logo-arrow"
            d="M24 31 L24 22 M20 24 L24 22 L28 24"
            stroke={cyan}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vendor landing dot */}
          <circle
            className="vendo-logo-dot"
            cx="24"
            cy="34"
            r="3"
            fill={pink}
            filter={`url(#vendo-glow-${uid})`}
          />

          {/* Sparkles */}
          <path className="vendo-logo-spark vendo-logo-spark-a" d="M8 12 L8.8 12 M8.4 11.2 L8.4 12.8" stroke={cyan} strokeWidth="0.9" strokeLinecap="round" />
          <path className="vendo-logo-spark vendo-logo-spark-b" d="M40 10 L40.7 10 M40.35 9.3 L40.35 10.7" stroke={pink} strokeWidth="0.8" strokeLinecap="round" />
          <path className="vendo-logo-spark vendo-logo-spark-c" d="M42 36 L42.6 36 M42.3 35.4 L42.3 36.6" stroke={cyan} strokeWidth="0.7" strokeLinecap="round" />
        </g>
      </svg>

      {(showWordmark || showTagline) && (
        <span className="flex flex-col leading-tight">
          {showWordmark && (
            animated ? (
              <span
                className={`vendo-typewriter text-sm font-bold tracking-tight ${isLight ? "vendo-typewriter--light" : ""} ${wordWritten ? "vendo-typewriter--done" : ""}`}
                style={{ "--vendo-type-delay": `${writeStart}s`, "--vendo-type-duration": `${typeDuration}s` } as React.CSSProperties}
                aria-label="vendo"
              >
                <span className="vendo-typewriter-text" aria-hidden>
                  vendo
                </span>
                <span className="vendo-typewriter-cursor" aria-hidden />
              </span>
            ) : (
              <span className={`text-sm font-bold tracking-tight ${wordColor}`}>vendo</span>
            )
          )}
          {showTagline && (
            <span
              className="vendo-logo-tagline text-[10px] font-medium text-[var(--color-landing-muted)]"
              style={animated ? { animationDelay: `${writeEnd + 0.15}s` } : undefined}
            >
              Onboard vendors fast
            </span>
          )}
        </span>
      )}
    </span>
  );
}
