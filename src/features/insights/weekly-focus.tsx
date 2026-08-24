"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WeeklyFocusToggle({ id, completed }: { id: string; completed: boolean }) {
  const [done, setDone] = useState(completed);
  return (
    <Button
      className="mt-4"
      variant={done ? "outline" : "default"}
      onClick={async () => {
        await fetch("/api/insights/weekly", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, completed: !done }),
        });
        setDone(!done);
      }}
    >
      {done ? "Marked complete" : "Mark as practiced"}
    </Button>
  );
}

export function WeeklyFocusPrepare() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      className="mt-4"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/insights/weekly", { method: "POST" });
        setLoading(false);
        router.refresh();
      }}
    >
      {loading ? "Preparing…" : "Prepare this week’s focus"}
    </Button>
  );
}
