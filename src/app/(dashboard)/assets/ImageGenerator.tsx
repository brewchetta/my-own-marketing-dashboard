"use client";

import { startTransition, useActionState, useState } from "react";
import {
  generateImageFromPrompt,
  saveGeneratedImage,
  type GenerateImageState,
  type SaveImageState,
} from "./actions";
import type { CampaignOption } from "@/lib/campaigns";
import CampaignSelect from "./CampaignSelect";

// `defaultCampaignId` pre-selects a campaign to save to (e.g. when arriving
// from a campaign page via /assets?campaign=<id>).
export default function ImageGenerator({
  campaigns,
  defaultCampaignId,
}: {
  campaigns: CampaignOption[];
  defaultCampaignId?: string;
}) {
  const [state, formAction, pending] = useActionState<GenerateImageState, FormData>(
    generateImageFromPrompt,
    {},
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="prompt" className="text-sm font-medium text-gray-900">
          Describe the image
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={3}
          required
          defaultValue={state.prompt}
          placeholder="e.g. A flat-lay of fresh coffee beans and a ceramic mug on a linen tablecloth, warm morning light"
          className="rounded border border-gray-300 p-3 text-sm"
        />
        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {pending ? "Generating… (this can take a few seconds)" : "Generate image"}
          </button>
        </div>
      </form>

      {state.error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.imageUrl && (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image adds nothing here */}
          <img
            src={state.imageUrl}
            alt={state.prompt ?? "Generated image"}
            className={`max-w-xl rounded border border-gray-200 ${pending ? "opacity-50" : ""}`}
          />
          {/* Keyed by image so the "Saved" state resets for each new image. */}
          <SaveImageForm
            key={state.imageUrl}
            prompt={state.prompt ?? ""}
            imageUrl={state.imageUrl}
            campaigns={campaigns}
            defaultCampaignId={defaultCampaignId}
          />
        </div>
      )}
    </div>
  );
}

function SaveImageForm({
  prompt,
  imageUrl,
  campaigns,
  defaultCampaignId,
}: {
  prompt: string;
  imageUrl: string;
  campaigns: CampaignOption[];
  defaultCampaignId?: string;
}) {
  const [state, formAction, pending] = useActionState<SaveImageState, FormData>(
    saveGeneratedImage,
    {},
  );
  const [campaignId, setCampaignId] = useState(defaultCampaignId ?? "");

  // Submitted by hand rather than with <form action>, which resets the form
  // afterwards and would show "No campaign" even though the image was saved to one.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="prompt" value={prompt} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <CampaignSelect
        name="campaignId"
        campaigns={campaigns}
        value={campaignId}
        onChange={(e) => setCampaignId(e.target.value)}
        disabled={pending || state.saved}
        aria-label="Campaign to attach the image to"
      />
      <button
        type="submit"
        disabled={pending || state.saved}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {state.saved ? "Saved" : pending ? "Saving…" : "Save image"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
