import type { CampaignOption } from "@/lib/campaigns";

// A <select> of campaigns with a "No campaign" option (value "").
export default function CampaignSelect({
  campaigns,
  ...props
}: { campaigns: CampaignOption[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="max-w-full rounded border border-gray-300 px-2 py-2 text-sm disabled:opacity-50"
    >
      <option value="">No campaign</option>
      {campaigns.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
