"use client";

import { useEffect, useState } from "react";
import { WeightChart, WeightStatsCards } from "@/components/admin/WeightChart";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { getAccessToken } from "@/lib/auth";
import { api, type PatientProfile, type WeightEntry } from "@/lib/api";
import { calculateBMI, getBMICategory, getIdealWeightRange } from "@/lib/bmi";
import { buildWeightStats } from "@/lib/weightStats";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingWeight, setAddingWeight] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({
    height: "",
    weight: "",
    date_of_birth: "",
    phone: "",
  });

  const loadData = async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    try {
      const [profileData, history] = await Promise.all([
        api.profile.get(token),
        api.weight.list(token),
      ]);
      setProfile(profileData);
      setWeightHistory(history);
      setForm({
        height: profileData.height?.toString() ?? "",
        weight: profileData.weight?.toString() ?? "",
        date_of_birth: profileData.date_of_birth ?? "",
        phone: profileData.phone ?? "",
      });
    } catch {
      setError("Profil bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await api.profile.update(token, {
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        date_of_birth: form.date_of_birth || undefined,
        phone: form.phone,
      });
      setProfile(updated);
      setSuccess("Profil güncellendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    if (passwordForm.next !== passwordForm.confirm) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }

    setChangingPassword(true);
    setError("");
    setSuccess("");
    try {
      await api.auth.changePassword(token, {
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      });
      setPasswordForm({ current: "", next: "", confirm: "" });
      setSuccess("Şifreniz güncellendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şifre güncellenemedi.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    const weight = Number(newWeight);
    if (!token || !weight) return;

    setAddingWeight(true);
    setError("");
    setSuccess("");

    try {
      await api.weight.create(token, weight);
      setNewWeight("");
      setSuccess("Yeni kilo kaydı eklendi.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kilo kaydı eklenemedi.");
    } finally {
      setAddingWeight(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  const height = form.height ? Number(form.height) : null;
  const weight = form.weight ? Number(form.weight) : null;
  const bmi = height && weight ? calculateBMI(height, weight) : null;
  const category = bmi ? getBMICategory(bmi) : null;
  const idealRange = height ? getIdealWeightRange(height) : null;
  const weightStats = buildWeightStats(weightHistory, profile?.weight);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Profil & Kilo
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Kişisel bilgilerinizi ve kilo takibinizi yönetin.
        </p>
      </div>

      {(error || success) && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            error
              ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {error || success}
        </div>
      )}

      {weightStats.history.length >= 1 && (
        <WeightStatsCards stats={weightStats} />
      )}

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Profil Bilgileri
          </h2>
          {profile && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {profile.first_name} {profile.last_name} · {profile.email}
            </p>
          )}
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Boy (cm)"
                name="height"
                type="number"
                min={100}
                max={250}
                value={form.height}
                onChange={(e) =>
                  setForm((f) => ({ ...f, height: e.target.value }))
                }
              />
              <FormField
                label="Kilo (kg)"
                name="weight"
                type="number"
                min={30}
                max={300}
                step="0.1"
                value={form.weight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weight: e.target.value }))
                }
              />
            </div>
            <FormField
              label="Telefon"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
            <FormField
              label="Doğum Tarihi"
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={(e) =>
                setForm((f) => ({ ...f, date_of_birth: e.target.value }))
              }
            />

            {bmi && category && idealRange && (
              <div className="rounded-xl bg-slate-50/80 p-4 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vücut Analizi
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">BMI: </span>
                    <span className={`font-semibold ${category.colorClass}`}>
                      {bmi.toFixed(1)} ({category.label})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">İdeal kilo: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {idealRange.min}–{idealRange.max} kg
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Kaydediliyor…" : "Profili Kaydet"}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Kilo Ölçümü Ekle
          </h2>
          <form
            onSubmit={handleAddWeight}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="w-full sm:flex-1">
              <FormField
                label="Kilo (kg)"
                name="new_weight"
                type="number"
                min={30}
                max={300}
                step="0.1"
                required
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={addingWeight || !newWeight}
              className="w-full rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 sm:w-auto"
            >
              {addingWeight ? "Ekleniyor…" : "Kaydet"}
            </button>
          </form>

          {weightStats.history.length >= 2 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kilo Grafiği
              </h3>
              <div className="mt-3">
                <WeightChart stats={weightStats} />
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Kilo Geçmişi
        </h2>
        {weightHistory.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Henüz kilo kaydı yok.
          </p>
        ) : (
          <>
            <div className="mt-4 space-y-2 md:hidden">
              {weightHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/50 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-800/40"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    {formatDateTime(entry.recorded_at)}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {entry.weight} kg
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-600/50 dark:text-slate-400">
                    <th className="pb-3 pr-4">Tarih</th>
                    <th className="pb-3">Kilo</th>
                  </tr>
                </thead>
                <tbody>
                  {weightHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100 dark:border-slate-700/50"
                    >
                      <td className="py-3 pr-4 text-slate-700 dark:text-slate-200">
                        {formatDateTime(entry.recorded_at)}
                      </td>
                      <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                        {entry.weight} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </GlassCard>

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Şifre Değiştir
        </h2>
        <form onSubmit={handleChangePassword} className="mt-4 max-w-md space-y-4">
          <FormField
            label="Mevcut şifre"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            value={passwordForm.current}
            onChange={(e) =>
              setPasswordForm((f) => ({ ...f, current: e.target.value }))
            }
          />
          <FormField
            label="Yeni şifre"
            name="new_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={passwordForm.next}
            onChange={(e) =>
              setPasswordForm((f) => ({ ...f, next: e.target.value }))
            }
          />
          <FormField
            label="Yeni şifre (tekrar)"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={passwordForm.confirm}
            onChange={(e) =>
              setPasswordForm((f) => ({ ...f, confirm: e.target.value }))
            }
          />
          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {changingPassword ? "Güncelleniyor…" : "Şifreyi Güncelle"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
