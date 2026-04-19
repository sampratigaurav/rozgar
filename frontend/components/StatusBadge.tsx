interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pending:   { label: "Pending",   dot: "bg-amber-400",   bg: "bg-amber-50",   text: "text-amber-700" },
  broadcast: { label: "Live",      dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700" },
  matched:   { label: "Matched",   dot: "bg-green-500",   bg: "bg-green-50",   text: "text-green-700" },
  completed: { label: "Done",      dot: "bg-gray-400",    bg: "bg-gray-100",   text: "text-gray-600" },
  low:       { label: "Low",       dot: "bg-green-500",   bg: "bg-green-50",   text: "text-green-700" },
  medium:    { label: "Medium",    dot: "bg-amber-400",   bg: "bg-amber-50",   text: "text-amber-700" },
  high:      { label: "High",      dot: "bg-red-500",     bg: "bg-red-50",     text: "text-red-700" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status?.toLowerCase()] ?? {
    label: status ?? "Unknown",
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-600",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      {cfg.label}
    </span>
  );
}
