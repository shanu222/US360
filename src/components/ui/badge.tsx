import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "rose" | "success" | "warning" | "navy";
}) {
  const tones = {
    default: "bg-paper text-ink",
    rose: "bg-[#f3e6e3] text-rose",
    success: "bg-[#e6efe8] text-success",
    warning: "bg-[#f4eadc] text-warning",
    navy: "bg-navy text-cream",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
