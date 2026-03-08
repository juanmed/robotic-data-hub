import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard = ({ children, className, hover = true }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300",
        hover && "hover:border-primary/30 hover:shadow-[0_0_25px_hsl(var(--primary)/0.1)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
