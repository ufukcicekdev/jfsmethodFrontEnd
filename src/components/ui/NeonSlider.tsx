"use client";

interface NeonSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  accent?: "mint" | "blue";
  orientation?: "vertical" | "horizontal";
  onChange: (value: number) => void;
}

export function NeonSlider({
  label,
  value,
  min,
  max,
  unit,
  accent = "blue",
  orientation = "vertical",
  onChange,
}: NeonSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const trackColor =
    accent === "mint"
      ? "from-emerald-400 to-teal-300"
      : "from-blue-400 to-sky-300";

  if (orientation === "horizontal") {
    return (
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
            {label}
          </span>
          <div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {value}
            </span>
            <span className="ml-1 text-sm text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          </div>
        </div>

        <div className="relative flex h-11 w-full items-center">
          <div className="absolute h-1.5 w-full rounded-full bg-slate-300/50 dark:bg-slate-600/60" />
          <div
            className={`absolute h-1.5 rounded-full bg-gradient-to-r ${trackColor}`}
            style={{ width: `${percentage}%` }}
          />

          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`neon-slider neon-slider--touch neon-slider--${accent} absolute h-11 w-full cursor-pointer appearance-none bg-transparent`}
            aria-label={`${label}: ${value} ${unit}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
        {label}
      </span>

      <div className="relative flex h-48 w-12 items-center justify-center">
        <div className="absolute h-full w-1 rounded-full bg-slate-300/50 dark:bg-slate-600/60" />
        <div
          className={`absolute bottom-0 w-1 rounded-full bg-gradient-to-t ${trackColor}`}
          style={{ height: `${percentage}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`neon-slider neon-slider--${accent} absolute h-48 w-12 cursor-pointer appearance-none bg-transparent`}
          style={
            {
              writingMode: "vertical-lr",
              direction: "rtl",
            } as React.CSSProperties
          }
          aria-label={`${label}: ${value} ${unit}`}
        />
      </div>

      <div className="text-center">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {value}
        </span>
        <span className="ml-1 text-sm text-slate-500 dark:text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
}
