"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/analytics", label: "Analytics" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/assets", label: "Assets" },
  { href: "/calendar", label: "Calendar" },
  { href: "/brand-kit", label: "Brand Kit" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded px-3 py-2 text-sm ${
              active ? "bg-gray-200 font-medium" : "hover:bg-gray-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
