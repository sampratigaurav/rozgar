interface CategoryCardProps {
  category: string;
  selected: boolean;
  onSelect: () => void;
}

const ICONS: Record<string, string> = {
  Electrician: "⚡",
  Plumber: "🔧",
  Carpenter: "🪚",
  Painter: "🎨",
};

export default function CategoryCard({ category, selected, onSelect }: CategoryCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-5 min-h-[110px] border-2 font-semibold transition-all active:scale-95 ${
        selected
          ? "border-[#FF6B00] bg-[#FF6B00] text-white shadow-lg"
          : "border-gray-200 bg-white text-gray-700 hover:border-[#FF6B00]"
      }`}
    >
      <span className="text-4xl">{ICONS[category] ?? "🛠️"}</span>
      <span className="text-sm">{category}</span>
    </button>
  );
}
