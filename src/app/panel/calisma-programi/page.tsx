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
  type WorkingDaySchedule,
} from "@/lib/api";

const SLOT_DURATIONS = [15, 30, 45, 60];

function toTimeInput(value: string) {
  return value.slice(0, 5);
}

function toApiTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function formatHolidayDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export default function SchedulePage() {
  const confirm = useConfirm();
  const [schedule, setSchedule] = useState<ClinicSchedule | null>(null);
  const [workingDays, setWorkingDays] = useState<WorkingDaySchedule[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [slotCapacity, setSlotCapacity] = useState(1);
  const [holidays, setHolidays] = useState<ClinicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [holidayForm, setHolidayForm] = useState({ date: "", name: "" });
  const [cancelDate, setCancelDate] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [addHolidayOnCancel, setAddHolidayOnCancel] = useState(true);
  const [cancelPreview, setCancelPreview] = useState<DayCancellationPreview | null>(
    null
  );
  const [cancelPreviewLoading, setCancelPreviewLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadSchedule = () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    api.admin
      .getSchedule(token)
      .then((data) => {
        setSchedule(data);
        setWorkingDays(data.working_days);
        setSlotDuration(data.slot_duration_minutes);
        setSlotCapacity(data.slot_capacity ?? 1);
        setHolidays(data.holidays);
      })
      .catch(() => setError("Çalışma programı yüklenemedi."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const updateDay = (
    dayOfWeek: number,
    patch: Partial<WorkingDaySchedule>
  ) => {
    setWorkingDays((days) =>
      days.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, ...patch } : day
      )
    );
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await api.admin.updateSchedule(token, {
        slot_duration_minutes: slotDuration,
        slot_capacity: slotCapacity,
        working_days: workingDays.map((day) => ({
          day_of_week: day.day_of_week,
          is_working: day.is_working,
          start_time: toApiTime(toTimeInput(day.start_time)),
          end_time: toApiTime(toTimeInput(day.end_time)),
        })),
      });
      setSchedule(updated);
      setWorkingDays(updated.working_days);
      setSlotDuration(updated.slot_duration_minutes);
      setSlotCapacity(updated.slot_capacity ?? 1);
      setHolidays(updated.holidays);
      setSuccess("Çalışma programı kaydedildi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !holidayForm.date) return;

    setHolidayLoading(true);
    setError("");
    setSuccess("");

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
      setError(err instanceof Error ? err.message : "Tatil günü silinemedi.");
    }
  };

  const handlePreviewCancelDay = async () => {
    const token = getAccessToken();
    if (!token || !cancelDate) return;

    setCancelPreviewLoading(true);
    setError("");
    setSuccess("");
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

    const cancelMessage =
      cancelPreview && cancelPreview.appointment_count > 0
        ? `${formatHolidayDate(cancelDate)} tarihindeki ${cancelPreview.appointment_count} randevu iptal edilecek ve ${cancelPreview.patient_count} öğrenciye bildirim gönderilecek. Devam etmek istiyor musunuz?`
        : "Bu günü iptal etmek istediğinize emin misiniz?";

    const ok = await confirm({
      title: "Günü iptal et",
      message: cancelMessage,
      confirmLabel: "Günü iptal et",
      variant: "danger",
    });
    if (!ok) return;

    setCancelLoading(true);
    setError("");
    setSuccess("");

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
      if (addHolidayOnCancel) {
        loadSchedule();
      }
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Çalışma Programı
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Çalışma günleri, saatleri ve tatilleri belirleyin. Randevu slotları buna
          göre oluşturulur.
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

      <GlassCard className="p-4 sm:p-6">
        <form onSubmit={handleSaveSchedule} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup label="Randevu Slot Süresi" required>
              <CustomSelect
                value={slotDuration}
                onChange={setSlotDuration}
                className="w-full"
                options={SLOT_DURATIONS.map((duration) => ({
                  value: duration,
                  label: `${duration} dakika`,
                }))}
                aria-label="Randevu slot süresi"
              />
            </FormGroup>

            <FormGroup label="Aynı Saatte Maksimum Kişi (Kontenjan)" required>
              <FormInput
                type="number"
                min={1}
                max={100}
                value={slotCapacity}
                onChange={(e) =>
                  setSlotCapacity(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full"
                aria-label="Aynı saatte maksimum kişi"
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Aynı doktor ve saatte kaç kişi randevu alabilir. 1 = tekil
                randevu (her saatte bir kişi).
              </p>
            </FormGroup>
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

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Tatil Günleri
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Tatil günlerinde randevu alınamaz.
        </p>

        <form
          onSubmit={handleAddHoliday}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="w-full sm:min-w-[160px] sm:flex-1">
            <FormField
              label="Tarih"
              name="holiday_date"
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
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
                    {formatHolidayDate(holiday.date)}
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

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Gün İptali
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Seçilen tarihteki tüm bekleyen ve onaylı randevuları iptal eder. Etkilenen
          öğrencilere mazaret açıklamasıyla birlikte e-posta gönderilir.
        </p>

        <form onSubmit={handleCancelDay} className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full sm:min-w-[160px] sm:flex-1">
              <FormField
                label="İptal Edilecek Tarih"
                name="cancel_date"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
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
              {cancelPreviewLoading ? "Kontrol ediliyor…" : "Etkilenenleri Gör"}
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

          <FormGroup label="Mazaret / Açıklama" required>
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
              Bu günü tatil günü olarak da işaretle (yeni randevu alınamasın)
            </span>
          </label>

          <button
            type="submit"
            disabled={
              cancelLoading ||
              !cancelDate ||
              cancelReason.trim().length < 5 ||
              (cancelPreview !== null && cancelPreview.appointment_count === 0)
            }
            className="w-full rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 sm:w-auto"
          >
            {cancelLoading ? "İptal ediliyor…" : "Günü İptal Et ve Bilgilendir"}
          </button>
        </form>
      </GlassCard>

      {schedule && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Örnek: Pazartesi–Cuma 09:00–18:00 arası {slotDuration} dakikalık slotlar
          oluşturulur. Cumartesi/Pazar kapalıysa o günlerde randevu gösterilmez.
        </p>
      )}
    </div>
  );
}
