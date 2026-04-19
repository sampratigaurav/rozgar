import StatusBadge from "./StatusBadge";
import type { Job } from "@/lib/api";

interface JobCardProps {
  job: Job;
  action?: React.ReactNode;
}

const CATEGORY_ICONS: Record<string, string> = {
  Electrician: "⚡",
  Plumber:     "🔧",
  Carpenter:   "🪚",
  Painter:     "🎨",
};

export default function JobCard({ job, action }: JobCardProps) {
  const icon = CATEGORY_ICONS[job.category] ?? "🔨";

  return (
    <div className="card rounded-3xl border border-gray-100 overflow-hidden mb-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 flex items-center justify-between border-b border-orange-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center text-lg shadow-sm">
            {icon}
          </div>
          <h3 className="font-bold text-gray-800 text-[15px]">{job.category}</h3>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {job.scope && (
          <div>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Scope</span>
            <p className="text-gray-700 text-sm mt-0.5 leading-snug">{job.scope}</p>
          </div>
        )}

        {(job.price_min != null || job.price_max != null) && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Price</span>
            <span className="text-sm font-bold text-gray-800">
              ₹{job.price_min?.toLocaleString("en-IN")} – ₹{job.price_max?.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {job.complexity && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Difficulty</span>
            <StatusBadge status={job.complexity} />
          </div>
        )}

        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  );
}
