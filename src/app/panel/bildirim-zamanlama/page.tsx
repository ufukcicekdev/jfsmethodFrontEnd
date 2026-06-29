"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type NotificationSchedule, type NotificationScheduleType } from "@/lib/api";

/* ─── Sabitler ────────────────────────────────────────────── */

const TYPE_OPTIONS = [
  { value: "water" as NotificationScheduleType, label: "Su Hatırlatması", emoji: "💧", defaultTitle: "Su içmeyi unutma!", defaultMsg: "Bugün yeterince su içmedin. Sağlıklı kalmak için su iç! 💧" },
  { value: "steps" as NotificationScheduleType, label: "Adım Hatırlatması", emoji: "🏃", defaultTitle: "Hareket zamanı!", defaultMsg: "Bugün henüz adım kaydın yok. Kısa bir yürüyüş seni iyi hissettirir! 🚶" },
  { value: "exercise" as NotificationScheduleType, label: "Egzersiz Hatırlatması", emoji: "💪", defaultTitle: "Egzersiz zamanı!", defaultMsg: "Bugün egzersizini tamamlamadın. Ev programını yapmayı unutma! 💪" },
  { value: "custom" as NotificationScheduleType, label: "Özel Mesaj", emoji: "📢", defaultTitle: "", defaultMsg: "" },
];

const DAYS = [
  { value: 0, label: "Pzt" },
  { value: 1, label: "Sal" },
  { value: 2, label: "Çar" },
  { value: 3, label: "Per" },
  { value: 4, label: "Cum" },
  { value: 5, label: "Cmt" },
  { value: 6, label: "Paz" },
];

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/* ─── Custom saat seçici ──────────────────────────────────── */

function SpinUnit({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const idx = options.indexOf(value);
  const prev = () => onChange(options[(idx - 1 + options.length) % options.length]);
  const next = () => onChange(options[(idx + 1) % options.length]);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={prev}
        className="flex h-7 w-10 items-center justify-center rounded-t-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <div className="flex h-10 w-10 items-center justify-center bg-white text-lg font-bold tabular-nums text-slate-800 dark:bg-slate-800 dark:text-slate-100">
        {value}
      </div>
      <button
        type="button"
        onClick={next}
        className="flex h-7 w-10 items-center justify-center rounded-b-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

function TimePicker({
  value,
  onChange,
  onRemove,
  showRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove?: () => void;
  showRemove: boolean;
}) {
  const [h, m] = value.split(":");
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-600">
        <SpinUnit value={h} options={HOURS} onChange={(v) => onChange(`${v}:${m}`)} />
        <span className="px-1 text-xl font-bold text-slate-300 dark:text-slate-600">:</span>
        <SpinUnit value={m} options={MINUTES} onChange={(v) => onChange(`${h}:${v}`)} />
      </div>
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-950/20"
          aria-label="Saati kaldır"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─── Form tipi ───────────────────────────────────────────── */

type FormState = {
  notification_type: NotificationScheduleType;
  title: string;
  message: string;
  send_times: string[];
  days_of_week: number[];
  is_enabled: boolean;
};

const EMPTY_FORM: FormState = {
  notification_type: "water",
  title: "",
  message: "",
  send_times: ["10:00"],
  days_of_week: ALL_DAYS,
  is_enabled: true,
};

/* ─── Yardımcı ────────────────────────────────────────────── */

const dayLabels = (days: number[]) =>
  days.length === 7 ? "Her gün" : days.map((d) => DAYS[d]?.label).join(", ");

/* ─── Sayfa ───────────────────────────────────────────────── */

export default function BildirimZamanlamaPage() {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      setSchedules(await api.admin.notificationSchedules.list(token));
    } catch {
      showToast("Yüklenemedi.", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s: NotificationSchedule) => {
    setEditingId(s.id);
    setForm({
      notification_type: s.notification_type,
      title: s.title,
      message: s.message,
      send_times: s.send_times.length ? s.send_times : ["10:00"],
      days_of_week: s.days_of_week,
      is_enabled: s.is_enabled,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.admin.notificationSchedules.update(token, editingId, form);
      } else {
        await api.admin.notificationSchedules.create(token, form);
      }
      setShowModal(false);
      showToast(editingId ? "Güncellendi." : "Oluşturuldu.");
      load();
    } catch {
      showToast("Kaydedilemedi.", false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s: NotificationSchedule) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.notificationSchedules.update(token, s.id, { is_enabled: !s.is_enabled });
      setSchedules((prev) => prev.map((x) => x.id === s.id ? { ...x, is_enabled: !s.is_enabled } : x));
    } catch {
      showToast("Güncellenemedi.", false);
    }
  };

  const handleDelete = async (id: number) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.notificationSchedules.delete(token, id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showToast("Silindi.");
    } catch {
      showToast("Silinemedi.", false);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleTest = async (id: number) => {
    const token = getAccessToken();
    if (!token) return;
    setTestingId(id);
    try {
      const res = await api.admin.notificationSchedules.test(token, id);
      showToast(res.detail || "Test bildirimi gönderildi.");
    } catch {
      showToast("Gönderilemedi.", false);
    } finally {
      setTestingId(null);
    }
  };

  const handleTypeChange = (type: NotificationScheduleType) => {
    const opt = TYPE_OPTIONS.find((o) => o.value === type);
    setForm((f) => ({
      ...f,
      notification_type: type,
      title: f.title || opt?.defaultTitle || "",
      message: f.message || opt?.defaultMsg || "",
    }));
  };

  const addTime = () => setForm((f) => ({ ...f, send_times: [...f.send_times, "12:00"] }));
  const updateTime = (i: number, v: string) =>
    setForm((f) => ({ ...f, send_times: f.send_times.map((t, idx) => idx === i ? v : t) }));
  const removeTime = (i: number) =>
    setForm((f) => ({ ...f, send_times: f.send_times.filter((_, idx) => idx !== i) }));
  const toggleDay = (day: number) =>
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day].sort(),
    }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Bildirim Zamanlama</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Motivasyon bildirimlerini otomatik olarak zamanlayın.
          </p>
        </div>
        <button type="button" onClick={openAdd} className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">
          + Yeni Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : schedules.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-4xl">🔔</p>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">Henüz zamanlama eklenmemiş.</p>
          <button type="button" onClick={openAdd} className="mt-4 rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600">
            İlk Zamanlamayı Ekle
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => {
            const opt = TYPE_OPTIONS.find((o) => o.value === s.notification_type);
            return (
              <GlassCard key={s.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-2xl">{opt?.emoji ?? "🔔"}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{s.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.is_enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                          {s.is_enabled ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{s.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          🕐 {s.send_times.join(" · ")}
                        </span>
                        <span>{dayLabels(s.days_of_week)}</span>
                        <span className="text-[10px] uppercase tracking-wide">{s.notification_type_label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(s)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.is_enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${s.is_enabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTest(s.id)}
                      disabled={testingId === s.id}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-700/40 dark:bg-blue-950/30 dark:text-blue-300"
                    >
                      {testingId === s.id ? "…" : "Test"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(s.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-400"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Silme onay modalı */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Zamanlamayı Sil</p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingId ? "Zamanlamayı Düzenle" : "Yeni Zamanlama"}
            </h2>

            <form onSubmit={handleSave} className="mt-5 space-y-5">
              {/* Tip */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Bildirim Tipi</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleTypeChange(opt.value)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        form.notification_type === opt.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <span className="mr-1">{opt.emoji}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Başlık */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Başlık</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>

              {/* Mesaj */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Mesaj</label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>

              {/* Saatler */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Gönderim Saatleri
                  </label>
                  <button
                    type="button"
                    onClick={addTime}
                    disabled={form.send_times.length >= 8}
                    className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40 dark:border-blue-700/40 dark:bg-blue-950/30 dark:text-blue-300"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Saat Ekle
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.send_times.map((t, i) => (
                    <TimePicker
                      key={i}
                      value={t}
                      onChange={(v) => updateTime(i, v)}
                      onRemove={() => removeTime(i)}
                      showRemove={form.send_times.length > 1}
                    />
                  ))}
                </div>
              </div>

              {/* Günler */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Günler</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, days_of_week: f.days_of_week.length === 7 ? [] : ALL_DAYS }))}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {form.days_of_week.length === 7 ? "Hiçbiri" : "Tümü"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        form.days_of_week.includes(d.value)
                          ? "bg-blue-500 text-white"
                          : "border border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving || form.days_of_week.length === 0 || form.send_times.length === 0}
                  className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
