import type { CSSProperties, ReactNode } from "react";
import { useInView } from "../../hooks/useInView";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Scroll-triggered fade — Apple-style, runs once. */
export function Reveal({ children, className = "", delay = 0 }: Props) {
  const { ref, inView } = useInView({ once: true });

  return (
    <div
      ref={ref}
      className={`jal-reveal ${inView ? "jal-reveal--in" : ""} ${className}`.trim()}
      style={{ "--jal-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
