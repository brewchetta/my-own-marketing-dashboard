import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Performance numbers and insights." />
      <section className="space-y-6">
        <div>
          <h2 className="mb-2 font-medium">Latest snapshot</h2>
          <Placeholder>No analytics snapshots yet.</Placeholder>
        </div>
        <div>
          <h2 className="mb-2 font-medium">Insights</h2>
          <Placeholder>No insights yet.</Placeholder>
        </div>
      </section>
    </>
  );
}
