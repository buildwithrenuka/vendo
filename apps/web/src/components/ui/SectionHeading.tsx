type Props = {
  label: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
};

export function SectionHeading({ label, title, subtitle, align = "center", className = "" }: Props) {
  const alignClass = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left";

  return (
    <header className={`${alignClass} ${className}`}>
      <p className="section-label">{label}</p>
      <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-[1.0625rem] leading-relaxed text-landing-muted">{subtitle}</p>}
    </header>
  );
}
