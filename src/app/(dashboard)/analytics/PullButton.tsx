"use client";

import { useActionState } from "react";
import { pullLatestAnalytics, type PullState } from "./actions";

export default function PullButton() {
  const [state, formAction, pending] = useActionState<PullState>(pullLatestAnalytics, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Pulling…" : "Pull last week from Google Analytics"}
      </button>
      {state.message && (
        <p
          role="status"
          className={`max-w-xs text-right text-xs ${
            state.status === "error" ? "text-red-600" : "text-gray-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
