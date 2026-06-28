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

  const loadAll = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    const [profileData, packageData, wellnessData] =
      await Promise.all([
        api.profile.get(token),
        api.packages.me(token).catch(() => [] as SessionPackage[]),
        api.wellness.dashboard(token).catch(() => null),
      ]);
    setProfile(profileData);
    setPackages(Array.isArray(packageData) ? packageData : []);
    setWellness(wellnessData);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

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
