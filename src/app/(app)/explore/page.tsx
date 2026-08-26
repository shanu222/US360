import Link from "next/link";
import { CommandBar } from "@/features/assistant/command-bar";

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Explore</h1>
        <p className="mt-2 text-muted">Places to go and date ideas. Restaurants stay in Restaurants.</p>
        <p className="mt-2 text-sm">
          City lives on{" "}
          <Link className="underline" href="/profile">
            Profile
          </Link>
          .
        </p>
      </div>
      <CommandBar focus="places" />
    </div>
  );
}
