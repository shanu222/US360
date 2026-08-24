import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { parseWhatsAppChat, guessPartnerName, normalizeChatText } from "@/chat/parse";
import { analyzeWhatsAppChat } from "@/chat/analyze";
import { extractWhatsAppTextFromZip } from "@/chat/unzip-client";

const NNBSP = "\u202f";
const LTR = "\u200e";

function ios(name: string, body: string, stamp = `[18/07/2026, 1:52:21${NNBSP}AM]`) {
  return `${LTR}${stamp} ${name}: ${body}`;
}

const SAMPLE = [
  ios("Asma Tariq", "Messages and calls are end-to-end encrypted. Only people in this chat can read them."),
  ios("Asma Tariq", "Good morning. I like biryani and chai after class."),
  ios("Shahnawaz", "I will call you after university. I promise I will not be late."),
  ios("Asma Tariq", `Our orientation starts ${LTR}<attached: 00000144-PHOTO-2026-07-18-12-00-42.jpg>`),
  ios("Asma Tariq", `${LTR}<attached: 00000145-AUDIO-2026-07-18-12-22-31.opus>`),
  ios("Shahnawaz", "I miss you. See you at campus."),
  ios("Asma Tariq", "I don't like smoking around me. I need healthy habits around me."),
  "this is a continuation of the previous line about respect and care",
  ios("Asma Tariq", "Voice call"),
  "19/07/2026, 9:41 am - Asma Tariq: Exam week is heavy but I love mango.",
  "19/07/2026, 9:42 am - Shahnawaz: We will go grocery shopping.",
].join("\n");

describe("WhatsApp parser", () => {
  it("normalizes invisible spaces used by iOS exports", () => {
    const out = normalizeChatText(`[18/07/2026, 1:52:21${NNBSP}AM] Asma Tariq: hi`);
    expect(out).toContain("1:52:21 AM");
    expect(out).not.toContain(NNBSP);
  });

  it("reads iOS, Android, captions, media, calls, and continuations", () => {
    const messages = parseWhatsAppChat(SAMPLE);
    expect(messages.length).toBeGreaterThan(8);
    expect(messages.some((m) => m.sender === "Asma Tariq")).toBe(true);
    expect(messages.some((m) => m.sender === "Shahnawaz")).toBe(true);
    expect(messages.some((m) => m.kind === "media")).toBe(true);
    expect(messages.some((m) => m.kind === "call")).toBe(true);
    expect(messages.some((m) => m.kind === "system")).toBe(true);
    const withCaption = messages.find((m) => m.text.includes("orientation"));
    expect(withCaption?.kind).toBe("text");
    expect(messages.some((m) => m.text.includes("continuation"))).toBe(true);
    expect(messages[0]?.sentAt?.getDate()).toBe(18);
    expect(messages[0]?.sentAt?.getMonth()).toBe(6);
  });

  it("guesses the partner from the export file name, not the louder sender", () => {
    const messages = parseWhatsAppChat(SAMPLE);
    expect(
      guessPartnerName(messages, {
        userName: "Shahnawaz",
        fileName: "WhatsApp Chat - Asma Tariq.zip",
      }),
    ).toBe("Asma Tariq");
  });
});

describe("WhatsApp analysis engine (no AI)", () => {
  it("fills likes, foods, promises, style, and a summary from the whole chat", () => {
    const messages = parseWhatsAppChat(SAMPLE);
    const analysis = analyzeWhatsAppChat(messages, {
      userName: "Shahnawaz",
      fileName: "WhatsApp Chat - Asma Tariq.zip",
    });
    expect(analysis.partnerName).toBe("Asma Tariq");
    expect(analysis.userSender).toBe("Shahnawaz");
    expect(analysis.messageCount).toBe(messages.length);
    expect(analysis.likes.join(" ").toLowerCase()).toMatch(/biryani|chai|mango/);
    expect(analysis.foods).toEqual(expect.arrayContaining(["biryani", "chai", "mango"]));
    expect(analysis.places.join(" ")).toMatch(/class|university|campus/i);
    expect(analysis.dislikes.join(" ").toLowerCase()).toMatch(/smoking|healthy/);
    expect(analysis.promises.some((p) => /call you|not be late/i.test(p))).toBe(true);
    expect(analysis.goodMorningCount).toBeGreaterThan(0);
    expect(analysis.mediaCount).toBeGreaterThan(0);
    expect(analysis.facts.length).toBeGreaterThan(3);
    expect(analysis.writingSamples.length).toBeGreaterThan(0);
    expect(analysis.summary).toContain("Asma Tariq");
    expect(analysis.topics.some((t) => t.topic === "class" || t.topic === "study")).toBe(true);
  });
});

describe("ZIP text extraction", () => {
  it("reads only the chat txt and counts media names without unpacking them", async () => {
    const zipped = zipSync({
      "_chat.txt": strToU8(SAMPLE),
      "00000144-PHOTO-2026-07-18.jpg": new Uint8Array([1, 2, 3, 4]),
      "00000145-AUDIO-2026-07-18.opus": new Uint8Array([5, 6]),
      "00000359-STICKER-2026-07-18.webp": new Uint8Array([7]),
    });
    const extracted = await extractWhatsAppTextFromZip(zipped);
    expect(extracted.chatFileName).toBe("_chat.txt");
    expect(extracted.text).toContain("Asma Tariq");
    expect(extracted.mediaFromNames.photos).toBe(1);
    expect(extracted.mediaFromNames.audio).toBe(1);
    expect(extracted.mediaFromNames.stickers).toBe(1);
  });
});
