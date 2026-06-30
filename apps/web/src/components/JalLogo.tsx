import { useEffect, useId, useState } from "react";
import { JAL_TAGLINE } from "../lib/jal-brand";

type Props = {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: "dark" | "light";
  animated?: boolean;
  tagline?: string;
};

/** Jal mark — water droplet with an internal flow stream (request → merge). */
export function JalLogo({
  size = 32,
  showWordmark = true,
  showTagline = false,
  tagline = JAL_TAGLINE,
  className = "",
  variant = "dark",
  animated = true,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const isLight = variant === "light";
  const markClass = animated ? "jal-logo jal-logo--alive" : "jal-logo";
  const writeStart = 0.6;
  const typeDuration = 0.7;
  const writeEnd = writeStart + typeDuration;
  const [wordWritten, setWordWritten] = useState(!animated);

  const gradId = `jal-grad-${uid}`;
  const streamGradId = `jal-stream-${uid}`;
  const clipId = `jal-clip-${uid}`;
  const glowId = `jal-glow-${uid}`;

  const phosphor = isLight ? "#00c9b1" : "#00f5d4";
  const coral = isLight ? "#e85d4c" : "#ff6b4a";
  const current = isLight ? "#6d4ed6" : "#7c5cff";
  const bg = isLight ? "#fefefe" : "#010a0f";
  const bgStroke = isLight ? "#e5e7eb" : "none";

  useEffect(() => {
    if (!animated) {
      setWordWritten(true);
      return;
    }
    setWordWritten(false);
    const t = window.setTimeout(() => setWordWritten(true), (writeEnd + 0.15) * 1000);
    return () => window.clearTimeout(t);
  }, [animated, writeEnd]);

  const nodes = [
    { cx: 24, cy: 11, delay: "0s" },
    { cx: 19, cy: 18, delay: "0.35s" },
    { cx: 29, cy: 24, delay: "0.7s" },
    { cx: 20, cy: 30, delay: "1.05s" },
    { cx: 24, cy: 36, delay: "1.4s" },
  ];

  return (
    <span className={`jal-logo-wrap inline-flex items-center gap-2.5 ${className}`}>
      <svg
        className={markClass}
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={showWordmark}
        role={showWordmark ? undefined : "img"}
        aria-label={showWordmark ? undefined : "Jal"}
      >
        <defs>
          <clipPath id={clipId}>
            <rect width="48" height="48" rx="14" />
          </clipPath>
          <linearGradient id={gradId} x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
            <stop className="jal-logo-grad-a" stopColor={phosphor} />
            <stop className="jal-logo-grad-b" offset="0.55" stopColor={current} />
            <stop className="jal-logo-grad-b" offset="1" stopColor={coral} />
          </linearGradient>
          <linearGradient id={streamGradId} x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor={phosphor} stopOpacity="0.2" />
            <stop offset="0.35" stopColor={phosphor} />
            <stop offset="0.65" stopColor={current} />
            <stop offset="1" stopColor={coral} stopOpacity="0.85" />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          className="jal-logo-ring"
          x="1.25"
          y="1.25"
          width="45.5"
          height="45.5"
          rx="13"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          opacity="0.55"
          pathLength={100}
        />

        <rect
          width="48"
          height="48"
          rx="14"
          fill={bg}
          stroke={bgStroke !== "none" ? bgStroke : undefined}
          strokeWidth={isLight ? 1 : 0}
        />

        <g clipPath={`url(#${clipId})`}>
          {/* Soft water fill inside drop */}
          <path
            className="jal-logo-fill"
            d="M24 7 C15 7 11 17 11 25 C11 31 17 38 24 41 C31 38 37 31 37 25 C37 17 33 7 24 7 Z"
            fill={phosphor}
            opacity={isLight ? 0.06 : 0.1}
          />

          {/* Droplet outline — adaptable container */}
          <path
            className="jal-logo-drop"
            d="M24 7 C15 7 11 17 11 25 C11 31 17 38 24 41 C31 38 37 31 37 25 C37 17 33 7 24 7 Z"
            stroke={`url(#${gradId})`}
            strokeWidth="1.75"
            fill="none"
            pathLength={100}
          />

          {/* Ripples at merge point */}
          <circle className="jal-logo-ripple jal-logo-ripple-1" cx="24" cy="39" r="2.5" stroke={coral} strokeWidth="0.75" fill="none" />
          <circle className="jal-logo-ripple jal-logo-ripple-2" cx="24" cy="39" r="2.5" stroke={phosphor} strokeWidth="0.75" fill="none" />
          <circle className="jal-logo-ripple jal-logo-ripple-3" cx="24" cy="39" r="2.5" stroke={current} strokeWidth="0.5" fill="none" />

          {/* Flow stream — request to ship */}
          <path
            className="jal-logo-stream"
            d="M24 10 C17 14 17 20 24 24 C31 28 31 34 24 38"
            stroke={`url(#${streamGradId})`}
            strokeWidth="2.75"
            strokeLinecap="round"
            fill="none"
            pathLength={100}
          />

          {/* Ghost stream trail */}
          <path
            className="jal-logo-stream-ghost"
            d="M24 10 C17 14 17 20 24 24 C31 28 31 34 24 38"
            stroke={phosphor}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity="0.12"
          />

          {/* Pipeline stage nodes */}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle
                className="jal-logo-node"
                style={{ animationDelay: n.delay }}
                cx={n.cx}
                cy={n.cy}
                r="2.2"
                fill={i === nodes.length - 1 ? coral : i === nodes.length - 2 ? current : phosphor}
                filter={`url(#${glowId})`}
              />
            </g>
          ))}

          {/* Flow particle */}
          <circle className="jal-logo-particle" r="1.5" fill="#fafafa" opacity="0.95">
            <animateMotion
              dur="2.8s"
              repeatCount="indefinite"
              path="M24 10 C17 14 17 20 24 24 C31 28 31 34 24 38"
            />
          </circle>

          {/* Merge fork at bottom — PR metaphor */}
          <path
            className="jal-logo-merge"
            d="M20 37 L24 40 L28 37"
            stroke={phosphor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>

      {(showWordmark || showTagline) && (
        <span className="flex flex-col leading-tight">
          {showWordmark &&
            (animated ? (
              <span
                className={`jal-typewriter text-sm font-bold tracking-tight ${isLight ? "jal-typewriter--light" : ""} ${wordWritten ? "jal-typewriter--done" : ""}`}
                style={
                  {
                    "--jal-type-delay": `${writeStart}s`,
                    "--jal-type-duration": `${typeDuration}s`,
                  } as React.CSSProperties
                }
                aria-label="jal"
              >
                <span className="jal-typewriter-text" aria-hidden>
                  jal
                </span>
                <span className="jal-typewriter-cursor" aria-hidden />
              </span>
            ) : (
              <span className={`text-sm font-bold tracking-tight ${isLight ? "text-[var(--color-landing-text)]" : "text-white"}`}>
                jal
              </span>
            ))}
          {showTagline && (
            <span
              className="jal-logo-tagline text-[10px] font-medium text-[var(--color-landing-muted)]"
              style={animated ? { animationDelay: `${writeEnd + 0.1}s` } : undefined}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export default JalLogo;
