import { useEffect } from "react";

/** Cursor-following phosphor glow — hypnotic depth */
export function HypnoticCursor() {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--hypno-x", "50%");
    root.style.setProperty("--hypno-y", "40%");

    const onMove = (e: MouseEvent) => {
      root.style.setProperty("--hypno-x", `${e.clientX}px`);
      root.style.setProperty("--hypno-y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      <div className="hypno-cursor-glow hypno-cursor-glow-a" aria-hidden />
      <div className="hypno-cursor-glow hypno-cursor-glow-b" aria-hidden />
    </>
  );
}
