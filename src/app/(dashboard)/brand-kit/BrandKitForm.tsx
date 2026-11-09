"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { BrandKitFormState } from "./actions";
import type { BrandKit, PaletteColor } from "@/lib/types";

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

const DEFAULT_PALETTE: PaletteColor[] = [
  { name: "Primary", hex: "#1F2937" },
  { name: "Accent", hex: "#F59E0B" },
];

// Used for both creating and editing. Pass `kit` to prefill the fields when editing.
export default function BrandKitForm({
  action,
  kit,
  submitLabel = "Save brand kit",
  cancelHref = "/brand-kit",
}: {
  action: (prev: BrandKitFormState, formData: FormData) => Promise<BrandKitFormState>;
  kit?: BrandKit;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [palette, setPalette] = useState<PaletteColor[]>(kit?.palette ?? DEFAULT_PALETTE);

  // After a failed submit, show what was just typed; otherwise show the saved kit.
  const values = state.values ?? {
    name: kit?.name ?? "",
    voice: kit?.voice ?? "",
    dos: kit?.dos ?? "",
    donts: kit?.donts ?? "",
  };

  function updateColor(index: number, patch: Partial<PaletteColor>) {
    setPalette((colors) => colors.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {state.error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Field
        label="Brand name"
        htmlFor="name"
        hint="The name you use with customers."
        error={state.fieldErrors?.name}
      >
        <input
          id="name"
          name="name"
          required
          defaultValue={values.name}
          className={inputClass}
          placeholder="e.g. Juniper Coffee"
        />
      </Field>

      <Field
        label="Voice"
        htmlFor="voice"
        hint="How your brand sounds. A few adjectives or a short description is enough."
      >
        <textarea
          id="voice"
          name="voice"
          rows={3}
          defaultValue={values.voice}
          className={inputClass}
          placeholder="Warm, plain-spoken, a little playful. We talk like a friend who knows coffee."
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Palette</legend>
        <p className="text-xs text-gray-500">Your brand colors. Used when generating images.</p>
        <input type="hidden" name="palette" value={JSON.stringify(palette)} />

        <ul className="flex flex-col gap-2">
          {palette.map((color, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`Color ${i + 1}`}
                value={/^#[0-9a-f]{6}$/i.test(color.hex) ? color.hex : "#000000"}
                onChange={(e) => updateColor(i, { hex: e.target.value.toUpperCase() })}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300"
              />
              <input
                aria-label={`Color ${i + 1} hex`}
                value={color.hex}
                onChange={(e) => updateColor(i, { hex: e.target.value })}
                className={`${inputClass} w-28 font-mono`}
              />
              <input
                aria-label={`Color ${i + 1} name`}
                value={color.name}
                onChange={(e) => updateColor(i, { name: e.target.value })}
                className={inputClass}
                placeholder="Name (optional)"
              />
              <button
                type="button"
                onClick={() => setPalette((colors) => colors.filter((_, j) => j !== i))}
                className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                aria-label={`Remove color ${i + 1}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setPalette((colors) => [...colors, { name: "", hex: "#FFFFFF" }])}
          className="self-start rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
        >
          + Add color
        </button>
        {state.fieldErrors?.palette && (
          <p className="text-xs text-red-600">{state.fieldErrors.palette}</p>
        )}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Do's" htmlFor="dos" hint="Things your brand always does. One per line.">
          <textarea
            id="dos"
            name="dos"
            rows={5}
            defaultValue={values.dos}
            className={inputClass}
            placeholder={"Use first names\nKeep subject lines short"}
          />
        </Field>
        <Field label="Don'ts" htmlFor="donts" hint="Things your brand avoids. One per line.">
          <textarea
            id="donts"
            name="donts"
            rows={5}
            defaultValue={values.donts}
            className={inputClass}
            placeholder={"No exclamation-mark overload\nNo discount-only messaging"}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
