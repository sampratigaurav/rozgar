import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rozgar — Skilled Workers in 5 Minutes",
  description: "India's hyperlocal gig marketplace. Connect with skilled workers near you in under 5 minutes.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F5F5F7] min-h-screen">
        <nav className="sticky top-0 z-50 w-full glass border-b border-white/40 shadow-sm">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-sm select-none">R</span>
              </div>
              <span className="font-black text-xl gradient-text tracking-tight">Rozgar</span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-0.5">
              {[
                { href: "/worker",  label: "Workers",  icon: "🔧" },
                { href: "/partner", label: "Partners", icon: "🏪" },
                { href: "/admin",   label: "Admin",    icon: "🛠️" },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-gray-500 hover:text-[#FF6B00] hover:bg-orange-50 transition-all text-xs font-semibold"
                >
                  <span className="text-sm">{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}
