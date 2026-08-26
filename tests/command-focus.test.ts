import { describe, expect, it } from "vitest";
import { examplesForFocus, expandCommand } from "@/lib/command-focus";

describe("command focus", () => {
  it("keeps food and explore chips separate from moment chips", () => {
    const food = examplesForFocus("food", "female").map((e) => e.label);
    const places = examplesForFocus("places", "female").map((e) => e.label);
    const moment = examplesForFocus("moment", "female").map((e) => e.label);
    const assistant = examplesForFocus("assistant", "female").map((e) => e.label);
    expect(food).toContain("Tonight");
    expect(places).toContain("Visit");
    expect(moment).toContain("She is angry");
    expect(moment.join(" ")).not.toMatch(/Tonight|Visit/);
    expect(assistant.join(" ")).toMatch(/F-10|angry|exam/i);
  });

  it("turns a short food tap into a full food command", () => {
    expect(expandCommand("cheap", "food")).toBe("What should we eat tonight? cheap");
    expect(expandCommand("What should we eat tonight?", "food")).toBe("What should we eat tonight?");
  });
});
