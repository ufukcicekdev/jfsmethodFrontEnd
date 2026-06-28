"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { FormField, FormGroup } from "@/components/ui/FormField";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getAccessToken } from "@/lib/auth";
import { api, type Exercise } from "@/lib/api";
import { getExerciseImage } from "@/lib/exerciseImages";

const REGION_OPTIONS = [
  { value: "", label: "Genel / Belirtilmemiş" },
  { value: "neck", label: "Boyun" },
  { value: "shoulder_left", label: "Sol Omuz" },
  { value: "shoulder_right", label: "Sağ Omuz" },
  { value: "upper_back", label: "Üst Sırt" },
  { value: "lower_back", label: "Bel" },
  { value: "hip_left", label: "Sol Kalça" },
  { value: "hip_right", label: "Sağ Kalça" },
  { value: "knee_left", label: "Sol Diz" },
  { value: "knee_right", label: "Sağ Diz" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

const EMPTY_FORM = {
  title: "",
  target_region: "",
  difficulty: "easy",
  duration_minutes: "10",
  sets: "3",
  reps: "10",
  description: "",
  instructions: "",
  is_active: true,
};

export default function ExerciseLibraryPage() {
  const confirm = useConfirm();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    api.admin
      .exerciseLibrary(token)
      .then(setExercises)
      .catch(() =>
        setMessage({ type: "error", text: "Egzersizler yüklenemedi." })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setForm({
      title: ex.title,
      target_region: ex.target_region,
      difficulty: ex.difficulty,
      duration_minutes: String(ex.duration_minutes),
      sets: String(ex.sets),
      reps: String(ex.reps),
      description: ex.description,
      instructions: ex.instructions,
      is_active: ex.is_active,
    });
    setImageFile(null);
    setImagePreview(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    if (!form.title.trim()) {
      setMessage({ type: "error", text: "Egzersiz adı zorunludur." });
      return;
    }
    if (!form.instructions.trim()) {
      setMessage({ type: "error", text: "Talimatlar zorunludur." });
      return;
    }

    setSaving(true);
    setMessage(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim(),
      target_region: form.target_region,
      duration_minutes: Number(form.duration_minutes) || 10,
      sets: Number(form.sets) || 1,
      reps: Number(form.reps) || 1,
      difficulty: form.difficulty,
      is_active: form.is_active,
      image: imageFile,
    };
    try {
      if (editingId) {
        await api.admin.updateExercise(token, editingId, payload);
        setMessage({ type: "success", text: "Egzersiz güncellendi." });
      } else {
        await api.admin.createExercise(token, payload);
        setMessage({ type: "success", text: "Egzersiz eklendi." });
      }
      resetForm();
      load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "İşlem başarısız.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ex: Exercise) => {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(ex.id);
    try {
      await api.admin.updateExercise(token, ex.id, { is_active: !ex.is_active });
      load();
    } catch {
      setMessage({ type: "error", text: "Güncellenemedi." });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (ex: Exercise) => {
    const ok = await confirm({
      title: "Egzersizi sil",
      message: `"${ex.title}" egzersizini silmek istediğinize emin misiniz? Atanmışsa pasifleştirilir.`,
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    setBusyId(ex.id);
    try {
      await api.admin.deleteExercise(token, ex.id);
      setMessage({ type: "success", text: "Egzersiz silindi." });
      load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Silinemedi.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Egzersizler
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Egzersiz kütüphanesini buradan yönetin (ad, bölge, set/tekrar, görsel,
          talimatlar). Hastalara bu kütüphaneden egzersiz atanır. Görsel
          yüklemezseniz vücut bölgesine uygun örnek görsel kullanılır.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : exercises.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Henüz egzersiz yok. Aşağıdan ilk egzersizinizi ekleyin.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map((ex) => (
            <GlassCard
              key={ex.id}
              className={`overflow-hidden p-0 ${ex.is_active ? "" : "opacity-70"}`}
            >
              <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-700/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getExerciseImage(ex)}
                  alt={ex.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {!ex.is_active && (
                  <span className="absolute left-3 top-3 rounded-full bg-slate-700/80 px-2 py-0.5 text-[10px] font-medium text-white">
                    Pasif
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {ex.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {ex.target_region_label || "Genel"} · {ex.sets}×{ex.reps} ·{" "}
                  {ex.difficulty_label}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(ex)}
                    className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    disabled={busyId === ex.id}
                    onClick={() => toggleActive(ex)}
                    className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600/60 dark:text-slate-200"
                  >
                    {ex.is_active ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === ex.id}
                    onClick={() => remove(ex)}
                    className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {editingId ? "Egzersizi Düzenle" : "Yeni Egzersiz Ekle"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            label="Egzersiz Adı"
            name="title"
            required
            placeholder="Örn. Düz Bacak Kaldırma"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup label="Hedef Bölge">
              <CustomSelect
                value={form.target_region}
                onChange={(v) =>
                  setForm((f) => ({ ...f, target_region: String(v) }))
                }
                className="w-full"
                options={REGION_OPTIONS}
                aria-label="Hedef bölge"
              />
            </FormGroup>
            <FormGroup label="Zorluk">
              <CustomSelect
                value={form.difficulty}
                onChange={(v) =>
                  setForm((f) => ({ ...f, difficulty: String(v) }))
                }
                className="w-full"
                options={DIFFICULTY_OPTIONS}
                aria-label="Zorluk"
              />
            </FormGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="Süre (dk)"
              name="duration_minutes"
              type="number"
              min={1}
              max={120}
              value={form.duration_minutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration_minutes: e.target.value }))
              }
            />
            <FormField
              label="Set"
              name="sets"
              type="number"
              min={1}
              max={20}
              value={form.sets}
              onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))}
            />
            <FormField
              label="Tekrar"
              name="reps"
              type="number"
              min={1}
              max={100}
              value={form.reps}
              onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
            />
          </div>

          <FormGroup label="Açıklama (opsiyonel)">
            <textarea
              rows={2}
              value={form.description}
              placeholder="Egzersizin amacı / faydası"
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </FormGroup>

          <FormGroup label="Talimatlar (adım adım)">
            <textarea
              rows={5}
              value={form.instructions}
              placeholder={"1. Sırtüstü yatın…\n2. Bacağı kaldırın…"}
              onChange={(e) =>
                setForm((f) => ({ ...f, instructions: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </FormGroup>

          <FormGroup label="Görsel (opsiyonel — yüklenmezse bölge görseli kullanılır)">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-600/50 dark:bg-slate-700/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    imagePreview ??
                    getExerciseImage({
                      image_url:
                        editingId
                          ? (exercises.find((e) => e.id === editingId)
                              ?.image_url ?? null)
                          : null,
                      target_region: form.target_region as Exercise["target_region"],
                    })
                  }
                  alt="Önizleme"
                  className="h-full w-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleImage(e.target.files?.[0])}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 dark:text-slate-300"
              />
            </div>
          </FormGroup>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
            />
            Aktif (atama listesinde görünür)
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {saving
                ? "Kaydediliyor…"
                : editingId
                  ? "Güncelle"
                  : "Egzersiz Ekle"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200"
              >
                Vazgeç
              </button>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
