interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

const SectionHeader = ({ title, subtitle, className = "", align = "left" }: SectionHeaderProps) => {
  return (
    <div className={`mb-8 ${align === "center" ? "text-center" : ""} ${className}`}>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;
