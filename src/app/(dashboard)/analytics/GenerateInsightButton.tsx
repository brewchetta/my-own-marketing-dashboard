"use client";

import { useActionState } from "react";
import { generateInsights, type InsightState } from "./actions";

// Shown only when the latest week has no insight yet. On success the action
// revalidates the page, which then renders the saved insight instead of this.
export default function GenerateInsightButton() {
  const [state, formAction, pending] = useActionState<InsightState>(generateInsights, {});

  return (
    <div className="flex flex-col gap-3 rounded border border-dashed border-gray-300 p-5">
      <p className="text-sm text-gray-600">
        No insight for last week yet. Generate one to get a plain-English explanation of what
        changed and why.
      </p>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "Analyzing… (this can take a few seconds)" : "Generate insight"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}
