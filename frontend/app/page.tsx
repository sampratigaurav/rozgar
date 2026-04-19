"use client";

import Link from "next/link";

const ROLES = [
  {
    role: "customer", icon: "🏠",
    title: "I need work done",
    desc: "Photo → AI estimate → worker at your door",
    color: "border-orange-300 bg-orange-50",
    steps: ["📷 Photo of the problem", "🤖 Instant AI estimate", "📡 Nearby worker notified", "✅ Job done"],
  },
  {
    role: "worker", icon: "🔧",
    title: "I'm a worker",
    desc: "Get jobs via WhatsApp or SMS — any phone works",
    color: "border-blue-300 bg-blue-50",
    steps: ["📲 WhatsApp/SMS alert", "🔗 Tap link to see job", "✅ Accept with one tap", "💰 Get paid on site"],
  },
  {
    role: "partner", icon: "🏪",
    title: "I'm a shop partner",
    desc: "Help workers near you, earn ₹15 per job placed",
    color: "border-green-300 bg-green-50",
    steps: ["🔔 Job alerts nearby", "🤝 Accept on behalf", "₹ Earn commission", "📈 Grow your network"],
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="px-4 pt-10 pb-6 max-w-lg mx-auto text-center">
        <div className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          🇮🇳 Works on any phone · Hindi · English · 6 regional languages
        </div>
        <h1 className="text-4xl font-bold text-[#FF6B00] mb-3 tracking-tight">Rozgar</h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-xs mx-auto">
          Hyperlocal gig marketplace — skilled workers in under 5 minutes
        </p>
      </div>

      {/* Stats strip */}
      <div className="bg-[#FF6B00] py-4 px-4 mb-6">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1 text-center">
          {[
            ["< 5 min", "Worker match"],
            ["₹0", "Worker fee"],
            ["4", "Categories"],
            ["3", "Notify channels"],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-white font-bold text-sm">{val}</p>
              <p className="text-orange-200 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role cards */}
      <div className="px-4 pb-10 max-w-lg mx-auto">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">
          Choose your role
        </h2>

        <div className="flex flex-col gap-4">
          {ROLES.map(({ role, icon, title, desc, color, steps }) => (
            <div key={role} className={`border-2 rounded-2xl p-5 ${color}`}>
              <div className="flex items-start gap-4">
                <div className="text-3xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-base mb-0.5">{title}</h3>
                  <p className="text-gray-500 text-sm mb-3">{desc}</p>

                  {/* Steps */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {steps.map(s => (
                      <span key={s} className="text-xs bg-white text-gray-600 rounded-full px-2.5 py-1 border border-gray-200 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/auth/signup?role=${role}`}
                      className="flex-1 bg-[#FF6B00] text-white rounded-xl py-3 font-bold text-sm text-center min-h-[44px] flex items-center justify-center"
                    >
                      Sign Up Free
                    </Link>
                    <Link
                      href={`/auth/login?role=${role}`}
                      className="flex-1 border-2 border-[#FF6B00] text-[#FF6B00] rounded-xl py-3 font-bold text-sm text-center min-h-[44px] flex items-center justify-center"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo shortcut */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 mb-3">Trying the demo?</p>
          <div className="flex gap-3 justify-center">
            <Link href="/admin" className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-2 min-h-[36px] flex items-center gap-1">
              🛠 Admin Panel
            </Link>
            <Link href="/partner" className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-2 min-h-[36px] flex items-center gap-1">
              🏪 Partner View
            </Link>
            <Link href="/worker" className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-2 min-h-[36px] flex items-center gap-1">
              🔧 Worker View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}