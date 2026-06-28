"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type Faq } from "@/lib/api";

const EMPTY_FORM = { question: "", answer: "", sort_order: 0, is_active: true };

export default function SssPage() {
  const confirm = useConfirm();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      setFaqs(await api.admin.faqs.list(token));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const notify = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (faq: Faq) => {
    setEditingId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order, is_active: faq.is_active });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    if (!form.question.trim() || !form.answer.trim()) {
      notify("Soru ve cevap zorunludur.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.admin.faqs.update(token, editingId, form);
        notify("Güncellendi.", "success");
      } else {
        await api.admin.faqs.create(token, form);
        notify("Eklendi.", "success");
      }
      setShowForm(false);
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "İşlem başarısız.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq: Faq) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "SSS Sil", message: `"${faq.question}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try {
      await api.admin.faqs.delete(token, faq.id);
      notify("Silindi.", "success");
      load();
    } catch {
      notify("Silinemedi.", "error");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Sıkça Sorulan Sorular</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Anasayfada görünen SSS bölümünü yönetin.</p>
        </div>
        <button type="button" onClick={openNew} className="shrink-0 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">
          + Yeni Soru
        </button>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "error" ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <GlassCard className="p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
            {editingId ? "Soruyu Düzenle" : "Yeni Soru Ekle"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Soru</label>
              <input
                type="text"
                required
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                placeholder="Sık sorulan soru…"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cevap</label>
              <textarea
                rows={4}
                required
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                placeholder="Detaylı cevap…"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sıra No</label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-24 rounded-xl border border-white/30 bg-white/50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 mt-4">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-500"
                />
                Aktif (anasayfada göster)
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200">
                İptal
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : faqs.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">Henüz soru eklenmemiş.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <GlassCard key={faq.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">#{faq.sort_order}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${faq.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                      {faq.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{faq.question}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{faq.answer}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => openEdit(faq)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-200 dark:hover:bg-slate-800">
                    Düzenle
                  </button>
                  <button type="button" onClick={() => handleDelete(faq)} className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                    Sil
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
