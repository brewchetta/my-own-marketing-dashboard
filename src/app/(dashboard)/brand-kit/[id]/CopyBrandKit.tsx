"use client";

import { useEffect, useState } from "react";

// Shows the brand kit as plain text with a button to copy it, so it can be
// pasted into an AI tool, a doc, or a brief.
export default function CopyBrandKit({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Copy brand info</h2>
          <p className="text-xs text-gray-500">
            Everything above as plain text, ready to paste into any tool.
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          {status === "copied" ? "Copied!" : "Copy to clipboard"}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
        {text}
      </pre>
      <p aria-live="polite" className="text-xs text-red-600">
        {status === "failed" && "Couldn't copy automatically. Select the text above and copy it."}
      </p>
    </section>
  );
}
