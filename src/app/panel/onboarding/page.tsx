"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { api, type OnboardingQuestion } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const TYPE_LABELS: Record<string, string> = {
  text: "Açık Metin",
  choice: "Çoktan Seçmeli",
  scale: "Skala (1-10)",
  multi: "Çoklu Seçim",
};

const TYPE_COLORS: Record<string, string> = {
  text: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  choice: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  scale: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  multi: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const EMPTY_FORM = {
  text: "",
  question_type: "text" as OnboardingQuestion["question_type"],
  options: [] as string[],
  is_required: true,
  sort_order: 0,
  is_active: true,
};

export default function OnboardingAdminPage() {
  const confirm = useConfirm();
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [newOption, setNewOption] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.admin.onboarding.list(token);
      setQuestions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (q: OnboardingQuestion) => {
    setForm({
      text: q.text,
      question_type: q.question_type,
      options: [...q.options],
      is_required: q.is_required,
      sort_order: q.sort_order,
      is_active: q.is_active ?? true,
    });
    setEditingId(q.id);
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.admin.onboarding.update(token, editingId, form);
      } else {
        await api.admin.onboarding.create(token, form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: OnboardingQuestion) => {
    const ok = await confirm({ title: "Soruyu Sil", message: `"${q.text}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.onboarding.delete(token, q.id);
      await load();
    } catch {
      setError("Silinemedi.");
    }
  };

  const addOption = () => {
    const val = newOption.trim();
    if (!val) return;
    setForm((f) => ({ ...f, options: [...f.options, val] }));
    setNewOption("");
  };

  const removeOption = (idx: number) => {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  };

  const needsOptions = form.question_type === "choice" || form.question_type === "multi";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Onboarding Soruları</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Yeni hasta kayıt akışındaki sorular
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          + Yeni Soru Ekle
        </button>
      </div>

      {showForm && (
        <GlassCard className="overflow-visible p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
            {editingId ? "Soruyu Düzenle" : "Yeni Soru"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Soru Metni
              </label>
              <textarea
                rows={2}
                required
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Soru Tipi
                </label>
                <CustomSelect
                  value={form.question_type}
                  onChange={(v) => setForm((f) => ({ ...f, question_type: v as OnboardingQuestion["question_type"], options: [] }))}
                  options={[
                    { value: "text", label: "Açık Metin" },
                    { value: "choice", label: "Çoktan Seçmeli" },
                    { value: "multi", label: "Çoklu Seçim" },
                    { value: "scale", label: "Skala (1-10)" },
                  ]}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Sıra No
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/30 bg-white/50 px-3 py-2.5 text-sm text-slate-800 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-2 pt-5">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_required}
                    onChange={(e) => setForm((f) => ({ ...f, is_required: e.target.checked }))}
                    className="h-4 w-4 rounded"
                  />
                  Zorunlu
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded"
                  />
                  Aktif
                </label>
              </div>
            </div>

            {needsOptions && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Seçenekler
                </label>
                <div className="space-y-2">
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="flex-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm dark:bg-slate-800">{opt}</span>
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                      placeholder="Seçenek ekle..."
                      className="flex-1 rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                İptal
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : questions.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">Henüz soru eklenmemiş.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <GlassCard key={q.id} className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">#{q.sort_order}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[q.question_type]}`}>
                    {TYPE_LABELS[q.question_type]}
                  </span>
                  {q.is_required && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      Zorunlu
                    </span>
                  )}
                  {!q.is_active && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800">
                      Pasif
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{q.text}</p>
                {q.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt, i) => (
                      <span key={i} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(q)}
                  className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(q)}
                  className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                >
                  Sil
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
