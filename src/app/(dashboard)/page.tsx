import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const sections = [
  { href: "/analytics", title: "Analytics", text: "Pull performance numbers and see insights." },
  { href: "/campaigns", title: "Campaigns", text: "Write and manage email campaigns." },
  { href: "/assets", title: "Assets", text: "Generate imagery for campaigns." },
  { href: "/calendar", title: "Calendar", text: "Plan and track what's scheduled." },
];

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="Your brand's marketing at a glance." />
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded border border-gray-200 p-4 hover:border-gray-400"
          >
            <h2 className="font-medium">{s.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{s.text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
