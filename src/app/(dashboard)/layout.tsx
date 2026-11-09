import { Suspense } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col gap-6 border-r border-gray-200 p-4">
        <Link href="/" className="px-3 text-lg font-semibold">
          Marketing Dashboard
        </Link>
        <Suspense fallback={<div className="flex-1" />}>
          <Nav />
        </Suspense>
        <Link href="/login" className="mt-auto px-3 text-sm text-gray-500 hover:underline">
          Log out
        </Link>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
