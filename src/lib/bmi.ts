export interface BMICategory {
  label: string;
  colorClass: string;
}

export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) {
    return { label: "Zayıf", colorClass: "text-sky-600 dark:text-sky-400" };
  }
  if (bmi < 25) {
    return { label: "Normal", colorClass: "text-emerald-600 dark:text-emerald-400" };
  }
  if (bmi < 30) {
    return { label: "Fazla Kilolu", colorClass: "text-amber-600 dark:text-amber-400" };
  }
  if (bmi < 35) {
    return { label: "Obez (I)", colorClass: "text-orange-600 dark:text-orange-400" };
  }
  if (bmi < 40) {
    return { label: "Obez (II)", colorClass: "text-orange-700 dark:text-orange-400" };
  }
  return { label: "Morbid Obez", colorClass: "text-red-600 dark:text-red-400" };
}

export function getIdealWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  return {
    min: Math.round(18.5 * heightM * heightM),
    max: Math.round(24.9 * heightM * heightM),
  };
}
