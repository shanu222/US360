import { CommandBar } from "@/features/assistant/command-bar";

export default function RestaurantsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Restaurants</h1>
        <p className="mt-2 text-muted">
          Places to eat, dishes, and cuisines. Tap a chip or name an area such as F-10. Live search is used when API keys
          are set; otherwise the city catalog is labeled as catalog.
        </p>
      </div>
      <CommandBar focus="food" />
    </div>
  );
}
