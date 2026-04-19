"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ROLES = [
  {
    role: "customer",
    icon: "🏠",
    title: "Need Work Done?",
    subtitle: "Post a job in 60 seconds",
    desc: "Snap a photo → AI estimates the cost → Skilled worker at your door",
    from: "from-orange-500",
    to: "to-red-500",
    bgFrom: "from-orange-50",
    bgTo: "to-amber-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
    steps: [
      { icon: "📷", text: "Photo" },
      { icon: "🤖", text: "AI estimate" },
      { icon: "📡", text: "Broadcast" },
      { icon: "✅", text: "Done!" },
    ],
  },
  {
    role: "worker",
    icon: "🔧",
    title: "Looking for Work?",
    subtitle: "Earn on your own schedule",
    desc: "Get job alerts on WhatsApp or SMS — works on any phone, any plan",
    from: "from-blue-500",
    to: "to-indigo-600",
    bgFrom: "from-blue-50",
    bgTo: "to-indigo-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    steps: [
      { icon: "📲", text: "Alert" },
      { icon: "🔗", text: "Tap link" },
      { icon: "✅", text: "Accept" },
      { icon: "💰", text: "Get paid" },
    ],
  },
  {
    role: "partner",
    icon: "🏪",
    title: "Own a Local Shop?",
    subtitle: "Earn ₹15 per job you place",
    desc: "Help nearby workers find jobs and earn commission for every placement",
    from: "from-emerald-500",
    to: "to-green-600",
    bgFrom: "from-emerald-50",
    bgTo: "to-green-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    steps: [
      { icon: "🔔", text: "Job alert" },
      { icon: "🤝", text: "Accept" },
      { icon: "₹", text: "Commission" },
      { icon: "📈", text: "Grow" },
    ],
  },
] as const;

const STATS = [
  { value: "< 5", unit: "min", label: "Match time" },
  { value: "₹0",  unit: "",    label: "Worker fee" },
  { value: "4",   unit: "+",   label: "Categories" },
  { value: "6",   unit: "+",   label: "Languages" },
];

export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FF6B00] via-[#FF5200] to-[#E84000]">
        <div className="absolute inset-0 hero-pattern" />

        {/* Floating orbs */}
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5 animate-float" />
        <div className="absolute bottom-4 -left-10 w-32 h-32 rounded-full bg-white/5 animate-float delay-300" />
        <div className="absolute top-16 left-1/3 w-10 h-10 rounded-full bg-white/10 animate-float delay-200" />
        <div className="absolute top-8 right-1/4 w-6 h-6 rounded-full bg-white/15 animate-float delay-500" />

        <div className="relative max-w-lg mx-auto px-4 pt-12 pb-16 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20"
            style={{ opacity: visible ? 1 : 0, animation: visible ? 'slideUp 0.5s ease-out forwards' : 'none' }}
          >
            <span>🇮🇳</span>
            <span>Works on any phone · Hindi + 6 regional languages</span>
          </div>

          {/* Wordmark */}
          <h1
            className="text-6xl font-black text-white mb-3 tracking-tighter leading-none"
            style={{ opacity: visible ? 1 : 0, animation: visible ? 'slideUp 0.5s ease-out 100ms forwards' : 'none' }}
          >
            Rozgar
          </h1>
          <p
            className="text-white/80 text-lg font-medium mb-1.5"
            style={{ opacity: visible ? 1 : 0, animation: visible ? 'slideUp 0.5s ease-out 200ms forwards' : 'none' }}
          >
            Skilled workers at your doorstep
          </p>
          <p
            className="text-white/55 text-sm mb-8"
            style={{ opacity: visible ? 1 : 0, animation: visible ? 'slideUp 0.5s ease-out 300ms forwards' : 'none' }}
          >
            India's fastest hyperlocal gig marketplace
          </p>

          {/* Hero CTA */}
          <div
            className="flex gap-3 justify-center"
            style={{ opacity: visible ? 1 : 0, animation: visible ? 'slideUp 0.5s ease-out 400ms forwards' : 'none' }}
          >
            <Link
              href="/auth/signup?role=customer"
              className="bg-white text-[#FF6B00] font-bold px-6 py-3 rounded-2xl text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Get Started Free →
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-white/40 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-white/10 transition-all active:scale-95"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 grid grid-cols-4 gap-3">
          {STATS.map(({ value, unit, label }, i) => (
            <div
              key={label}
              className="text-center"
              style={{
                opacity: visible ? 1 : 0,
                animation: visible ? `slideUp 0.5s ease-out ${i * 80 + 500}ms forwards` : 'none',
              }}
            >
              <p className="font-black text-[#FF6B00] text-base leading-tight">
                {value}<span className="text-xs font-bold">{unit}</span>
              </p>
              <p className="text-gray-400 text-[10px] mt-0.5 leading-tight font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Role Cards ────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <div
          className="text-center mb-6"
          style={{ opacity: visible ? 1 : 0, animation: visible ? 'fadeIn 0.5s ease-out 600ms forwards' : 'none' }}
        >
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Choose your role</p>
          <h2 className="text-2xl font-black text-gray-800">Who are you?</h2>
        </div>

        <div className="flex flex-col gap-4">
          {ROLES.map(({ role, icon, title, subtitle, desc, from, to, bgFrom, bgTo, border, steps }, i) => (
            <div
              key={role}
              className={`card card-hover rounded-3xl border ${border} bg-gradient-to-br ${bgFrom} ${bgTo} overflow-hidden`}
              style={{
                opacity: visible ? 1 : 0,
                animation: visible ? `slideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${700 + i * 120}ms forwards` : 'none',
              }}
            >
              {/* Header gradient bar */}
              <div className={`bg-gradient-to-r ${from} ${to} px-5 py-4 flex items-center gap-3`}>
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-sm">
                  {icon}
                </div>
                <div>
                  <h3 className="font-black text-white text-[15px] leading-tight">{title}</h3>
                  <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{desc}</p>

                {/* Step strip */}
                <div className="flex items-center gap-2 mb-5">
                  {steps.map((s, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl leading-none">{s.icon}</span>
                        <span className="text-[10px] text-gray-400 font-semibold text-center whitespace-nowrap">{s.text}</span>
                      </div>
                      {si < steps.length - 1 && (
                        <span className="text-gray-300 text-lg font-light mb-3">›</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5">
                  <Link
                    href={`/auth/signup?role=${role}`}
                    className={`flex-1 bg-gradient-to-r ${from} ${to} text-white rounded-2xl py-3 font-bold text-sm text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all`}
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    href={`/auth/login?role=${role}`}
                    className={`flex-1 bg-white border-2 ${border} text-gray-700 rounded-2xl py-3 font-bold text-sm text-center hover:border-current active:scale-95 transition-all`}
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Demo shortcuts ─────────────────────────────── */}
        <div
          className="mt-8 pt-6 border-t border-gray-200"
          style={{ opacity: visible ? 1 : 0, animation: visible ? 'fadeIn 0.5s ease-out 1100ms forwards' : 'none' }}
        >
          <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">
            Demo Shortcuts
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {[
              { href: "/admin",   label: "Admin Panel",  icon: "🛠️" },
              { href: "/partner", label: "Partner View", icon: "🏪" },
              { href: "/worker",  label: "Worker View",  icon: "🔧" },
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:border-[#FF6B00] hover:text-[#FF6B00] hover:shadow-sm transition-all font-semibold"
              >
                <span className="text-sm">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
