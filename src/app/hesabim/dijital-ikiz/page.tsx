"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BodyPainMap } from "@/components/patient/BodyPainMap";
import { HomeExerciseList } from "@/components/patient/HomeExerciseList";
import { PatientProgressGallery } from "@/components/patient/PatientProgressGallery";
import { WellnessStatsStrip } from "@/components/patient/WellnessStatsStrip";
import { WeightChart } from "@/components/admin/WeightChart";
import { GlassCard } from "@/components/ui/GlassCard";
import { Model3DCanvas } from "@/components/ui/Model3DCanvas";
import { getAccessToken } from "@/lib/auth";
import { api, type WellnessDashboard } from "@/lib/api";
import { buildWeightStats } from "@/lib/weightStats";
import { calculateBMI, getBMICategory } from "@/lib/bmi";
import type { BodyRegion } from "@/lib/bodyRegions";

export default function PatientDigitalTwinPage() {
  const [data, setData] = useState<WellnessDashboard | null>(null);
  const [profileHeight, setProfileHeight] = useState(175);
  const [profileWeight, setProfileWeight] = useState(72);
  const [loading, setLoading] = useState(true);
  const [savingPain, setSavingPain] = useState(false);
  const [error, setError] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(
    "lower_back"
  );
  const [painLevels, setPainLevels] = useState<
    Partial<Record<BodyRegion, number>>
  >({});

  const loadDashboard = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setError("");
    try {
      const [dashboard, profile] = await Promise.all([
        api.wellness.dashboard(token),
        api.profile.get(token),
      ]);
      setData(dashboard);
      if (profile.height) setProfileHeight(profile.height);
      if (profile.weight) setProfileWeight(profile.weight);
    } catch {
      setError("Tedavi ikizi verileri yüklenemedi.");
      setData(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  const bmi = useMemo(
    () => calculateBMI(profileHeight, profileWeight),
    [profileHeight, profileWeight]
  );
  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi]);
  useEffect(() => {
    if (!data) return;
    const map: Partial<Record<BodyRegion, number>> = {};
    for (const entry of data.pain_map) {
      map[entry.region] = entry.pain_level;
    }
    setPainLevels(map);
  }, [data]);
  const weightStats = useMemo(
    () =>
      data ?
        buildWeightStats(
          data.weight_history.map((entry, index) => ({
            id: index,
            weight: entry.weight,
            recorded_at: entry.recorded_at,
          })),
          profileWeight
        )
      : null,
    [data, profileWeight]
  );

  const handlePainSave = async (
    entries: { region: BodyRegion; pain_level: number; note?: string }[]
  ) => {
    const token = getAccessToken();
    if (!token) return;

    setSavingPain(true);
    try {
      await api.wellness.updatePainMap(token, entries);
      await loadDashboard();
    } finally {
      setSavingPain(false);
    }
  };

  const handleCompleteExercise = async (
    assignmentId: number,
    data?: { pain_before?: number; pain_after?: number }
  ) => {
    const token = getAccessToken();
    if (!token) return;
    await api.wellness.completeExercise(token, assignmentId, data);
    await loadDashboard();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-slate-600 dark:text-slate-300">{error}</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Tedavi İkizin
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Ağrı haritası, ev programınız, kilo trendi ve ilerleme fotoğrafları —
          tedavi yolculuğunuz tek ekranda.
        </p>
      </div>

      <WellnessStatsStrip stats={data.stats} />

      <div className="grid gap-4 xl:grid-cols-2">
        <BodyPainMap
          painMap={data.pain_map}
          onSave={handlePainSave}
          saving={savingPain}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          levels={painLevels}
          onLevelsChange={setPainLevels}
        />

        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            3D Vücut Modeli
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            BMI:{" "}
            <span className={`font-semibold ${bmiCategory.colorClass}`}>
              {bmi.toFixed(1)} ({bmiCategory.label})
            </span>{" "}
            · Noktaya tıklayarak bölge seçin; tekerlek veya iki parmakla
            yakınlaştırın.
          </p>
          <div className="relative mx-auto mt-4 aspect-3/4 max-h-[360px] w-full overflow-hidden rounded-2xl border border-white/30 bg-white/10 dark:border-slate-600/40 dark:bg-slate-800/50">
            <Model3DCanvas
              variant="twin"
              height={profileHeight}
              weight={profileWeight}
              className="h-full w-full"
              levelByRegion={painLevels}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />
          </div>
        </GlassCard>
      </div>

      <HomeExerciseList
        exercises={data.exercises}
        onComplete={handleCompleteExercise}
      />

      {weightStats && weightStats.history.length >= 2 && (
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Kilo Trendi
          </h2>
          <div className="mt-4">
            <WeightChart stats={weightStats} />
          </div>
        </GlassCard>
      )}

      <PatientProgressGallery photos={data.progress_photos} />
    </div>
  );
}
