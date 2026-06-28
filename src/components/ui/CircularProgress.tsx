interface CircularProgressProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Tamamlandığında (>=100) yeşil, aksi halde mavi. Override için color verilebilir. */
  color?: string;
  className?: string;
  label?: string;
}

export function CircularProgress({
  value,
  size = 56,
  strokeWidth = 6,
  color,
  className = "",
  label,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const stroke = color ?? (clamped >= 100 ? "#10b981" : "#3b82f6");

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-slate-700 dark:text-slate-200">
        {label ?? `${clamped}%`}
      </span>
    </div>
  );
}
