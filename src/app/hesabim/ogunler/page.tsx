"use client";

import { useEffect, useRef, useState } from "react";
import { api, type MealLog } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const MEAL_TYPES = [
  { value: "breakfast", label: "Kahvaltı", emoji: "🌅" },
  { value: "lunch", label: "Öğle", emoji: "☀️" },
  { value: "dinner", label: "Akşam", emoji: "🌙" },
  { value: "snack", label: "Ara Öğün", emoji: "🍎" },
] as const;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function OgunlerPage() {
  const [date, setDate] = useState(todayISO());
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ meal_type: "breakfast" as string, description: "", photo: null as File | null });
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const token = getAccessToken() ?? "";

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.wellness.mealLogs.list(token, date);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhoto = (file: File | null) => {
    setForm((f) => ({ ...f, photo: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.wellness.mealLogs.create(token, {
        meal_type: form.meal_type,
        description: form.description,
        logged_at: new Date().toISOString(),
        photo: form.photo ?? undefined,
      });
      setForm({ meal_type: "breakfast", description: "", photo: null });
      setPreview(null);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu öğün kaydını silmek istediğine emin misin?")) return;
    await api.wellness.mealLogs.delete(token, id);
    await load();
  };

  // Group logs by meal type
  const byType: Record<string, MealLog[]> = {};
  for (const log of logs) {
    if (!byType[log.meal_type]) byType[log.meal_type] = [];
    byType[log.meal_type].push(log);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Öğün Takibi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Günlük öğünlerinizi kaydedin ve takip edin</p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
          + Öğün Ekle
        </button>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        <button type="button" onClick={() => setDate(todayISO())}
          className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
          Bugün
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">Yeni Öğün Kaydı</h2>
          <div className="space-y-4">
            {/* Meal type selector */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MEAL_TYPES.map((mt) => (
                <button key={mt.value} type="button"
                  onClick={() => setForm((f) => ({ ...f, meal_type: mt.value }))}
                  className={`rounded-xl border-2 py-3 text-center text-sm font-semibold transition-all ${form.meal_type === mt.value ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"}`}>
                  <div className="text-xl">{mt.emoji}</div>
                  <div>{mt.label}</div>
                </button>
              ))}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Ne yediniz?</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2}
                placeholder="ör: 2 yumurta, tam buğday ekmek, peynir..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>

            {/* Photo */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Fotoğraf (opsiyonel)</label>
              {preview ? (
                <div className="relative w-40">
                  <img src={preview} alt="Önizleme" className="h-32 w-40 rounded-xl object-cover" />
                  <button type="button" onClick={() => handlePhoto(null)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex h-24 w-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-400 dark:border-slate-600">
                  📷 Fotoğraf Ekle
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)} />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={handleSubmit} disabled={saving || !form.meal_type}
                className="rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40">
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
          <p className="text-3xl">🍽️</p>
          <p className="mt-3 text-sm text-slate-500">Bu gün için henüz öğün kaydı yok.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {MEAL_TYPES.filter((mt) => byType[mt.value]?.length).map((mt) => (
            <div key={mt.value}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <span>{mt.emoji}</span> {mt.label}
              </h3>
              <div className="space-y-3">
                {byType[mt.value].map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900">
                    <div className="flex gap-4">
                      {log.photo_url && (
                        <img src={log.photo_url} alt="Öğün" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm text-slate-400">{formatTime(log.logged_at)}</p>
                            {log.description && <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{log.description}</p>}
                          </div>
                          <button type="button" onClick={() => handleDelete(log.id)}
                            className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-100">
                            Sil
                          </button>
                        </div>
                        {log.admin_note && (
                          <div className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                            <span className="font-semibold">Uzman notu:</span> {log.admin_note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
