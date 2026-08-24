import { describe, expect, it } from "vitest";
import {
  addItems,
  extrasNotInOptions,
  joinList,
  optionsFor,
  optionsForFavoriteCategory,
  parseList,
  toggleItem,
} from "@/engine/profile-options";
import { profileFields } from "@/engine/profile-fields";

describe("profile select-or-write values", () => {
  it("parses commas, semicolons, and newlines without duplicates", () => {
    expect(parseList("Roses, tulips; Jasmine\nRoses")).toEqual(["Roses", "tulips", "Jasmine"]);
    expect(joinList(["Roses", "tulips"])).toBe("Roses, tulips");
  });

  it("toggles multi-select and replaces on single-select", () => {
    expect(toggleItem(["Roses"], "Tulips", true)).toEqual(["Roses", "Tulips"]);
    expect(toggleItem(["Roses", "Tulips"], "Roses", true)).toEqual(["Tulips"]);
    expect(toggleItem(["Mild"], "Hot", false)).toEqual(["Hot"]);
  });

  it("keeps custom writes that are not in the option list", () => {
    const extras = extrasNotInOptions(["Roses", "Gardenias"], optionsFor("flowers"));
    expect(extras).toEqual(["Gardenias"]);
    expect(addItems(["Roses"], "Gardenias, peonies", true)).toEqual(["Roses", "Gardenias", "peonies"]);
  });

  it("maps onboarding favorite categories to option catalogs", () => {
    expect(optionsForFavoriteCategory("music").length).toBeGreaterThan(0);
    expect(optionsForFavoriteCategory("appreciates")).toContain("Thoughtful texts");
  });

  it("marks profile fields as chips or choice so the form can select instead of only write", () => {
    const spices = profileFields("female").find((f) => f.key === "partner_spice");
    const flowers = profileFields("male").find((f) => f.key === "flowers");
    const memories = profileFields("female").find((f) => f.key === "memories_note");
    expect(spices?.kind).toBe("choice");
    expect(flowers?.kind).toBe("chips");
    expect(memories?.kind).toBe("textarea");
  });
});
