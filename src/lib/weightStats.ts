import type { WeightEntry, WeightStats } from "@/lib/api";

export function buildWeightStats(
  history: WeightEntry[],
  currentWeight: number | null | undefined
): WeightStats {
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const chartHistory = sorted.map((entry) => ({
    weight: entry.weight,
    recorded_at: entry.recorded_at,
  }));

  const current =
    currentWeight ??
    (sorted.length ? sorted[sorted.length - 1].weight : null);

  const changeSince = (days: number) => {
    if (current === null || sorted.length === 0) return null;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const past = [...sorted]
      .reverse()
      .find((entry) => new Date(entry.recorded_at).getTime() <= cutoff);
    if (!past) return null;
    return current - past.weight;
  };

  return {
    current_weight: current,
    weight_change_week: changeSince(7),
    weight_change_month: changeSince(30),
    history: chartHistory,
  };
}
