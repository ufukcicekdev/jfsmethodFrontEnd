"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { api, type OnboardingQuestion, type OnboardingSection } from "@/lib/api";
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

const EMPTY_QUESTION = {
  text: "",
  question_type: "text" as OnboardingQuestion["question_type"],
  options: [] as string[],
  is_required: true,
  sort_order: 0,
  is_active: true,
  section: null as number | null,
};

// ── Inline question form ──────────────────────────────────────────────────────

function QuestionForm({
  initial,
  sectionId,
  onSave,
  onCancel,
}: {
  initial: typeof EMPTY_QUESTION;
  sectionId: number | null;
  onSave: (data: typeof EMPTY_QUESTION) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...initial, section: sectionId });
  const [newOption, setNewOption] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const needsOptions = form.question_type === "choice" || form.question_type === "multi";

  const addOption = () => {
    const val = newOption.trim();
    if (!val) return;
    setForm((f) => ({ ...f, options: [...f.options, val] }));
    setNewOption("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref}>
      <GlassCard className="overflow-visible border border-blue-300/40 p-5 dark:border-blue-700/40 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Soru Metni
            </label>
            <textarea
              rows={2}
              required
              autoFocus
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Soru Tipi</label>
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sıra No</label>
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
                <input type="checkbox" checked={form.is_required} onChange={(e) => setForm((f) => ({ ...f, is_required: e.target.checked }))} className="h-4 w-4 rounded" />
                Zorunlu
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded" />
                Aktif
              </label>
            </div>
          </div>

          {needsOptions && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Seçenekler</label>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm dark:bg-slate-800">{opt}</span>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }))} className="text-sm text-red-500 hover:text-red-700">Sil</button>
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
                  <button type="button" onClick={addOption} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Ekle</button>
                </div>
              </div>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
              İptal
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ── Section edit form ─────────────────────────────────────────────────────────

function SectionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: { title: string; description: string; sort_order: number };
  onSave: (data: { title: string; description: string; sort_order: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError("");
    try { await onSave(form); }
    catch (err) { setError(err instanceof Error ? err.message : "Kaydedilemedi."); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bölüm Başlığı *</label>
          <input required autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="örn: Sizi Tanıyalım" className="w-full rounded-xl border border-white/30 bg-white/50 px-3 py-2.5 text-sm text-slate-800 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sıra No</label>
          <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} className="w-full rounded-xl border border-white/30 bg-white/50 px-3 py-2.5 text-sm text-slate-800 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Açıklama (opsiyonel)</label>
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Bu bölümde ne sorulacağını kısaca açıklayın" className="w-full rounded-xl border border-white/30 bg-white/50 px-3 py-2.5 text-sm text-slate-800 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">İptal</button>
      </div>
    </form>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({
  q,
  openId,
  setOpenId,
  onSave,
  onDelete,
  sectionId,
}: {
  q: OnboardingQuestion;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onSave: (id: number, data: typeof EMPTY_QUESTION) => Promise<void>;
  onDelete: (q: OnboardingQuestion) => void;
  sectionId: number | null;
}) {
  const key = `q-${q.id}`;
  const isOpen = openId === key;

  return (
    <div className="space-y-2">
      <GlassCard className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400">#{q.sort_order}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[q.question_type]}`}>{TYPE_LABELS[q.question_type]}</span>
            {q.is_required && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">Zorunlu</span>}
            {!q.is_active && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800">Pasif</span>}
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{q.text}</p>
          {q.options.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((opt, i) => (
                <span key={i} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">{opt}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setOpenId(isOpen ? null : key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${isOpen ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
          >
            {isOpen ? "Kapat" : "Düzenle"}
          </button>
          <button type="button" onClick={() => onDelete(q)} className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400">Sil</button>
        </div>
      </GlassCard>
      {isOpen && (
        <QuestionForm
          initial={{ text: q.text, question_type: q.question_type, options: [...q.options], is_required: q.is_required, sort_order: q.sort_order, is_active: q.is_active ?? true, section: sectionId }}
          sectionId={sectionId}
          onSave={(data) => onSave(q.id, data)}
          onCancel={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingAdminPage() {
  const confirm = useConfirm();
  const [sections, setSections] = useState<OnboardingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null); // "q-{id}" | "new-q-{sectionId}" | "new-section" | "edit-section-{id}"

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      setSections(await api.admin.onboarding.sections(token));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Section actions ───────────────────────────────────────────────────────

  const handleSaveSection = async (id: number | null, data: { title: string; description: string; sort_order: number }) => {
    const token = getAccessToken();
    if (!token) return;
    if (id) {
      await api.admin.onboarding.updateSection(token, id, data);
    } else {
      await api.admin.onboarding.createSection(token, data);
    }
    setOpenId(null);
    await load();
  };

  const handleDeleteSection = async (s: OnboardingSection) => {
    const ok = await confirm({
      title: "Bölümü Sil",
      message: `"${s.title}" bölümü silinecek. İçindeki sorular bölümsüz kalacak.`,
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    await api.admin.onboarding.deleteSection(token, s.id);
    await load();
  };

  // ── Question actions ──────────────────────────────────────────────────────

  const handleSaveQuestion = async (id: number | null, data: typeof EMPTY_QUESTION) => {
    const token = getAccessToken();
    if (!token) return;
    if (id) {
      await api.admin.onboarding.update(token, id, data);
    } else {
      await api.admin.onboarding.create(token, data);
    }
    setOpenId(null);
    await load();
  };

  const handleDeleteQuestion = async (q: OnboardingQuestion) => {
    const ok = await confirm({ title: "Soruyu Sil", message: `"${q.text}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    await api.admin.onboarding.delete(token, q.id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Onboarding Soruları</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Yeni hasta kayıt akışındaki bölümler ve sorular
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenId(openId === "new-section" ? null : "new-section")}
          className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          + Yeni Bölüm Ekle
        </button>
      </div>

      {/* New section form */}
      {openId === "new-section" && (
        <GlassCard className="border border-blue-300/40 p-5 dark:border-blue-700/40">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Yeni Onboarding Bölümü</h2>
          <SectionForm
            initial={{ title: "", description: "", sort_order: sections.length }}
            onSave={(data) => handleSaveSection(null, data)}
            onCancel={() => setOpenId(null)}
          />
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : sections.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">Henüz bölüm eklenmemiş. Önce bir bölüm oluşturun.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {sections.map((s) => {
            const editKey = `edit-section-${s.id}`;
            const newQKey = `new-q-${s.id}`;
            const isEditingSection = openId === editKey;

            return (
              <div key={s.id} className="space-y-3">
                {/* Section header */}
                <GlassCard className="p-4 sm:p-5">
                  {isEditingSection ? (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Bölümü Düzenle</h3>
                      <SectionForm
                        initial={{ title: s.title, description: s.description, sort_order: s.sort_order }}
                        onSave={(data) => handleSaveSection(s.id, data)}
                        onCancel={() => setOpenId(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">#{s.sort_order}</span>
                          <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">{s.title}</h2>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {s.questions.length} soru
                          </span>
                        </div>
                        {s.description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{s.description}</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenId(openId === newQKey ? null : newQKey)}
                          className="rounded-full border border-emerald-400/50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400"
                        >
                          + Soru Ekle
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenId(isEditingSection ? null : editKey)}
                          className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(s)}
                          className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  )}
                </GlassCard>

                {/* New question form for this section */}
                {openId === newQKey && (
                  <QuestionForm
                    initial={{ ...EMPTY_QUESTION, sort_order: s.questions.length, section: s.id }}
                    sectionId={s.id}
                    onSave={(data) => handleSaveQuestion(null, data)}
                    onCancel={() => setOpenId(null)}
                  />
                )}

                {/* Questions in this section */}
                {s.questions.length === 0 && openId !== newQKey ? (
                  <p className="pl-4 text-sm text-slate-400 dark:text-slate-500 italic">Bu bölümde henüz soru yok.</p>
                ) : (
                  <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                    {s.questions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        q={q}
                        openId={openId}
                        setOpenId={setOpenId}
                        onSave={(id, data) => handleSaveQuestion(id, data)}
                        onDelete={handleDeleteQuestion}
                        sectionId={s.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
