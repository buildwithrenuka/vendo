import { JalLogo } from "../JalLogo";

const RIVER_PATH =
  "M 20 200 C 120 80, 200 320, 340 180 S 560 60, 720 200 S 900 280, 980 160";

const PARTICLE_COUNT = 24;

export function HypnoticPortal() {
  return (
    <div className="hypno-portal" aria-hidden>
      <div className="hypno-vortex hypno-vortex-1" />
      <div className="hypno-vortex hypno-vortex-2" />
      <div className="hypno-vortex hypno-vortex-3" />

      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="hypno-sonar" style={{ animationDelay: `${i * 1.1}s` }} />
      ))}

      <svg className="hypno-portal-svg" viewBox="0 0 1000 360" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="hypnoRiverFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.02" />
            <stop offset="35%" stopColor="#00f5d4" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#7c5cff" stopOpacity="0.5" />
            <stop offset="78%" stopColor="#ff6b4a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffc857" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="hypnoRiverLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f5d4" />
            <stop offset="50%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#ff6b4a" />
          </linearGradient>
          <filter id="hypnoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hypnoGlowStrong" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="hypno-river-body"
          d={RIVER_PATH}
          fill="none"
          stroke="url(#hypnoRiverFill)"
          strokeWidth="48"
          strokeLinecap="round"
        />
        <path
          className="hypno-river-dash"
          d={RIVER_PATH}
          fill="none"
          stroke="url(#hypnoRiverLine)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 18"
        />
        <path
          className="hypno-river-dash hypno-river-dash-reverse"
          d={RIVER_PATH}
          fill="none"
          stroke="url(#hypnoRiverLine)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="2 24"
          opacity="0.5"
        />

        {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
          const dur = 5 + (i % 7) * 0.85;
          const begin = -(i * (dur / PARTICLE_COUNT));
          const r = 2 + (i % 4);
          const colors = ["#00f5d4", "#7c5cff", "#ff6b4a", "#ffc857"];
          const fill = colors[i % colors.length];
          return (
            <circle key={i} r={r} fill={fill} filter="url(#hypnoGlow)" opacity={0.65 + (i % 3) * 0.12}>
              <animateMotion
                dur={`${dur}s`}
                repeatCount="indefinite"
                begin={`${begin}s`}
                path={RIVER_PATH}
                calcMode="linear"
              />
            </circle>
          );
        })}

        <circle cx="500" cy="180" r="72" fill="none" stroke="url(#hypnoRiverLine)" strokeWidth="1" opacity="0.25" className="hypno-core-ring" />
        <circle cx="500" cy="180" r="48" fill="rgba(0,245,212,0.06)" stroke="rgba(0,245,212,0.35)" strokeWidth="1.5" className="hypno-core-pulse" />
      </svg>

      <div className="hypno-portal-logo">
        <JalLogo size={72} variant="dark" showWordmark={false} iconStyle="badge" />
      </div>

      <div className="hypno-portal-label">
        <span className="hypno-portal-label-inner">FEEDBACK RIVER</span>
      </div>
    </div>
  );
}
