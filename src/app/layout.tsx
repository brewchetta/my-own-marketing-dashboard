import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketing Dashboard",
  description: "Analytics, email campaigns, imagery, and calendar for one brand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
