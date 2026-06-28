import type { BodyRegion, Exercise, ExerciseAssignment } from "./api";

/** Görsel yüklenmemiş egzersizler için vücut bölgesine göre örnek görsel. */
export function exerciseFallbackImage(region: BodyRegion | "" | undefined): string {
  switch (region) {
    case "neck":
      return "/exercises/neck.jpg";
    case "shoulder_left":
    case "shoulder_right":
      return "/exercises/shoulder.jpg";
    case "upper_back":
      return "/exercises/upper-back.jpg";
    case "lower_back":
      return "/exercises/lower-back.jpg";
    case "hip_left":
    case "hip_right":
      return "/exercises/hip.jpg";
    case "knee_left":
    case "knee_right":
      return "/exercises/knee.jpg";
    default:
      return "/exercises/general.jpg";
  }
}

/** Yüklenmiş görsel varsa onu, yoksa bölgeye uygun örnek görseli döner. */
export function getExerciseImage(exercise: Pick<Exercise, "image_url" | "target_region">): string {
  return exercise.image_url || exerciseFallbackImage(exercise.target_region);
}

/** Sıklığa göre haftalık hedef tekrar sayısı (ilerleme yüzdesi için). */
export function weeklyTarget(frequency: string): number {
  switch (frequency) {
    case "daily":
      return 7;
    case "every_other_day":
      return 4;
    case "weekly":
      return 3;
    default:
      return 1;
  }
}

/** Bu haftaki tamamlama yüzdesi (0–100). */
export function weeklyProgress(assignment: ExerciseAssignment): number {
  const target = weeklyTarget(assignment.frequency);
  if (target <= 0) return 0;
  return Math.min(100, Math.round((assignment.completions_this_week / target) * 100));
}
