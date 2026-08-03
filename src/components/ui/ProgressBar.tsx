interface ProgressBarProps {
  value: number;
  label?: string;
  color?: "gold" | "purple" | "cyan" | "orange";
}

const colors = {
  gold: "from-amber-300 to-amber-500",
  purple: "from-violet-400 to-fuchsia-500",
  cyan: "from-cyan-300 to-blue-500",
  orange: "from-orange-300 to-red-500",
};

export function ProgressBar({ value, label, color = "gold" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {label && <div className="mb-1 text-xs font-bold text-stone-400">{label}</div>}
      <div
        className="h-2.5 overflow-hidden rounded-full border border-black/30 bg-black/35 shadow-inner"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]} transition-[width] duration-500`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
