import Link from "next/link";
import { CommandBar } from "@/features/assistant/command-bar";

export default function FoodPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Food</h1>
        <p className="mt-2 text-muted">Restaurants and what to order. Places to visit are on Explore.</p>
        <p className="mt-2 text-sm">
          City and food likes live on{" "}
          <Link className="underline" href="/profile">
            Profile
          </Link>
          .
        </p>
      </div>
      <CommandBar focus="food" />
    </div>
  );
}
