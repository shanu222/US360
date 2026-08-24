"use client";

import { CARD_THEMES } from "@/ai/cards";
import { cn } from "@/lib/utils";

export function LoveCard({
  message,
  themeId,
  partnerName,
  kicker,
  className,
}: {
  message: string;
  themeId: string;
  partnerName?: string | null;
  kicker?: string;
  className?: string;
}) {
  const theme = CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[4];
  return (
    <div
      className={cn("love-card relative overflow-hidden rounded-[2rem] shadow-soft", className)}
      style={{ background: theme.background, color: theme.text, minHeight: 420 }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-50 blur-2xl"
        style={{ background: theme.accent }}
      />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/35 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay" style={{ background: theme.overlay }} />
      <span className="love-spark absolute left-[14%] top-[16%] h-2 w-2 rounded-full" style={{ background: theme.accent }} />
      <span className="love-spark love-spark-delay absolute right-[18%] top-[26%] h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
      <span className="love-spark absolute bottom-[20%] left-[22%] h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
      <span className="love-spark love-spark-delay absolute bottom-[32%] right-[16%] h-2 w-2 rounded-full bg-white/80" />
      <div className="absolute inset-4 rounded-[1.6rem] border border-white/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
      <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-center px-8 py-12 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.34em] opacity-80">{kicker || theme.label}</p>
        <p className="mt-6 max-w-md font-display text-4xl font-semibold leading-tight md:text-5xl">
          {message || "Your words will appear here."}
        </p>
        <div className="mt-8 h-px w-16 opacity-70" style={{ background: theme.accent }} />
        {partnerName ? (
          <p className="mt-5 text-xs uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
            For {partnerName}
          </p>
        ) : null}
      </div>
      <p className="absolute bottom-4 left-0 right-0 z-10 text-center text-[10px] uppercase tracking-[0.32em] opacity-40">
        US360
      </p>
    </div>
  );
}
