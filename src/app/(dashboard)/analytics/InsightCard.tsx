import { formatPeriod } from "@/lib/format";
import type { InsightContent } from "@/lib/insights";

// Renders one saved insight. Server component; used for the latest insight and
// inside each past insight.
export default function InsightCard({
  period,
  createdAt,
  content,
}: {
  period: string;
  createdAt: string | null;
  content: InsightContent;
}) {
  return (
    <article className="flex flex-col gap-5 rounded border border-gray-200 p-5 text-sm">
      <p className="text-xs text-gray-500">
        {formatPeriod(period)}
        {content.previousPeriod && ` vs ${formatPeriod(content.previousPeriod)}`}
        {createdAt && ` · Generated ${formatDate(createdAt)}`}
      </p>

      {content.whatChanged.length > 0 && (
        <Block title="What changed">
          <ul className="flex flex-col gap-2">
            {content.whatChanged.map((item, i) => (
              <li key={i}>
                <span className="font-medium">{item.metric}:</span> {item.detail}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {content.hypothesis && (
        <Block title="Why it might have happened">
          <p className="whitespace-pre-line">{content.hypothesis}</p>
        </Block>
      )}

      {content.considerations.length > 0 && (
        <Block title="Things to consider">
          <ul className="list-disc space-y-1 pl-5">
            {content.considerations.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Block>
      )}

      {content.missingMetrics.length > 0 && (
        <p className="rounded bg-amber-50 p-3 text-xs text-amber-800">
          Missing from this data: {content.missingMetrics.join(", ")}.
        </p>
      )}
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      {children}
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
