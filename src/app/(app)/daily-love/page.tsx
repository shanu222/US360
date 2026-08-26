"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DailyCardStudio } from "@/features/daily/daily-card-studio";

function DailyLoveInner() {
  const params = useSearchParams();
  const kind = params.get("kind") ?? "morning";
  return <DailyCardStudio initialKind={kind} />;
}

export default function DailyLovePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading Daily Love…</p>}>
      <DailyLoveInner />
    </Suspense>
  );
}
