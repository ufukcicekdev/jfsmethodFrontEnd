"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { FormField, FormGroup, FormInput } from "@/components/ui/FormField";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getAccessToken } from "@/lib/auth";
import {
  api,
  type ClinicHoliday,
  type ClinicSchedule,
  type DayCancellationPreview,
  type SlotBlock,
  type WorkingDaySchedule,
} from "@/lib/api";

const SLOT_DURATIONS = [15, 30, 45, 60];

const TABS = [
  { id: "schedule", label: "Çalışma Saatleri" },
  { id: "blocks", label: "Slot Kapatma" },
  { id: "holidays", label: "Tatil Günleri" },
  { id: "cancel", label: "Gün İptali" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function toTimeInput(value: string) {
  return value.slice(0, 5);
}

function toApiTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function formatDate(value: string) {
  return new Date(value + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function SchedulePage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<TabId>("schedule");

  // --- schedule state ---
  const [schedule, setSchedule] = useState<ClinicSchedule | null>(null);
  const [workingDays, setWorkingDays] = useState<WorkingDaySchedule[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [slotCapacity, setSlotCapacity] = useState(1);
  const [slotBreak, setSlotBreak] = useState(0);
  const [freeCancelHours, setFreeCancelHours] = useState(6);
  const [lateCancelMinutes, setLateCancelMinutes] = useState(30);
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder1h, setReminder1h] = useState(true);
  const [reminderCustomMinutes, setReminderCustomMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- slot blocks state ---
  const [blocks, setBlocks] = useState<SlotBlock[]>([]);
  const [blockForm, setBlockForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    reason: "",
  });
  const [pendingBlocks, setPendingBlocks] = useState<typeof blockForm[]>([]);
  const [blockLoading, setBlockLoading] = useState(false);

  // --- holidays state ---
  const [holidays, setHolidays] = useState<ClinicHoliday[]>([]);
  const [holidayForm, setHolidayForm] = useState({ date: "", name: "" });
  const [holidayLoading, setHolidayLoading] = useState(false);

  // --- cancel day state ---
  const [cancelDate, setCancelDate] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [addHolidayOnCancel, setAddHolidayOnCancel] = useState(true);
  const [cancelPreview, setCancelPreview] =
    useState<DayCancellationPreview | null>(null);
  const [cancelPreviewLoading, setCancelPreviewLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // --- feedback ---
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const loadAll = () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    Promise.all([
      api.admin.getSchedule(token),
      api.admin.getSlotBlocks(token),
    ])
      .then(([sched, slotBlocks]) => {
        setSchedule(sched);
        setWorkingDays(sched.working_days);
        setSlotDuration(sched.slot_duration_minutes);
        setSlotCapacity(sched.slot_capacity ?? 1);
        setSlotBreak(sched.slot_break_minutes ?? 0);
        setFreeCancelHours(sched.free_cancel_hours ?? 6);
        setLateCancelMinutes(sched.late_cancel_penalty_minutes ?? 30);
        setReminder24h(sched.reminder_24h_enabled ?? true);
        setReminder1h(sched.reminder_1h_enabled ?? true);
        setReminderCustomMinutes(sched.reminder_custom_minutes ?? 0);
        setHolidays(sched.holidays);
        setBlocks(slotBlocks);
      })
      .catch(() => setError("Veriler yüklenemedi."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateDay = (dayOfWeek: number, patch: Partial<WorkingDaySchedule>) => {
    setWorkingDays((days) =>
      days.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, ...patch } : day
      )
    );
  };

  // ── Tab: Çalışma Saatleri ──────────────────────────────────────────────────

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    clearFeedback();
    setSaving(true);
    try {
      const updated = await api.admin.updateSchedule(token, {
        slot_duration_minutes: slotDuration,
        slot_capacity: slotCapacity,
        slot_break_minutes: slotBreak,
        free_cancel_hours: freeCancelHours,
        late_cancel_penalty_minutes: lateCancelMinutes,
        reminder_24h_enabled: reminder24h,
        reminder_1h_enabled: reminder1h,
        reminder_custom_minutes: reminderCustomMinutes,
        working_days: workingDays.map((day) => ({
          day_of_week: day.day_of_week,
          is_working: day.is_working,
          start_time: toApiTime(toTimeInput(day.start_time)),
          end_time: toApiTime(toTimeInput(day.end_time)),
        })),
      });
      setSchedule(updated);
      setWorkingDays(updated.working_days);
      setFreeCancelHours(updated.free_cancel_hours ?? 6);
      setLateCancelMinutes(updated.late_cancel_penalty_minutes ?? 30);
      setReminder24h(updated.reminder_24h_enabled ?? true);
      setReminder1h(updated.reminder_1h_enabled ?? true);
      setReminderCustomMinutes(updated.reminder_custom_minutes ?? 0);
      setSuccess("Çalışma programı kaydedildi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  // ── Tab: Slot Kapatma ─────────────────────────────────────────────────────

  const handleAddToPending = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.date || !blockForm.start_time || !blockForm.end_time) return;
    setPendingBlocks((prev) => [...prev, { ...blockForm }]);
    setBlockForm((f) => ({ date: f.date, start_time: "", end_time: "", reason: "" }));
  };

  const handleRemovePending = (index: number) => {
    setPendingBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveBlocks = async () => {
    const token = getAccessToken();
    if (!token || pendingBlocks.length === 0) return;

    clearFeedback();
    setBlockLoading(true);
    try {
      const saved = await Promise.all(
        pendingBlocks.map((b) =>
          api.admin.addSlotBlock(token, {
            ...b,
            start_time: toApiTime(b.start_time),
            end_time: toApiTime(b.end_time),
          })
        )
      );
      setBlocks((prev) =>
        [...prev, ...saved].sort((a, b) =>
          a.date === b.date
            ? a.start_time.localeCompare(b.start_time)
            : a.date.localeCompare(b.date)
        )
      );
      setPendingBlocks([]);
      setSuccess(`${saved.length} slot kapatıldı.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Slot kapatılamadı.");
    } finally {
      setBlockLoading(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    const ok = await confirm({
      title: "Slot engelini kaldır",
      message: "Bu engeli kaldırmak istediğinize emin misiniz?",
      confirmLabel: "Kaldır",
      variant: "danger",
    });
    if (!ok) return;

    const token = getAccessToken();
    if (!token) return;

    try {
      await api.admin.deleteSlotBlock(token, id);
      setBlocks((b) => b.filter((item) => item.id !== id));
      setSuccess("Slot engeli kaldırıldı.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaldırılamadı.");
    }
  };

  // ── Tab: Tatil Günleri ────────────────────────────────────────────────────

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !holidayForm.date) return;

    clearFeedback();
    setHolidayLoading(true);
    try {
      const holiday = await api.admin.addHoliday(token, holidayForm);
      setHolidays((items) =>
        [...items, holiday].sort((a, b) => a.date.localeCompare(b.date))
      );
      setHolidayForm({ date: "", name: "" });
      setSuccess("Tatil günü eklendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tatil günü eklenemedi.");
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    const ok = await confirm({
      title: "Tatil gününü sil",
      message: "Bu tatil gününü silmek istediğinize emin misiniz?",
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;

    const token = getAccessToken();
    if (!token) return;

    try {
      await api.admin.deleteHoliday(token, id);
      setHolidays((items) => items.filter((item) => item.id !== id));
      setSuccess("Tatil günü silindi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silinemedi.");
    }
  };

  // ── Tab: Gün İptali ───────────────────────────────────────────────────────

  const handlePreviewCancelDay = async () => {
    const token = getAccessToken();
    if (!token || !cancelDate) return;

    clearFeedback();
    setCancelPreviewLoading(true);
    setCancelPreview(null);
    try {
      const preview = await api.admin.previewCancelDay(token, cancelDate);
      setCancelPreview(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Önizleme alınamadı.");
    } finally {
      setCancelPreviewLoading(false);
    }
  };

  const handleCancelDay = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !cancelDate || cancelReason.trim().length < 5) return;

    const msg =
      cancelPreview && cancelPreview.appointment_count > 0
        ? `${formatDate(cancelDate)} tarihindeki ${cancelPreview.appointment_count} randevu iptal edilecek ve ${cancelPreview.patient_count} öğrenciye bildirim gönderilecek. Devam etmek istiyor musunuz?`
        : "Bu günü iptal etmek istediğinize emin misiniz?";

    const ok = await confirm({
      title: "Günü iptal et",
      message: msg,
      confirmLabel: "Günü iptal et",
      variant: "danger",
    });
    if (!ok) return;

    clearFeedback();
    setCancelLoading(true);
    try {
      const result = await api.admin.cancelDay(token, {
        date: cancelDate,
        reason: cancelReason.trim(),
        add_holiday: addHolidayOnCancel,
      });
      setSuccess(result.detail);
      setCancelDate("");
      setCancelReason("");
      setCancelPreview(null);
      if (addHolidayOnCancel) loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gün iptali başarısız.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Randevu Yönetimi
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Çalışma saatleri, kontenjan, slot kapatma ve tatil ayarları.
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

      {/* Tab bar */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-max gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                clearFeedback();
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "border border-slate-300/60 text-slate-700 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-200 dark:hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Çalışma Saatleri ── */}
      {activeTab === "schedule" && (
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Çalışma Saatleri & Kontenjan
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hangi günler, kaçta kaça kadar çalıştığınızı ve aynı saatte kaç
            kişinin randevu alabileceğini belirleyin.
          </p>

          <form onSubmit={handleSaveSchedule} className="mt-5 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormGroup label="Randevu Slot Süresi" required>
                <CustomSelect
                  value={slotDuration}
                  onChange={setSlotDuration}
                  className="w-full"
                  options={SLOT_DURATIONS.map((d) => ({
                    value: d,
                    label: `${d} dakika`,
                  }))}
                  aria-label="Randevu slot süresi"
                />
              </FormGroup>

              <div>
                <FormGroup
                  label="Aynı Saatte Maksimum Kişi (Kontenjan)"
                  required
                >
                  <FormInput
                    type="number"
                    min={1}
                    max={100}
                    value={slotCapacity}
                    onChange={(e) =>
                      setSlotCapacity(
                        Math.max(1, Number(e.target.value) || 1)
                      )
                    }
                    className="w-full"
                    aria-label="Aynı saatte maksimum kişi"
                  />
                </FormGroup>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Örn. 3 girerseniz aynı saate 3 farklı öğrenci randevu
                  alabilir.
                </p>
              </div>
            </div>

            {/* Slot arası boşluk + İptal politikası */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <FormGroup label="Slotlar Arası Dinlenme (dk)">
                  <FormInput
                    type="number"
                    min={0}
                    max={120}
                    value={slotBreak}
                    onChange={(e) =>
                      setSlotBreak(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full"
                  />
                </FormGroup>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Her randevu slotundan sonra kaç dakika boşluk bırakılsın. 0 = boşluk yok.
                </p>
              </div>

              <div>
                <FormGroup label="Cezasız İptal Süresi (saat)">
                  <FormInput
                    type="number"
                    min={0}
                    max={72}
                    value={freeCancelHours}
                    onChange={(e) =>
                      setFreeCancelHours(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full"
                  />
                </FormGroup>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Randevudan bu kadar saatten önce yapılan iptal cezasız.
                </p>
              </div>

              <div>
                <FormGroup label="Geç İptal Ceza Eşiği (dk)">
                  <FormInput
                    type="number"
                    min={0}
                    max={1440}
                    value={lateCancelMinutes}
                    onChange={(e) =>
                      setLateCancelMinutes(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full"
                  />
                </FormGroup>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Bu dakikadan az süre kalmışken iptal edilirse seans hakkı yanar.
                </p>
              </div>

              {/* Hatırlatma bildirimleri */}
              <div className="col-span-full border-t border-slate-200/80 pt-4 dark:border-slate-600/50">
                <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Öğrenci Hatırlatma Bildirimleri
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={reminder24h}
                      onChange={(e) => setReminder24h(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                    />
                    24 saat öncesi hatırlatma gönder
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={reminder1h}
                      onChange={(e) => setReminder1h(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                    />
                    1 saat öncesi hatırlatma gönder
                  </label>
                  <div className="flex items-center gap-3">
                    <FormGroup label="Ekstra hatırlatma (dakika önce)">
                      <FormInput
                        type="number"
                        min={0}
                        max={10080}
                        placeholder="0 = kapalı"
                        value={reminderCustomMinutes || ""}
                        onChange={(e) =>
                          setReminderCustomMinutes(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-full"
                      />
                    </FormGroup>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ekstra hatırlatma: örn. 30 dakika önce ayrıca bildirim göndermek için 30 girin. 0 = kapalı.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile: card layout */}
            <div className="space-y-3 md:hidden">
              {workingDays.map((day) => (
                <div
                  key={day.day_of_week}
                  className="rounded-xl border border-slate-200/80 bg-white/50 p-4 dark:border-slate-600/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {day.day_label}
                    </p>
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={day.is_working}
                        onChange={(e) =>
                          updateDay(day.day_of_week, {
                            is_working: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                      />
                      Çalışıyor
                    </label>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Başlangıç
                      </p>
                      <FormInput
                        type="time"
                        value={toTimeInput(day.start_time)}
                        disabled={!day.is_working}
                        onChange={(e) =>
                          updateDay(day.day_of_week, {
                            start_time: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Bitiş
                      </p>
                      <FormInput
                        type="time"
                        value={toTimeInput(day.end_time)}
                        disabled={!day.is_working}
                        onChange={(e) =>
                          updateDay(day.day_of_week, {
                            end_time: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-600/50 dark:text-slate-400">
                    <th className="pb-3 pr-4">Gün</th>
                    <th className="pb-3 pr-4">Çalışıyor</th>
                    <th className="pb-3 pr-4">Başlangıç</th>
                    <th className="pb-3">Bitiş</th>
                  </tr>
                </thead>
                <tbody>
                  {workingDays.map((day) => (
                    <tr
                      key={day.day_of_week}
                      className="border-b border-slate-100 dark:border-slate-700/50"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">
                        {day.day_label}
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="checkbox"
                          checked={day.is_working}
                          onChange={(e) =>
                            updateDay(day.day_of_week, {
                              is_working: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <FormInput
                          type="time"
                          value={toTimeInput(day.start_time)}
                          disabled={!day.is_working}
                          onChange={(e) =>
                            updateDay(day.day_of_week, {
                              start_time: e.target.value,
                            })
                          }
                          className="max-w-[140px]"
                        />
                      </td>
                      <td className="py-3">
                        <FormInput
                          type="time"
                          value={toTimeInput(day.end_time)}
                          disabled={!day.is_working}
                          onChange={(e) =>
                            updateDay(day.day_of_week, {
                              end_time: e.target.value,
                            })
                          }
                          className="max-w-[140px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Kaydediliyor…" : "Programı Kaydet"}
            </button>
          </form>
        </GlassCard>
      )}

      {/* ── Tab: Slot Kapatma ── */}
      {activeTab === "blocks" && (
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Slot Kapatma
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Belirli bir tarih ve saat aralığında randevu alınmasını engelleyin.
            Örneğin öğle arası, toplantı veya kısa izinler için kullanın.
          </p>

          <form onSubmit={handleAddToPending} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                label="Tarih"
                name="block_date"
                type="date"
                required
                min={today}
                value={blockForm.date}
                onChange={(e) =>
                  setBlockForm((f) => ({ ...f, date: e.target.value }))
                }
              />
              <FormField
                label="Başlangıç Saati"
                name="block_start"
                type="time"
                required
                value={blockForm.start_time}
                onChange={(e) =>
                  setBlockForm((f) => ({ ...f, start_time: e.target.value }))
                }
              />
              <FormField
                label="Bitiş Saati"
                name="block_end"
                type="time"
                required
                value={blockForm.end_time}
                onChange={(e) =>
                  setBlockForm((f) => ({ ...f, end_time: e.target.value }))
                }
              />
              <FormField
                label="Açıklama (opsiyonel)"
                name="block_reason"
                placeholder="Örn. Öğle arası"
                value={blockForm.reason}
                onChange={(e) =>
                  setBlockForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={!blockForm.date || !blockForm.start_time || !blockForm.end_time}
              className="w-full rounded-full border border-amber-400 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700/50 dark:bg-amber-950/20 dark:text-amber-300 sm:w-auto"
            >
              + Listeye Ekle
            </button>
          </form>

          {/* Bekleyen eklemeler */}
          {pendingBlocks.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-800/40 dark:bg-amber-950/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Kaydedilecekler ({pendingBlocks.length})
              </p>
              <ul className="space-y-2">
                {pendingBlocks.map((b, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-700 dark:text-slate-200">
                      <span className="font-medium">{b.date}</span>
                      {" · "}
                      {b.start_time} – {b.end_time}
                      {b.reason && (
                        <span className="ml-2 text-slate-500 dark:text-slate-400">· {b.reason}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePending(i)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400"
                    >
                      Kaldır
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleSaveBlocks}
                disabled={blockLoading}
                className="mt-2 w-full rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 sm:w-auto"
              >
                {blockLoading ? "Kaydediliyor…" : `Hepsini Kaydet (${pendingBlocks.length})`}
              </button>
            </div>
          )}

          {blocks.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              Kapatılmış slot bulunmuyor.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {blocks.map((block) => (
                <li
                  key={block.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(block.date)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {formatTime(block.start_time)} –{" "}
                      {formatTime(block.end_time)}
                      {block.reason && (
                        <span className="ml-2 text-slate-500 dark:text-slate-400">
                          · {block.reason}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      {/* ── Tab: Tatil Günleri ── */}
      {activeTab === "holidays" && (
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Tatil Günleri
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tatil günlerinde öğrenciler randevu alamaz. Resmi tatiller, yıllık
            izinler vb. için kullanın.
          </p>

          <form
            onSubmit={handleAddHoliday}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="w-full sm:min-w-[160px] sm:flex-1">
              <FormField
                label="Tarih"
                name="holiday_date"
                type="date"
                required
                min={today}
                value={holidayForm.date}
                onChange={(e) =>
                  setHolidayForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="w-full sm:min-w-[200px] sm:flex-[2]">
              <FormField
                label="Açıklama"
                name="holiday_name"
                placeholder="Örn. Resmi tatil, yıllık izin"
                value={holidayForm.name}
                onChange={(e) =>
                  setHolidayForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={holidayLoading || !holidayForm.date}
              className="w-full rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 sm:w-auto"
            >
              {holidayLoading ? "Ekleniyor…" : "Tatil Ekle"}
            </button>
          </form>

          {holidays.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              Tanımlı tatil günü yok.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {holidays.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/50 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-800/40"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(holiday.date)}
                    </p>
                    {holiday.name && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {holiday.name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Sil
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      {/* ── Tab: Gün İptali ── */}
      {activeTab === "cancel" && (
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Gün İptali
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Seçilen tarihteki tüm bekleyen ve onaylı randevuları iptal eder.
            Etkilenen öğrencilere e-posta gönderilir.
          </p>

          <form onSubmit={handleCancelDay} className="mt-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="w-full sm:min-w-[160px] sm:flex-1">
                <FormField
                  label="İptal Edilecek Tarih"
                  name="cancel_date"
                  type="date"
                  required
                  min={today}
                  value={cancelDate}
                  onChange={(e) => {
                    setCancelDate(e.target.value);
                    setCancelPreview(null);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handlePreviewCancelDay}
                disabled={cancelPreviewLoading || !cancelDate}
                className="w-full rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {cancelPreviewLoading
                  ? "Kontrol ediliyor…"
                  : "Etkilenenleri Gör"}
              </button>
            </div>

            {cancelPreview && (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
                {cancelPreview.appointment_count === 0 ? (
                  <p>Bu tarihte iptal edilecek aktif randevu yok.</p>
                ) : (
                  <>
                    <p className="font-medium">
                      {cancelPreview.appointment_count} randevu,{" "}
                      {cancelPreview.patient_count} öğrenci etkilenecek:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {cancelPreview.patients.map((p) => (
                        <li key={p.patient_id}>
                          {p.patient_name} — {p.appointment_count} randevu
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <FormGroup label="Mazeret / Açıklama" required>
              <textarea
                required
                minLength={5}
                rows={4}
                placeholder="Örn. Acil sağlık sorunu nedeniyle o gün klinik kapalı olacaktır."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm shadow-slate-200/50 placeholder:text-slate-400 transition-all outline-none hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:border-blue-400 dark:focus:bg-slate-800"
              />
            </FormGroup>

            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={addHolidayOnCancel}
                onChange={(e) => setAddHolidayOnCancel(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
              />
              <span>
                Bu günü tatil günü olarak da işaretle (yeni randevu
                alınamasın)
              </span>
            </label>

            <button
              type="submit"
              disabled={
                cancelLoading ||
                !cancelDate ||
                cancelReason.trim().length < 5 ||
                (cancelPreview !== null &&
                  cancelPreview.appointment_count === 0)
              }
              className="w-full rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 sm:w-auto"
            >
              {cancelLoading
                ? "İptal ediliyor…"
                : "Günü İptal Et ve Bilgilendir"}
            </button>
          </form>
        </GlassCard>
      )}

      {schedule && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Mevcut ayar: {slotDuration} dk slotlar · Kontenjan: her saatte{" "}
          {slotCapacity} kişi
        </p>
      )}
    </div>
  );
}
