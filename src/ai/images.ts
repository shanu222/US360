export interface ImagePromptInput {
  theme: string;
  occasion?: string;
  season?: string;
  preferences?: string[];
  mood?: string;
}

export function buildImagePrompt(input: ImagePromptInput) {
  const prefs = input.preferences?.slice(0, 3).join(", ");
  return [
    "Elegant photographic still-life background for a premium greeting card.",
    `Theme: ${input.theme}.`,
    input.occasion ? `Occasion: ${input.occasion}.` : "",
    input.season ? `Season: ${input.season}.` : "",
    prefs ? `Subtle nods to: ${prefs}.` : "",
    input.mood ? `Mood: ${input.mood}.` : "Mood: calm, warm, sophisticated.",
    "No text, no letters, no logos, no faces, no watermarks.",
    "Soft light, refined composition, high-end lifestyle photography.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateBackgroundImage(prompt: string): Promise<string | null> {
  const key = process.env.IMAGE_API_KEY || process.env.AI_API_KEY;
  if (!key || (process.env.IMAGE_PROVIDER ?? "openai") === "none") return null;

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: key });
    const result = await client.images.generate({
      model: process.env.IMAGE_MODEL ?? "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });
    return result.data?.[0]?.url ?? null;
  } catch (error) {
    console.error("Image generation failed", error);
    return null;
  }
}
