"use client";

import { CARD_THEMES } from "@/ai/cards";
import { CardMotif, motifForTheme } from "@/components/card-motif";
import { cardKicker } from "@/lib/card-copy";
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
  const label = cardKicker(kicker);
  const light = theme.category === "GOOD_NIGHT" || ["aurora", "ruby", "night-city", "lantern", "dusk-rose"].includes(theme.id);

  return (
    <div
      className={cn("love-card relative overflow-hidden rounded-[2rem] shadow-soft", className)}
      style={{ background: theme.background, color: theme.text, minHeight: 480 }}
    >
      <CardMotif kind={motifForTheme(theme.id)} accent={theme.accent} light={light} />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-45 blur-2xl"
        style={{ background: theme.accent }}
      />
      <div
        className="pointer-events-none absolute right-10 top-16 h-24 w-24 rounded-full opacity-30 blur-xl"
        style={{ background: theme.accent }}
      />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-28 w-[120%] -translate-x-1/2 rounded-[100%] opacity-20" style={{ background: theme.accent }} />
      <div className="absolute inset-[14px] rounded-[1.55rem] border border-white/30" />
      <div className="relative z-10 flex min-h-[480px] flex-col items-center justify-center px-9 py-14 text-center">
        {label ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] opacity-80">{label}</p>
        ) : null}
        <p className="mt-6 max-w-md font-display text-4xl font-semibold leading-tight md:text-5xl">
          {message || "Your words will appear here."}
        </p>
        <div className="mt-8 h-px w-16 opacity-70" style={{ background: theme.accent }} />
        {partnerName ? (
          <p className="mt-5 text-xs uppercase tracking-[0.22em]" style={{ color: theme.accent }}>
            For {partnerName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
