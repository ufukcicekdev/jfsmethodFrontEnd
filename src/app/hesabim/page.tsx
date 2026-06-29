"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HomeExerciseList } from "@/components/patient/HomeExerciseList";
import { WeightChart } from "@/components/admin/WeightChart";
import { GlassCard } from "@/components/ui/GlassCard";
import { Model3DCanvas } from "@/components/ui/Model3DCanvas";
import { useAuth } from "@/components/providers/AuthProvider";
import { getAccessToken } from "@/lib/auth";
import {
  api,
  type PatientProfile,
  type SessionPackage,
  type WellnessDashboard,
} from "@/lib/api";
import { calculateBMI, getBMICategory } from "@/lib/bmi";
import { buildWeightStats } from "@/lib/weightStats";

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [wellness, setWellness] = useState<WellnessDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterMl, setWaterMl] = useState(0);
  const [steps, setSteps] = useState(0);
  const [stepsInput, setStepsInput] = useState("");
  const [savingSteps, setSavingSteps] = useState(false);

  const loadAll = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    const [profileData, packageData, wellnessData, waterData, stepsData] =
      await Promise.all([
        api.profile.get(token),
        api.packages.me(token).catch(() => [] as SessionPackage[]),
        api.wellness.dashboard(token).catch(() => null),
        api.wellness.water.get(token).catch(() => ({ date: "", ml_consumed: 0 })),
        api.wellness.steps.get(token).catch(() => ({ date: "", step_count: 0 })),
      ]);
    setProfile(profileData);
    setPackages(Array.isArray(packageData) ? packageData : []);
    setWellness(wellnessData);
    setWaterMl(waterData.ml_consumed);
    setSteps(stepsData.step_count);
    setStepsInput(stepsData.step_count > 0 ? String(stepsData.step_count) : "");
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  // Kullanıcı henüz bildirim izni vermediyse sessizce iste ve token'ı kaydet
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Notification.permission !== "default") return;
    const token = getAccessToken();
    if (!token) return;

    import("@/lib/firebase/messaging").then(({ isFirebaseConfigured, requestPushToken }) => {
      if (!isFirebaseConfigured()) return;
      requestPushToken().then((fcmToken) => {
        if (fcmToken) {
          import("@/lib/api").then(({ api }) => {
            api.devices.register(token, fcmToken).catch(() => {});
          });
        }
      });
    });
  }, []);

  const handleAddWater = async (ml: number) => {
    const token = getAccessToken();
    if (!token) return;
    const newMl = Math.max(0, waterMl + ml);
    setWaterMl(newMl);
    await api.wellness.water.set(token, newMl).catch(() => {});
  };

  const handleSaveSteps = async () => {
    const token = getAccessToken();
    const count = parseInt(stepsInput, 10);
    if (!token || isNaN(count)) return;
    setSavingSteps(true);
    try {
      await api.wellness.steps.set(token, count);
      setSteps(count);
    } finally {
      setSavingSteps(false);
    }
  };

  const handleCompleteExercise = async (
    assignmentId: number,
    data?: { pain_before?: number; pain_after?: number }
  ) => {
    const token = getAccessToken();
    if (!token) return;
    await api.wellness.completeExercise(token, assignmentId, data);
    await loadAll();
  };

  const activePackage = packages.find((p) => p.is_active) ?? null;

  const profileComplete =
    profile && profile.height && profile.weight && profile.phone;

  const profileHeight = profile?.height ?? 175;
  const profileWeight = profile?.weight ?? 72;

  const bmi =
    profile?.height && profile?.weight
      ? calculateBMI(profile.height, profile.weight)
      : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  const weightStats = useMemo(() => {
    if (!wellness) return null;
    return buildWeightStats(
      wellness.weight_history.map((entry, index) => ({
        id: index,
        weight: entry.weight,
        recorded_at: entry.recorded_at,
      })),
      profileWeight
    );
  }, [wellness, profileWeight]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
            Merhaba, {user?.first_name || user?.full_name}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Tedavi yolculuğunuz tek ekranda — ev programınız, ölçümleriniz ve
            dijital ikiziniz.
          </p>
        </div>
      </div>

      {!profileComplete && (
        <GlassCard className="border-amber-200/60 bg-amber-50/50 p-4 sm:p-5 dark:border-amber-800/40 dark:bg-amber-950/20">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Profilinizi tamamlayın
          </p>
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
            Boy, kilo ve iletişim bilgilerinizi ekleyerek dijital ikizinizi
            kişiselleştirin.
          </p>
          <Link
            href="/hesabim/profil"
            className="mt-3 inline-block rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Profili Tamamla
          </Link>
        </GlassCard>
      )}

      {/* Özet kartları */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <GlassCard className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Aktif Egzersiz
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {wellness?.stats.active_exercises ?? 0}
            <span className="text-sm font-medium text-slate-400">
              {" "}
              · {wellness?.stats.completions_this_week ?? 0} bu hafta
            </span>
          </p>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Güncel Kilo
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {profile?.weight ? `${profile.weight} kg` : "—"}
          </p>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            BMI
          </p>
          {bmi && bmiCategory ? (
            <p className={`mt-2 text-2xl font-bold ${bmiCategory.colorClass}`}>
              {bmi.toFixed(1)}{" "}
              <span className="text-sm font-medium">({bmiCategory.label})</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Boy/kilo girin
            </p>
          )}
        </GlassCard>
      </div>

      {activePackage && (
        <GlassCard className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Link
                  href="/hesabim/paketler"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Seans Paketim →
                </Link>
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {activePackage.name ||
                  `${activePackage.total_sessions} seanslık paket`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {activePackage.remaining_sessions}
                <span className="text-base font-medium text-slate-400">
                  {" "}
                  / {activePackage.total_sessions}
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                kalan seans
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${
                  activePackage.total_sessions > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (activePackage.used_sessions /
                            activePackage.total_sessions) *
                            100
                        )
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </GlassCard>
      )}

      {/* İkiz + Ev Programı */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Tedavi İkizin
          </h2>
          {bmi && bmiCategory && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              BMI:{" "}
              <span className={`font-semibold ${bmiCategory.colorClass}`}>
                {bmi.toFixed(1)} ({bmiCategory.label})
              </span>
            </p>
          )}
          <div className="relative mx-auto mt-4 aspect-3/4 max-h-[340px] w-full overflow-hidden rounded-2xl border border-white/30 bg-white/10 dark:border-slate-600/40 dark:bg-slate-800/50">
            <Model3DCanvas
              variant="twin"
              height={profileHeight}
              weight={profileWeight}
              className="h-full w-full"
            />
          </div>
          <Link
            href="/hesabim/dijital-ikiz"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Ağrı haritası & ilerleme →
          </Link>
        </GlassCard>

        <GlassCard className="p-4 sm:p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Ev Programım
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Terapistinizin atadığı hareketleri uygulayın ve tamamlandı
            işaretleyin.
          </p>
          <div className="mt-4">
            <HomeExerciseList
              exercises={wellness?.exercises ?? []}
              onComplete={handleCompleteExercise}
              bare
            />
          </div>
        </GlassCard>
      </div>

      {/* Su & Adım + Rozetler */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        {/* Su & Adım */}
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Günlük Takip</h2>
          <div className="mt-4 space-y-5">
            {/* Su */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Su Tüketimi</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {waterMl} <span className="font-normal text-slate-400">/ 2000 ml</span>
                </p>
              </div>
              {/* Circular progress */}
              <div className="relative mx-auto mb-3 h-20 w-20">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#3b82f6" strokeWidth="2.5"
                    strokeDasharray={`${Math.min(100, Math.round(waterMl / 20))} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">{Math.min(100, Math.round(waterMl / 20))}%</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[250, 500, 750, 1000].map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() => handleAddWater(ml)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-950/30 dark:text-blue-300"
                  >
                    +{ml}ml
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddWater(-waterMl)}
                  className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-400"
                >
                  Sıfırla
                </button>
              </div>
            </div>

            {/* Adım */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Adım Sayısı</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Adım sayısı girin"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleSaveSteps}
                  disabled={savingSteps}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700"
                >
                  {savingSteps ? "…" : "Kaydet"}
                </button>
              </div>
              {steps > 0 && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Bugün: <span className="font-semibold text-slate-800 dark:text-slate-200">{steps.toLocaleString("tr-TR")} adım</span>
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Rozetler & Streak */}
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Motivasyon</h2>
          {wellness?.stats.exercise_streak != null && wellness.stats.exercise_streak > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {wellness.stats.exercise_streak} günlük seri!
                </p>
                <p className="text-xs text-amber-700/70 dark:text-amber-400/70">Harika gidiyorsun, devam et!</p>
              </div>
            </div>
          )}
          {wellness?.stats.badges && wellness.stats.badges.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {wellness.stats.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-xl p-3 text-center transition-all ${
                    badge.earned
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : "bg-slate-50 opacity-50 grayscale dark:bg-slate-800/40"
                  }`}
                >
                  <p className="text-2xl">{badge.emoji}</p>
                  <p className={`mt-1 text-xs font-semibold ${badge.earned ? "text-blue-700 dark:text-blue-300" : "text-slate-500"}`}>
                    {badge.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{badge.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Egzersiz tamamlayarak rozetler kazanabilirsin.</p>
          )}
        </GlassCard>
      </div>

      {/* Kilo trendi */}
      {weightStats && weightStats.history.length >= 2 ? (
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Kilo Trendi
          </h2>
          <div className="mt-4">
            <WeightChart stats={weightStats} />
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="flex flex-col justify-center p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Kilo Trendi
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            En az iki kilo ölçümü girince trend grafiğiniz burada görünecek.
          </p>
          <Link
            href="/hesabim/profil"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Kilo ekle →
          </Link>
        </GlassCard>
      )}
    </div>
  );
}
