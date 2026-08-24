"use client";

import { useState } from "react";
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
