"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { getAccessToken } from "@/lib/auth";
import { api, type AdminPatient } from "@/lib/api";

type Mode = "all" | "selected";
type Tab = "send" | "templates";
type NotifTemplate = { id: number; title: string; body: string };

// ────────────────────────────────────────────────────────────
// Hazır Bildirimler Tab
// ────────────────────────────────────────────────────────────
function TemplatesTab() {
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NotifTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const token = getAccessToken()!;

  const load = () => {
    setLoading(true);
    api.admin.notificationTemplates(token)
      .then(setTemplates)
      .catch(() => setFeedback({ type: "error", message: "Şablonlar yüklenemedi." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setFormTitle("");
    setFormBody("");
    setShowForm(true);
    setFeedback(null);
  };

  const openEdit = (t: NotifTemplate) => {
    setEditing(t);
    setFormTitle(t.title);
    setFormBody(t.body);
    setShowForm(true);
    setFeedback(null);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formBody.trim()) {
      setFeedback({ type: "error", message: "Başlık ve mesaj zorunludur." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      if (editing) {
        await api.admin.updateNotificationTemplate(token, editing.id, { title: formTitle.trim(), body: formBody.trim() });
      } else {
        await api.admin.createNotificationTemplate(token, { title: formTitle.trim(), body: formBody.trim() });
      }
      setShowForm(false);
      load();
    } catch {
      setFeedback({ type: "error", message: "Kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
    try {
      await api.admin.deleteNotificationTemplate(token, id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setFeedback({ type: "error", message: "Silinemedi." });
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Hızlıca seçip gönderebileceğiniz hazır bildirim metinleri.</p>
        <button
          type="button"
          onClick={openNew}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          + Yeni Şablon
        </button>
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4 border-2 border-blue-400/30">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {editing ? "Şablonu Düzenle" : "Yeni Şablon"}
          </h3>
          <FormField
            label="Başlık"
            name="tpl-title"
            placeholder="Bildirim başlığı"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mesaj<span className="ml-0.5 text-blue-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Bildirim mesajı..."
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none resize-none hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              İptal
            </button>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : templates.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-400 dark:text-slate-500">Henüz hazır bildirim şablonu yok.</p>
          <p className="mt-1 text-xs text-slate-400">Yukarıdan yeni şablon ekleyin.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <GlassCard key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{t.body}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
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

// ────────────────────────────────────────────────────────────
// Bildirim Gönder Tab
// ────────────────────────────────────────────────────────────
function SendTab() {
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | "custom" | "">("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<Mode>("all");
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<AdminPatient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const token = getAccessToken()!;

  useEffect(() => {
    api.admin.notificationTemplates(token).then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== "selected") return;
    if (patients.length > 0) return;
    setLoadingPatients(true);
    api.admin.patients(token, undefined, 1, 1000)
      .then(({ results }) => { setPatients(results); setFilteredPatients(results); })
      .catch(() => setFeedback({ type: "error", message: "Öğrenciler yüklenemedi." }))
      .finally(() => setLoadingPatients(false));
  }, [mode, patients.length]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredPatients(patients.filter((p) => p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)));
  }, [search, patients]);

  const handleTemplateSelect = (val: string) => {
    if (val === "" || val === "custom") {
      setSelectedTemplate(val === "custom" ? "custom" : "");
      if (val !== "custom") { setTitle(""); setBody(""); }
    } else {
      const id = Number(val);
      const tpl = templates.find((t) => t.id === id);
      if (tpl) { setTitle(tpl.title); setBody(tpl.body); }
      setSelectedTemplate(id);
    }
  };

  const togglePatient = (id: number) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.size === filteredPatients.length ? new Set() : new Set(filteredPatients.map((p) => p.id)));
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setFeedback({ type: "error", message: "Başlık ve mesaj alanları zorunludur." });
      return;
    }
    if (mode === "selected" && selectedIds.size === 0) {
      setFeedback({ type: "error", message: "Lütfen en az bir öğrenci seçin." });
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      const payload: { title: string; body: string; patient_ids?: number[] } = { title: title.trim(), body: body.trim() };
      if (mode === "selected") payload.patient_ids = Array.from(selectedIds);
      const result = await api.admin.sendNotification(token, payload);
      setFeedback({ type: "success", message: `Bildirim ${result.sent_to} öğrenciye başarıyla gönderildi.` });
      setTitle(""); setBody(""); setSelectedIds(new Set()); setSelectedTemplate("");
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Bildirim gönderilemedi." });
    } finally {
      setSending(false);
    }
  };

  const isCustom = selectedTemplate === "custom" || selectedTemplate === "";
  const showFields = selectedTemplate !== "";

  return (
    <div className="space-y-5">
      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
          {feedback.message}
        </div>
      )}

      <GlassCard className="p-6 space-y-5">
        {/* Şablon seçici */}
        {templates.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bildirim Türü
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTemplateSelect(String(t.id))}
                  className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-all ${selectedTemplate === t.id ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500" : "border-slate-200/90 bg-white/60 hover:border-slate-300 hover:bg-white dark:border-slate-600/60 dark:bg-slate-800/60 dark:hover:bg-slate-800"}`}
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</span>
                  <span className="mt-0.5 text-xs text-slate-400 line-clamp-1">{t.body}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleTemplateSelect("custom")}
                className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-all ${selectedTemplate === "custom" ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-500" : "border-dashed border-slate-300 bg-white/40 hover:border-slate-400 hover:bg-white dark:border-slate-600 dark:bg-slate-800/40 dark:hover:bg-slate-800"}`}
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">✏️ Özel Mesaj</span>
                <span className="mt-0.5 text-xs text-slate-400">Kendiniz yazın</span>
              </button>
            </div>
          </div>
        )}

        {/* Form alanları */}
        {(showFields || templates.length === 0) && (
          <>
            <FormField
              label="Başlık"
              name="title"
              placeholder="Bildirim başlığı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={!isCustom}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mesaj<span className="ml-0.5 text-blue-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Bildirim mesajı..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={!isCustom}
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none resize-none hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </>
        )}

        {/* Alıcılar */}
        {(showFields || templates.length === 0) && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Alıcılar</p>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="radio" name="mode" value="all" checked={mode === "all"} onChange={() => setMode("all")} className="accent-blue-500" />
                Tüm Öğrenciler
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="radio" name="mode" value="selected" checked={mode === "selected"} onChange={() => setMode("selected")} className="accent-blue-500" />
                Seçili Öğrenciler
              </label>
            </div>
          </div>
        )}

        {(showFields || templates.length === 0) && (
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Gönderiliyor...</>
            ) : (
              <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Gönder</>
            )}
          </button>
        )}
      </GlassCard>

      {mode === "selected" && (showFields || templates.length === 0) && (
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Öğrenci Seçimi
              {selectedIds.size > 0 && (
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {selectedIds.size} seçili
                </span>
              )}
            </h2>
          </div>
          <input
            type="text"
            placeholder="İsim veya e-posta ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {loadingPatients ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200/60 dark:border-slate-600/40">
              {filteredPatients.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Öğrenci bulunamadı.</p>
              ) : (
                <>
                  <button type="button" onClick={toggleAll}
                    className="flex w-full items-center gap-3 border-b border-slate-200/60 bg-slate-50/70 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100/70 dark:border-slate-600/40 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700/50">
                    <input type="checkbox" readOnly checked={selectedIds.size === filteredPatients.length && filteredPatients.length > 0} className="accent-blue-500" />
                    {selectedIds.size === filteredPatients.length && filteredPatients.length > 0 ? "Tümünü Kaldır" : "Tümünü Seç"}
                  </button>
                  {filteredPatients.map((patient) => (
                    <label key={patient.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100/60 px-4 py-3 hover:bg-white/60 dark:border-slate-700/40 dark:hover:bg-slate-800/40 last:border-b-0">
                      <input type="checkbox" checked={selectedIds.has(patient.id)} onChange={() => togglePatient(patient.id)} className="accent-blue-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{patient.full_name}</p>
                        {patient.email && <p className="truncate text-xs text-slate-400 dark:text-slate-500">{patient.email}</p>}
                      </div>
                    </label>
                  ))}
                </>
              )}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Ana Sayfa
// ────────────────────────────────────────────────────────────
export default function BildirimGonderPage() {
  const [tab, setTab] = useState<Tab>("send");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bildirim Gönder</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Öğrencilere push bildirimi ve uygulama içi bildirim gönderin.
        </p>
      </div>

      {/* Tab Başlıkları */}
      <div className="flex gap-1 rounded-xl border border-slate-200/80 bg-slate-100/60 p-1 dark:border-slate-700/60 dark:bg-slate-800/60 w-fit">
        {([
          { key: "send", label: "Bildirim Gönder" },
          { key: "templates", label: "Hazır Bildirimler" },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${tab === key ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "send" ? <SendTab /> : <TemplatesTab />}
    </div>
  );
}
