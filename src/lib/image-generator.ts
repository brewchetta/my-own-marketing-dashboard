import "server-only";
import { GoogleGenAI } from "@google/genai";

// Generates campaign images with Gemini. Needs GEMINI_API_KEY in .env.local.

const MODEL = "gemini-3.1-flash-image";

export type GeneratedImage = {
  mimeType: string;
  // Base64-encoded image bytes.
  data: string;
};

export function isImageGeneratorConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseModalities: ["IMAGE"] },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((part) => part.inlineData?.data)?.inlineData;
  if (image?.data) {
    return { mimeType: image.mimeType ?? "image/png", data: image.data };
  }

  // No image: report why if Gemini said (blocked prompt, safety, etc.).
  const reason =
    response.promptFeedback?.blockReason ??
    response.candidates?.[0]?.finishReason ??
    "no reason given";
  throw new Error(`Gemini returned no image (${reason}).`);
}
