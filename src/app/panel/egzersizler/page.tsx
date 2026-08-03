"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CategoryTree } from "@/components/ui/CategoryTree";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { FormField, FormGroup } from "@/components/ui/FormField";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getAccessToken } from "@/lib/auth";
import { api, type Exercise, type Category } from "@/lib/api";
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
  category: null as number | null,
};

// ─── Category dialog ──────────────────────────────────────────────────────────

function CategoryDialog({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  initial: string;
}) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          {initial ? "Kategoriyi Yeniden Adlandır" : "Yeni Kategori"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kategori adı"
            className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-700/80 dark:text-slate-100"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">İptal</button>
            <button type="submit" disabled={saving || !name.trim()} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ExerciseLibraryPage() {
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Category dialog state
  const [catDialog, setCatDialog] = useState<{
    mode: "add-root" | "add-child" | "rename";
    parentId?: number;
    cat?: Category;
  } | null>(null);

  const loadCategories = () => {
    const token = getAccessToken();
    if (!token) return;
    api.admin.categoryTree(token, "exercise").then(setCategories).catch(() => {});
  };

  const loadExercises = (catId: number | null) => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    api.admin
      .exerciseLibrary(token, catId)
      .then(setExercises)
      .catch(() => setMessage({ type: "error", text: "Egzersizler yüklenemedi." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadExercises(selectedCategoryId);
  }, [selectedCategoryId]);

  // ── Category actions ──────────────────────────────────────────────────────

  const handleCatSave = async (name: string) => {
    const token = getAccessToken();
    if (!token || !catDialog) return;
    if (catDialog.mode === "rename" && catDialog.cat) {
      await api.admin.updateCategory(token, catDialog.cat.id, { name });
    } else {
      await api.admin.createCategory(token, {
        name,
        category_type: "exercise",
        parent: catDialog.parentId ?? null,
      });
    }
    loadCategories();
  };

  const handleCatDelete = async (cat: Category) => {
    const ok = await confirm({
      title: "Kategoriyi sil",
      message: `"${cat.name}" kategorisini silmek istediğinize emin misiniz? Altındaki tüm alt kategoriler ve egzersizlerin kategori bağlantısı kaldırılır.`,
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    await api.admin.deleteCategory(token, cat.id);
    if (selectedCategoryId === cat.id) setSelectedCategoryId(null);
    loadCategories();
    loadExercises(null);
  };

  // ── Exercise actions ──────────────────────────────────────────────────────

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, category: selectedCategoryId });
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setShowForm(false);
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
      category: ex.category,
    });
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setShowForm(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    if (!form.title.trim()) { setMessage({ type: "error", text: "Egzersiz adı zorunludur." }); return; }
    if (!form.instructions.trim()) { setMessage({ type: "error", text: "Talimatlar zorunludur." }); return; }

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
      video: videoFile,
      category: form.category,
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
      loadExercises(selectedCategoryId);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "İşlem başarısız." });
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
      loadExercises(selectedCategoryId);
    } catch { setMessage({ type: "error", text: "Güncellenemedi." }); }
    finally { setBusyId(null); }
  };

  const remove = async (ex: Exercise) => {
    const ok = await confirm({ title: "Egzersizi sil", message: `"${ex.title}" egzersizini silmek istediğinize emin misiniz?`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    setBusyId(ex.id);
    try {
      await api.admin.deleteExercise(token, ex.id);
      setMessage({ type: "success", text: "Egzersiz silindi." });
      loadExercises(selectedCategoryId);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Silinemedi." });
    } finally { setBusyId(null); }
  };

  // ── Category select options for form ──────────────────────────────────────

  const flattenCategories = (nodes: Category[], prefix = ""): { value: string; label: string }[] => {
    const result: { value: string; label: string }[] = [];
    for (const n of nodes) {
      result.push({ value: String(n.id), label: prefix + n.name });
      result.push(...flattenCategories(n.children, prefix + "  "));
    }
    return result;
  };

  const categoryOptions = [
    { value: "", label: "Kategorisiz" },
    ...flattenCategories(categories),
  ];

  // ── Selected category label ───────────────────────────────────────────────

  const findCatName = (nodes: Category[], id: number): string | null => {
    for (const n of nodes) {
      if (n.id === id) return n.name;
      const r = findCatName(n.children, id);
      if (r) return r;
    }
    return null;
  };

  const selectedCatName = selectedCategoryId ? findCatName(categories, selectedCategoryId) : null;

  return (
    <div className="flex gap-6">
      {/* ── Sidebar: Category tree ───────────────────────────────────────────── */}
      <div className="hidden w-56 shrink-0 lg:block">
        <GlassCard className="sticky top-4 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kategoriler</span>
            <button
              type="button"
              title="Kök kategori ekle"
              onClick={() => setCatDialog({ mode: "add-root" })}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={`mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors ${
              selectedCategoryId === null
                ? "bg-blue-500 text-white"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50"
            }`}
          >
            Tümü
          </button>

          {categories.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400">Henüz kategori yok</p>
          ) : (
            <CategoryTree
              nodes={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              onAddChild={(parentId) => setCatDialog({ mode: "add-child", parentId })}
              onRename={(cat) => setCatDialog({ mode: "rename", cat })}
              onDelete={handleCatDelete}
            />
          )}
        </GlassCard>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1 space-y-4 sm:space-y-6">
        {/* Mobile category strip */}
        {categories.length > 0 && (
          <div className="lg:hidden -mx-1 overflow-x-auto pb-1">
            <div className="flex gap-2 px-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedCategoryId === null ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
              >
                Tümü
              </button>
              {flattenCategories(categories).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedCategoryId(Number(opt.value))}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedCategoryId === Number(opt.value) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
              Egzersizler
              {selectedCatName && (
                <span className="ml-2 text-base font-normal text-slate-500 dark:text-slate-400">
                  › {selectedCatName}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Egzersiz kütüphanesini buradan yönetin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setForm({ ...EMPTY_FORM, category: selectedCategoryId }); setShowForm(true); }}
            className="flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            <span>+ Egzersiz Ekle</span>
          </button>
        </div>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"}`}>
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
              {selectedCategoryId ? "Bu kategoride egzersiz yok." : "Henüz egzersiz yok."}
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {exercises.map((ex) => (
              <GlassCard key={ex.id} className={`overflow-hidden p-0 ${ex.is_active ? "" : "opacity-70"}`}>
                <button
                  type="button"
                  className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-700/40"
                  onClick={() => setLightbox(ex.video_url ? { src: ex.video_url, type: "video" } : { src: getExerciseImage(ex), type: "image" })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getExerciseImage(ex)} alt={ex.title} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
                    {ex.video_url ? "▶ Oynat" : "⛶ Büyüt"}
                  </span>
                  {!ex.is_active && <span className="absolute left-3 top-3 rounded-full bg-slate-700/80 px-2 py-0.5 text-[10px] font-medium text-white">Pasif</span>}
                  {ex.video_url && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">▶ Video</span>}
                </button>
                <div className="p-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{ex.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {ex.target_region_label || "Genel"} · {ex.sets}×{ex.reps} · {ex.difficulty_label}
                    {ex.category && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {findCatName(categories, ex.category) ?? ""}
                      </span>
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEdit(ex)} className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200">Düzenle</button>
                    <button type="button" disabled={busyId === ex.id} onClick={() => toggleActive(ex)} className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600/60 dark:text-slate-200">
                      {ex.is_active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                    <button type="button" disabled={busyId === ex.id} onClick={() => remove(ex)} className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30">Sil</button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

      </div>

      {/* ── Exercise form MODAL ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200/60 px-6 py-4 dark:border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {editingId ? "Egzersizi Düzenle" : "Yeni Egzersiz Ekle"}
            </h2>
            <button type="button" onClick={resetForm} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">✕</button>
            </div>
            <div className="p-6">
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <FormField
                label="Egzersiz Adı"
                name="title"
                required
                placeholder="Örn. Düz Bacak Kaldırma"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />

              <FormGroup label="Kategori">
                <CustomSelect
                  value={form.category ? String(form.category) : ""}
                  onChange={(v) => setForm((f) => ({ ...f, category: v ? Number(v) : null }))}
                  className="w-full"
                  options={categoryOptions}
                  aria-label="Kategori"
                />
              </FormGroup>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormGroup label="Hedef Bölge">
                  <CustomSelect value={form.target_region} onChange={(v) => setForm((f) => ({ ...f, target_region: String(v) }))} className="w-full" options={REGION_OPTIONS} aria-label="Hedef bölge" />
                </FormGroup>
                <FormGroup label="Zorluk">
                  <CustomSelect value={form.difficulty} onChange={(v) => setForm((f) => ({ ...f, difficulty: String(v) }))} className="w-full" options={DIFFICULTY_OPTIONS} aria-label="Zorluk" />
                </FormGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Süre (dk)" name="duration_minutes" type="number" min={1} max={120} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
                <FormField label="Set" name="sets" type="number" min={1} max={20} value={form.sets} onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))} />
                <FormField label="Tekrar" name="reps" type="number" min={1} max={100} value={form.reps} onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))} />
              </div>

              <FormGroup label="Açıklama (opsiyonel)">
                <textarea rows={2} value={form.description} placeholder="Egzersizin amacı / faydası" onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500" />
              </FormGroup>

              <FormGroup label="Talimatlar (adım adım)">
                <textarea rows={5} value={form.instructions} placeholder={"1. Sırtüstü yatın…\n2. Bacağı kaldırın…"} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500" />
              </FormGroup>

              <FormGroup label="Görsel (opsiyonel — yüklenmezse bölge görseli kullanılır)">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-600/50 dark:bg-slate-700/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview ?? getExerciseImage({ image_url: editingId ? (exercises.find((e) => e.id === editingId)?.image_url ?? null) : null, target_region: form.target_region as Exercise["target_region"] })}
                      alt="Önizleme"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 dark:text-slate-300" />
                </div>
              </FormGroup>

              <FormGroup label="Video (opsiyonel — MP4, MOV veya WebM, maks. 100 MB)">
                <div className="flex items-start gap-4">
                  {(videoPreview ?? (editingId ? exercises.find((e) => e.id === editingId)?.video_url : null)) ? (
                    <video src={videoPreview ?? exercises.find((e) => e.id === editingId)?.video_url ?? undefined} className="h-20 w-28 shrink-0 rounded-xl border border-slate-200/80 object-cover dark:border-slate-600/50" muted playsInline />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300/70 bg-slate-100 dark:border-slate-600/50 dark:bg-slate-700/40"><span className="text-2xl text-slate-400">▶</span></div>
                  )}
                  <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setVideoFile(f); setVideoPreview(URL.createObjectURL(f)); } }} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 dark:text-slate-300" />
                </div>
              </FormGroup>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400" />
                Aktif (atama listesinde görünür)
              </label>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
                  {saving ? "Kaydediliyor…" : editingId ? "Güncelle" : "Egzersiz Ekle"}
                </button>
                <button type="button" onClick={resetForm} className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-600/60 dark:text-slate-200">
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ───────────────────────────────────────────────────────────── */}
      {lightbox && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40" aria-label="Kapat">✕</button>
          {lightbox.type === "video" ? (
            <video src={lightbox.src} controls autoPlay playsInline className="max-h-[90vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox.src} alt="" className="max-h-[90vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}

      {/* ── Category dialog ────────────────────────────────────────────────────── */}
      {catDialog && (
        <CategoryDialog
          initial={catDialog.mode === "rename" && catDialog.cat ? catDialog.cat.name : ""}
          onClose={() => setCatDialog(null)}
          onSave={handleCatSave}
        />
      )}
    </div>
  );
}
