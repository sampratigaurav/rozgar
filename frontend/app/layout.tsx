import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rozgar — Find Workers Near You",
  description: "Hyperlocal gig marketplace connecting households with skilled workers in under 5 minutes",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-[#FF6B00] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
          <Link href="/" className="font-bold text-xl tracking-tight">
            Rozgar
          </Link>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/worker" className="opacity-90 hover:opacity-100">
              Worker
            </Link>
            <Link href="/partner" className="opacity-90 hover:opacity-100">
              Partner
            </Link>
            <Link href="/admin" className="opacity-90 hover:opacity-100">
              Admin
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
