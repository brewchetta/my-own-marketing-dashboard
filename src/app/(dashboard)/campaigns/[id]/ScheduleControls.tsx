"use client";

import { useState, useTransition } from "react";
import {
  markSentAction,
  scheduleCampaignAction,
  unscheduleCampaignAction,
  type ScheduleState,
} from "../actions";
import type { CampaignStatus } from "@/lib/types";

// The browser's local date as "YYYY-MM-DD", for the date picker's min/default.
function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Schedule / Reschedule / Unschedule / Mark as sent for one campaign. Each
// action also updates the campaign's email entry on the calendar.
export default function ScheduleControls({
  campaignId,
  status,
  scheduledDate,
  hasEmail,
}: {
  campaignId: string;
  status: CampaignStatus;
  scheduledDate: string | null; // "YYYY-MM-DD"
  hasEmail: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === "sent") return null;

  function run(action: () => Promise<ScheduleState>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else onSuccess?.();
    });
  }

  function openPicker() {
    setDate(scheduledDate && scheduledDate >= localDate() ? scheduledDate : localDate(1));
    setError(null);
    setOpen(true);
  }

  function schedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    run(
      () => scheduleCampaignAction(campaignId, {}, formData),
      () => setOpen(false),
    );
  }

  const buttonClass =
    "rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "scheduled" && (
          <>
            <button
              type="button"
              disabled={pending}
              className={buttonClass}
              onClick={() => {
                if (confirm("Move this campaign back to drafts? Its email is taken off the calendar.")) {
                  run(() => unscheduleCampaignAction(campaignId));
                }
              }}
            >
              Unschedule
            </button>
            <button
              type="button"
              disabled={pending}
              className={buttonClass}
              onClick={() => {
                if (confirm("Mark this campaign as sent?")) run(() => markSentAction(campaignId));
              }}
            >
              Mark as sent
            </button>
          </>
        )}
        <button
          type="button"
          disabled={pending || !hasEmail}
          onClick={() => (open ? setOpen(false) : openPicker())}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {status === "scheduled" ? "Reschedule" : "Schedule"}
        </button>
      </div>

      {!hasEmail && (
        <p className="text-xs text-gray-500">Write the email before scheduling it.</p>
      )}

      {open && (
        <form
          onSubmit={schedule}
          className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4 shadow-sm"
        >
          <label htmlFor="schedule-date" className="text-sm font-medium">
            Send date
          </label>
          <input
            id="schedule-date"
            type="date"
            name="date"
            required
            min={localDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500">The email shows up on the calendar on this day.</p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending || !date}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {pending ? "Scheduling…" : "Schedule"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
