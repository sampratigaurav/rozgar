interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  broadcast: { label: "Broadcast", className: "bg-blue-100 text-blue-800" },
  matched: { label: "Matched", className: "bg-green-100 text-green-800" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-700" },
  low: { label: "Low", className: "bg-green-100 text-green-700" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800" },
  high: { label: "High", className: "bg-red-100 text-red-700" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status?.toLowerCase()] ?? {
    label: status ?? "Unknown",
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${config.className}`}
    >
      {config.label}
    </span>
  );
}
