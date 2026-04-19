"use client";

import Link from "next/link";

const ROLES = [
  {
    role: "customer",
    icon: "🏠",
    title: "I need work done",
    desc: "Find a skilled worker near you in under 5 minutes",
    color: "border-orange-400 bg-orange-50",
    iconBg: "bg-orange-100",
  },
  {
    role: "worker",
    icon: "🔧",
    title: "I am a worker",
    desc: "Accept jobs from households in your area",
    color: "border-blue-400 bg-blue-50",
    iconBg: "bg-blue-100",
  },
  {
    role: "partner",
    icon: "🏪",
    title: "I am a partner",
    desc: "Manage workers and earn ₹15 per job placed",
    color: "border-green-400 bg-green-50",
    iconBg: "bg-green-100",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-10 max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#FF6B00] mb-2">Rozgar</h1>
          <p className="text-gray-500 text-base">
            Hyperlocal gig marketplace — skilled workers in under 5 minutes
          </p>
        </div>

        <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">
          Who are you?
        </h2>

        <div className="flex flex-col gap-4">
          {ROLES.map(({ role, icon, title, desc, color, iconBg }) => (
            <div
              key={role}
              className={`border-2 rounded-2xl p-5 ${color}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${iconBg} rounded-xl p-3 text-3xl flex-shrink-0`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-base mb-0.5">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">{desc}</p>
                  <div className="flex gap-3">
                    <Link
                      href={`/auth/signup?role=${role}`}
                      className="flex-1 bg-[#FF6B00] text-white rounded-xl py-3 font-bold text-sm text-center min-h-[44px] flex items-center justify-center"
                    >
                      Sign Up
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

        <p className="text-center text-xs text-gray-400 mt-8">
          No account? Sign up takes 30 seconds — just your phone or email.
        </p>
      </div>
    </div>
  );
}
