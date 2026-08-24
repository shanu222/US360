"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="font-display text-4xl text-navy">Something went quiet</h1>
      <p className="mt-3 text-sm text-muted">The page couldn’t load. Your data is safe — try again.</p>
      <Button className="mt-6" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
