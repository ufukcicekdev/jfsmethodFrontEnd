"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PatientPhotoSection } from "@/components/admin/PatientPhotoSection";
import { PatientExerciseSection } from "@/components/admin/PatientExerciseSection";
import { PatientPackageSection } from "@/components/admin/PatientPackageSection";
import { PatientDietSection } from "@/components/admin/PatientDietSection";
import { PostureAnalysis } from "@/components/admin/PostureAnalysis";
import { BodyMeasurementsSection } from "@/components/admin/BodyMeasurementsSection";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { getAccessToken } from "@/lib/auth";
import { api, type AdminPatient, type PatientProgressPhoto } from "@/lib/api";
import { calculateBMI, getBMICategory, getIdealWeightRange } from "@/lib/bmi";

function DownloadReportButton({ patientId }: { patientId: number }) {
  const [busy, setBusy] = useState(false);

  const download = async (fmt: "xlsx" | "pdf") => {
    const token = getAccessToken();
    if (!token || busy) return;
    setBusy(true);
    try {
      const res = await api.admin.downloadPatientReport(token, patientId, fmt);
      if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ogrenci_raporu.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => download("xlsx")}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-full border border-emerald-500/50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
      >
        ↓ Excel
      </button>
      <button
        onClick={() => download("pdf")}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-full border border-blue-500/50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
      >
        ↓ PDF
      </button>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [patient, setPatient] = useState<AdminPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingWeight, setAddingWeight] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [activeTab, setActiveTab] = useState<"profil" | "egzersizler" | "paketler" | "postur" | "olcumler" | "diyet" | "onboarding">("profil");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    height: "",
    weight: "",
    date_of_birth: "",
    phone: "",
    admin_notes: "",
  });

  const loadPatient = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !id) return;

    setLoading(true);
    setError("");
    try {
      const data = await api.admin.patient(token, id);
      setPatient(data);
      setForm({
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        email: data.email ?? "",
        height: data.height?.toString() ?? "",
        weight: data.weight?.toString() ?? "",
        date_of_birth: data.date_of_birth ?? "",
        phone: data.phone ?? "",
        admin_notes: data.admin_notes ?? "",
      });
    } catch {
      setError("Öğrenci bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await api.admin.updatePatient(token, id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone,
        admin_notes: form.admin_notes,
      });
      setPatient(updated);
      setSuccess("Profil güncellendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
    } finally {
      setSaving(false);
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
      const result = await api.admin.addWeight(token, id, weight);
      setPatient(result.patient);
      setForm((f) => ({ ...f, weight: weight.toString() }));
      setNewWeight("");
      setSuccess("Yeni kilo kaydı eklendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kilo kaydı eklenemedi.");
    } finally {
      setAddingWeight(false);
    }
  };

  const showMessage = (message: string, type: "success" | "error") => {
    if (type === "error") {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      showMessage("Şifreler eşleşmiyor.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showMessage("Şifre en az 6 karakter olmalıdır.", "error");
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    setChangingPassword(true);
    try {
      await api.admin.setPassword(token, id, newPassword);
      showMessage("Şifre başarıyla güncellendi.", "success");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Şifre güncellenemedi.", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotosChange = (photos: PatientProgressPhoto[]) => {
    setPatient((current) => (current ? { ...current, progress_photos: photos } : current));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  if (!patient) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-slate-600 dark:text-slate-300">{error || "Öğrenci bulunamadı."}</p>
        <Link
          href="/panel/ogrenciler"
          className="mt-4 inline-block text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          ← Öğrenci listesine dön
        </Link>
      </GlassCard>
    );
  }

  const bmi =
    patient.height && patient.weight
      ? calculateBMI(patient.height, patient.weight)
      : null;
  const category = bmi ? getBMICategory(bmi) : null;
  const idealRange =
    patient.height ? getIdealWeightRange(patient.height) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/panel/ogrenciler" className="text-sm font-medium text-blue-600 dark:text-blue-400">
            ← Öğrenciler
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
            {patient.full_name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            @{patient.username} · {patient.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bmi && category && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${category.colorClass} bg-slate-100 dark:bg-slate-800`}>
              BMI {bmi.toFixed(1)} · {category.label}
            </span>
          )}
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {patient.weight ? `${patient.weight} kg` : "Kilo yok"}
          </span>
          <DownloadReportButton patientId={id} />
        </div>
      </div>

      {(error || success) && (
        <div className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
          {error || success}
        </div>
      )}

      <div className="flex flex-wrap gap-1 rounded-2xl border border-white/30 bg-white/40 p-1 backdrop-blur-md dark:border-slate-600/40 dark:bg-slate-900/40">
        {(["profil", "egzersizler", "paketler", "postur", "olcumler", "diyet", "onboarding"] as const).map((tab) => {
          const labels: Record<string, string> = {
            profil: "Profil",
            egzersizler: "Egzersizler",
            paketler: "Paketler",
            postur: "Postür & Fotoğraf",
            olcumler: "Kilo & Ölçümler",
            diyet: "Diyet",
            onboarding: "Onboarding",
          };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {activeTab === "profil" && (
        <>
        <GlassCard className="p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Profil Bilgileri</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Ad" name="first_name" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
              <FormField label="Soyad" name="last_name" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="E-posta" name="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <FormField label="Telefon" name="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Boy (cm)" name="height" type="number" min={100} max={250} value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
              <FormField label="Kilo (kg)" name="weight" type="number" min={30} max={300} step="0.1" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
              <FormField label="Doğum Tarihi" name="date_of_birth" type="date" value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Terapist Notları</label>
              <textarea
                rows={4}
                value={form.admin_notes}
                onChange={(e) => setForm((p) => ({ ...p, admin_notes: e.target.value }))}
                placeholder="Bu hasta hakkında dahili notlar..."
                className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
            {bmi && category && idealRange && (
              <div className="rounded-xl bg-slate-50/80 p-4 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Vücut Analizi</p>
                <div className="mt-2 flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-slate-500">BMI: </span>
                    <span className={`font-semibold ${category.colorClass}`}>{bmi.toFixed(1)} ({category.label})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">İdeal kilo: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{idealRange.min}–{idealRange.max} kg</span>
                  </div>
                </div>
              </div>
            )}
            <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
              {saving ? "Kaydediliyor…" : "Profili Kaydet"}
            </button>
          </form>
        </GlassCard>

        {/* Şifre Değiştir */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Şifre Değiştir</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full rounded-xl border border-slate-200/60 bg-white/60 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Şifreyi Tekrarla</label>
                <input
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="Aynı şifreyi girin"
                  className="w-full rounded-xl border border-slate-200/60 bg-white/60 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-100"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={changingPassword || !newPassword || !newPasswordConfirm}
              className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {changingPassword ? "Güncelleniyor…" : "Şifreyi Güncelle"}
            </button>
          </form>
        </GlassCard>
        </>
      )}

      {activeTab === "egzersizler" && (
        <PatientExerciseSection patientId={id} onMessage={showMessage} />
      )}

      {activeTab === "paketler" && (
        <PatientPackageSection
          patientId={id}
          packages={patient.packages ?? []}
          attendance={patient.attendance}
          onMessage={showMessage}
          onChanged={loadPatient}
        />
      )}

      {activeTab === "postur" && (
        <div className="space-y-4">
          <PostureAnalysis patientId={id} onMessage={showMessage} />
          <PatientPhotoSection
            patientId={id}
            photos={patient.progress_photos ?? []}
            onPhotosChange={handlePhotosChange}
            onMessage={showMessage}
          />
        </div>
      )}

      {activeTab === "olcumler" && (
        <BodyMeasurementsSection
          patientId={id}
          patientName={patient.full_name}
          onMessage={showMessage}
        />
      )}

      {activeTab === "diyet" && (
        <PatientDietSection patientId={id} onMessage={showMessage} />
      )}

      {activeTab === "onboarding" && (
        <PatientOnboardingTab patientId={id} completed={patient?.onboarding_completed ?? false} />
      )}
    </div>
  );
}

function PatientOnboardingTab({ patientId, completed }: { patientId: number; completed: boolean }) {
  const [answers, setAnswers] = useState<import("@/lib/api").OnboardingAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    api.admin.onboarding.patientAnswers(token, patientId).then((data) => {
      setAnswers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  if (answers.length === 0) {
    return (
      <GlassCard className="p-8 text-center space-y-2">
        {!completed && (
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
            Öğrenci onboarding sürecini henüz tamamlamadı
          </p>
        )}
        <p className="text-slate-500 dark:text-slate-400 text-sm">Onboarding yanıtı bulunamadı.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {answers.map((a) => (
        <GlassCard key={a.id} className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {a.question_text}
          </p>
          <p className="mt-1.5 text-sm text-slate-800 dark:text-slate-100">
            {Array.isArray(a.answer) ? a.answer.join(", ") : String(a.answer)}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
