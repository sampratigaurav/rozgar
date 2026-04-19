import StatusBadge from "./StatusBadge";
import type { Job } from "@/lib/api";

interface JobCardProps {
  job: Job;
  action?: React.ReactNode;
}

export default function JobCard({ job, action }: JobCardProps) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{job.category}</h3>
        <StatusBadge status={job.status} />
      </div>
      {job.scope && (
        <p className="text-gray-600 text-sm mb-1">
          <span className="font-medium">Scope:</span> {job.scope}
        </p>
      )}
      {(job.price_min || job.price_max) && (
        <p className="text-gray-600 text-sm mb-1">
          <span className="font-medium">Price:</span> ₹{job.price_min} – ₹{job.price_max}
        </p>
      )}
      {job.complexity && (
        <p className="text-gray-600 text-sm mb-2 flex items-center gap-1">
          <span className="font-medium">Complexity:</span>
          <StatusBadge status={job.complexity} />
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
