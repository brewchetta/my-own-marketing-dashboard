"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { writeEmail, type CampaignFormState, type CampaignFormValues } from "./actions";
import type { BrandKit, Campaign } from "@/lib/types";

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

// Used for both creating and editing. Pass `campaign` to prefill the fields.
// "Write with Claude" fills in the subject and body; nothing is saved until
// the marketer clicks Save, so they can edit Claude's draft first.
export default function CampaignForm({
  action,
  brandKits,
  campaign,
  submitLabel = "Save campaign",
  cancelHref = "/campaigns",
}: {
  action: (prev: CampaignFormState, formData: FormData) => Promise<CampaignFormState>;
  brandKits: Pick<BrandKit, "id" | "name">[];
  campaign?: Campaign;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction, saving] = useActionState(action, {});
  const [writing, startWriting] = useTransition();
  const [writeError, setWriteError] = useState<string | null>(null);

  // Controlled so "Write with Claude" can read the brief and fill in the email.
  const [values, setValues] = useState<CampaignFormValues>(
    () =>
      state.values ?? {
        name: campaign?.name ?? "",
        // Single brand: default to the first (usually only) brand kit.
        brandKitId: campaign?.brand_kit_id ?? brandKits[0]?.id ?? "",
        brief: campaign?.brief ?? "",
        subject: campaign?.subject ?? "",
        body: campaign?.body ?? "",
      },
  );
  const set = (key: keyof CampaignFormValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const hasEmail = Boolean(values.subject || values.body);
  const busy = saving || writing;

  function write() {
    if (hasEmail && !confirm("Replace the current subject and body with a new draft?")) return;
    setWriteError(null);
    startWriting(async () => {
      const result = await writeEmail({
        name: values.name,
        brief: values.brief,
        brandKitId: values.brandKitId,
      });
      if ("error" in result) setWriteError(result.error);
      else setValues((v) => ({ ...v, ...result.email }));
    });
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {state.error && <Alert>{state.error}</Alert>}

      <Field
        label="Campaign name"
        htmlFor="name"
        hint="For you only. Readers never see it."
        error={state.fieldErrors?.name}
      >
        <input
          id="name"
          name="name"
          required
          value={values.name}
          onChange={set("name")}
          className={inputClass}
          placeholder="e.g. Holiday Sale Kickoff"
        />
      </Field>

      <Field
        label="Brand"
        htmlFor="brandKitId"
        hint="Claude writes in this brand kit's voice."
        error={state.fieldErrors?.brandKitId}
      >
        <select
          id="brandKitId"
          name="brandKitId"
          required
          value={values.brandKitId}
          onChange={set("brandKitId")}
          className={inputClass}
        >
          {!values.brandKitId && <option value="">Pick a brand kit</option>}
          {brandKits.map((kit) => (
            <option key={kit.id} value={kit.id}>
              {kit.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Brief"
        htmlFor="brief"
        hint="What the email is for: the offer, dates, and the one thing you want readers to do."
      >
        <textarea
          id="brief"
          name="brief"
          rows={4}
          value={values.brief}
          onChange={set("brief")}
          className={inputClass}
          placeholder="Announce the holiday sale: 25% off everything through Nov 30. Send people to the sale page."
        />
      </Field>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={write}
          disabled={busy || !values.brief.trim() || !values.brandKitId}
          className="self-start rounded border border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          {writing
            ? "Writing… (this can take a few seconds)"
            : hasEmail
              ? "Rewrite with Claude"
              : "Write with Claude"}
        </button>
        {!values.brief.trim() && (
          <p className="text-xs text-gray-500">Add a brief to have Claude write the email.</p>
        )}
        {writeError && <Alert>{writeError}</Alert>}
      </div>

      <fieldset
        className={`flex flex-col gap-4 rounded border border-gray-200 p-4 ${writing ? "opacity-50" : ""}`}
      >
        <legend className="px-1 text-sm font-medium">Email</legend>
        {!hasEmail && !writing && (
          <p className="text-xs text-gray-500">
            Click Write with Claude to draft these, or write them yourself.
          </p>
        )}
        <Field label="Subject line" htmlFor="subject">
          <input
            id="subject"
            name="subject"
            value={values.subject}
            onChange={set("subject")}
            readOnly={writing}
            className={inputClass}
          />
        </Field>
        <Field label="Body" htmlFor="body">
          <textarea
            id="body"
            name="body"
            rows={14}
            value={values.body}
            onChange={set("body")}
            readOnly={writing}
            className={inputClass}
          />
        </Field>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {children}
    </p>
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
