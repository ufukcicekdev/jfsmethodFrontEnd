export type BodyRegion =
  | "neck"
  | "shoulder_left"
  | "shoulder_right"
  | "upper_back"
  | "lower_back"
  | "hip_left"
  | "hip_right"
  | "knee_left"
  | "knee_right";

export const BODY_REGIONS: { id: BodyRegion; label: string; short: string }[] = [
  { id: "neck", label: "Boyun", short: "Boyun" },
  { id: "shoulder_left", label: "Sol Omuz", short: "S.Omuz" },
  { id: "shoulder_right", label: "Sağ Omuz", short: "S.Omuz" },
  { id: "upper_back", label: "Üst Sırt", short: "Ü.Sırt" },
  { id: "lower_back", label: "Bel", short: "Bel" },
  { id: "hip_left", label: "Sol Kalça", short: "S.Kalça" },
  { id: "hip_right", label: "Sağ Kalça", short: "S.Kalça" },
  { id: "knee_left", label: "Sol Diz", short: "S.Diz" },
  { id: "knee_right", label: "Sağ Diz", short: "S.Diz" },
];

export function painColor(level: number | undefined): string {
  if (level === undefined) return "bg-slate-200 dark:bg-slate-700";
  if (level === 0) return "bg-emerald-400";
  if (level <= 3) return "bg-emerald-300";
  if (level <= 5) return "bg-amber-400";
  if (level <= 7) return "bg-orange-500";
  return "bg-red-500";
}

export function painTextColor(level: number | undefined): string {
  if (level === undefined) return "text-slate-500";
  if (level <= 3) return "text-emerald-700 dark:text-emerald-400";
  if (level <= 5) return "text-amber-700 dark:text-amber-400";
  if (level <= 7) return "text-orange-700 dark:text-orange-400";
  return "text-red-700 dark:text-red-400";
}
