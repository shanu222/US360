import { describe, expect, it } from "vitest";
import { commandExamples, genderedCopy, oppositeGender, parseGender, voiceFor } from "@/lib/voice";
import { profileFields } from "@/engine/profile-fields";

describe("gender voice", () => {
  it("parses only male or female", () => {
    expect(parseGender("Male")).toBe("male");
    expect(parseGender("FEMALE")).toBe("female");
    expect(parseGender("other")).toBeNull();
    expect(oppositeGender("male")).toBe("female");
  });

  it("leaves female copy unchanged", () => {
    expect(genderedCopy("Give her some space", "female")).toBe("Give her some space");
    expect(genderedCopy("She prefers short messages", null)).toBe("She prefers short messages");
  });

  it("rewrites she/her copy for a male partner", () => {
    expect(genderedCopy("Give her some space", "male")).toBe("Give him some space");
    expect(genderedCopy("Remember to wish her good luck.", "male")).toBe("Remember to wish him good luck.");
    expect(genderedCopy("Make her smile", "male")).toBe("Make him smile");
    expect(genderedCopy("Her profile says she prefers space after conflict.", "male")).toBe(
      "His profile says he prefers space after conflict.",
    );
    expect(genderedCopy("forgot her birthday", "male")).toBe("forgot his birthday");
    expect(genderedCopy("Prepare a reminder for her", "male")).toBe("Prepare a reminder for him");
  });

  it("builds partner-gendered profile labels and examples", () => {
    const his = profileFields("male").find((f) => f.key === "makes_happy")?.label;
    const hers = profileFields("female").find((f) => f.key === "makes_happy")?.label;
    expect(his).toContain("him");
    expect(hers).toContain("her");
    expect(commandExamples("male")[0]).toBe("He is angry.");
    expect(commandExamples("female")[0]).toBe("She is angry.");
    expect(voiceFor("male").They).toBe("He");
  });
});
