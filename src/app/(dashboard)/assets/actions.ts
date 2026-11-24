"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@google/genai";
import { saveAsset, SAVEABLE_IMAGE_TYPES, setAssetCampaign } from "@/lib/assets";
import { generateImage, isImageGeneratorConfigured } from "@/lib/image-generator";

export type GenerateImageState = {
  prompt?: string;
  // A data: URL the browser can show directly. Not saved anywhere yet.
  imageUrl?: string;
  error?: string;
};

export async function generateImageFromPrompt(
  _previous: GenerateImageState,
  formData: FormData,
): Promise<GenerateImageState> {
  // TODO: check the logged-in user here once auth is implemented.
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt) return { error: "Describe the image you want first." };

  if (!isImageGeneratorConfigured()) {
    return { prompt, error: "Gemini isn't connected yet. Add GEMINI_API_KEY to .env.local." };
  }

  try {
    const image = await generateImage(prompt);
    return { prompt, imageUrl: `data:${image.mimeType};base64,${image.data}` };
  } catch (error) {
    console.error("generateImageFromPrompt failed:", error);
    if (error instanceof ApiError && error.status === 429) {
      return {
        prompt,
        error:
          "Gemini's usage limit was reached. Image models need billing enabled on your Google AI Studio project, or wait and try again later.",
      };
    }
    return { prompt, error: "Couldn't generate an image. Check the server logs for details." };
  }
}

export type SaveImageState = {
  saved?: boolean;
  error?: string;
};

// Saves the image currently shown on the page (sent back as a data: URL)
// to storage, plus an `assets` row with its prompt and (optionally) campaign.
export async function saveGeneratedImage(
  _previous: SaveImageState,
  formData: FormData,
): Promise<SaveImageState> {
  // TODO: check the logged-in user here once auth is implemented.
  const prompt = String(formData.get("prompt") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "") || null;

  const match = /^data:([^;]+);base64,(.+)$/.exec(imageUrl);
  if (!prompt || !match || !SAVEABLE_IMAGE_TYPES.includes(match[1])) {
    return { error: "There's no generated image to save." };
  }

  try {
    await saveAsset({
      prompt,
      mimeType: match[1],
      bytes: Buffer.from(match[2], "base64"),
      campaignId,
    });
  } catch (error) {
    console.error("saveGeneratedImage failed:", error);
    return { error: "Couldn't save the image. Check the server logs for details." };
  }

  revalidatePath("/assets");
  if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
  return { saved: true };
}

// Attaches a saved asset to a campaign (or detaches it when campaignId is "").
export async function linkAssetToCampaign(
  assetId: string,
  campaignId: string,
): Promise<{ error?: string }> {
  // TODO: check the logged-in user here once auth is implemented.
  try {
    await setAssetCampaign(assetId, campaignId || null);
  } catch (error) {
    console.error("linkAssetToCampaign failed:", error);
    return { error: "Couldn't change the campaign. Check the server logs for details." };
  }

  revalidatePath("/assets");
  // The asset may have moved off another campaign too, so refresh every campaign page.
  revalidatePath("/campaigns/[id]", "page");
  return {};
}
