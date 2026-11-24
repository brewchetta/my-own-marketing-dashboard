import type { CampaignStatus } from "@/lib/types";

const STYLES: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-50 text-blue-700",
  sent: "bg-green-50 text-green-700",
};

const LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
};

export default function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
