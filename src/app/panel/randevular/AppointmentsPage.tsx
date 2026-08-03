"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { Pagination } from "@/components/ui/Pagination";
import { AdminCreateAppointmentForm } from "@/components/admin/AdminCreateAppointmentForm";
import { getAccessToken } from "@/lib/auth";
import { api, type Appointment } from "@/lib/api";

const PAGE_SIZE = 50;
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 – 20:00
const SLOT_H = 56; // px per hour

const STATUS_LABELS: Record<Appointment["status"], string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  postponed: "Ertelendi",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelmedi",
};

const STATUS_BADGE: Record<Appointment["status"], string> = {
  pending: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  postponed: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  completed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  no_show: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
};

const STATUS_CAL: Record<Appointment["status"], string> = {
  pending: "bg-blue-400 text-white",
  approved: "bg-emerald-500 text-white",
  postponed: "bg-amber-400 text-white",
  completed: "bg-slate-400 text-white",
  cancelled: "bg-red-400 text-white",
  no_show: "bg-orange-400 text-white",
};

const STATUS_OPTIONS: Appointment["status"][] = [
  "pending", "approved", "postponed", "completed", "cancelled", "no_show",
];

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS_TR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Appointment action helpers ─────────────────────────────
function useAppointmentActions(onUpdate: (a: Appointment) => void) {
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const changeStatus = async (id: number, status: Appointment["status"]) => {
    const token = getAccessToken();
    if (!token) return;
    setActionLoading(true);
    setError("");
    try {
      const updated = await api.admin.updateAppointmentStatus(token, id, { status });
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Durum güncellenemedi.");
    } finally {
      setActionLoading(false);
    }
  };

  return { actionLoading, error, setError, changeStatus };
}

// ─── Action buttons ──────────────────────────────────────────
function ActionButtons({
  appointment,
  loading,
  onStatus,
  onPostpone,
}: {
  appointment: Appointment;
  loading: boolean;
  onStatus: (status: Appointment["status"]) => void;
  onPostpone: () => void;
}) {
  const { status } = appointment;
  const active = status !== "completed" && status !== "cancelled" && status !== "no_show";
  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "pending" && (
        <button type="button" disabled={loading} onClick={() => onStatus("approved")}
          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
          Onayla
        </button>
      )}
      {active && (
        <>
          <button type="button" onClick={onPostpone}
            className="rounded-full border border-amber-500/50 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Ertele
          </button>
          <button type="button" disabled={loading} onClick={() => onStatus("completed")}
            className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600/60 dark:text-slate-200 disabled:opacity-50">
            Tamamla
          </button>
          <button type="button" disabled={loading} onClick={() => onStatus("no_show")}
            className="rounded-full border border-orange-500/50 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 disabled:opacity-50">
            Gelmedi
          </button>
          <button type="button" disabled={loading} onClick={() => onStatus("cancelled")}
            className="rounded-full border border-red-500/50 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 disabled:opacity-50">
            İptal Et
          </button>
        </>
      )}
    </div>
  );
}

// ─── Postpone form ───────────────────────────────────────────
function PostponeForm({
  appointment,
  onDone,
  onCancel,
  onUpdate,
}: {
  appointment: Appointment;
  onDone: () => void;
  onCancel: () => void;
  onUpdate: (a: Appointment) => void;
}) {
  const [form, setForm] = useState({ appointment_datetime: "", note: appointment.note ?? "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    try {
      const updated = await api.appointments.postpone(token, appointment.id, {
        ...form,
        appointment_datetime: new Date(form.appointment_datetime).toISOString(),
      });
      onUpdate(updated);
      onDone();
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Ertelenemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-slate-200/80 pt-4 dark:border-slate-600/50">
      {err && <p className="text-xs text-red-500">{err}</p>}
      <FormField label="Yeni Tarih ve Saat" name="dt" type="datetime-local" required
        value={form.appointment_datetime} onChange={(e) => setForm((f) => ({ ...f, appointment_datetime: e.target.value }))} />
      <FormField label="Erteleme Notu" name="note" type="text" required
        value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy}
          className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
          {busy ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full border border-slate-300/60 px-5 py-2 text-sm text-slate-700 dark:border-slate-600/60 dark:text-slate-200">
          İptal
        </button>
      </div>
    </form>
  );
}

// ─── List view ───────────────────────────────────────────────
function ListView({
  appointments,
  total,
  page,
  totalPages,
  onPageChange,
  onUpdate,
}: {
  appointments: Appointment[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onUpdate: (a: Appointment) => void;
}) {
  const [postponingId, setPostponingId] = useState<number | null>(null);
  const { actionLoading, changeStatus } = useAppointmentActions(onUpdate);

  return (
    <div className="space-y-3">
      {appointments.map((appt) => (
        <GlassCard key={appt.id} className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {appt.patient_id ? (
                  <Link href={`/panel/ogrenciler/${appt.patient_id}`}
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    {appt.patient_name ?? "Öğrenci"}
                  </Link>
                ) : (
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{appt.patient_name ?? "Öğrenci"}</p>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[appt.status]}`}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{appt.doctor_name}</p>
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                🕐 {formatDateTime(appt.appointment_datetime)}
              </p>
              {appt.note && (
                <p className="mt-1 text-xs text-slate-400">Not: {appt.note}</p>
              )}
            </div>
            <ActionButtons
              appointment={appt}
              loading={actionLoading}
              onStatus={(s) => changeStatus(appt.id, s)}
              onPostpone={() => setPostponingId(appt.id)}
            />
          </div>
          {postponingId === appt.id && (
            <PostponeForm
              appointment={appt}
              onDone={() => setPostponingId(null)}
              onCancel={() => setPostponingId(null)}
              onUpdate={onUpdate}
            />
          )}
        </GlassCard>
      ))}
      {totalPages > 1 && (
        <GlassCard className="p-3">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <span className="text-xs text-slate-500">{total} randevu · Sayfa {page}/{totalPages}</span>
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ─── Calendar view ───────────────────────────────────────────
function CalendarView({
  weekStart,
  appointments,
  onUpdate,
}: {
  weekStart: Date;
  appointments: Appointment[];
  onUpdate: (a: Appointment) => void;
}) {
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [postponingId, setPostponingId] = useState<number | null>(null);
  const { actionLoading, changeStatus } = useAppointmentActions((a) => { onUpdate(a); setSelected(a); });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 08:00 on mount
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group by day
  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of appointments) {
      const key = isoDate(new Date(a.appointment_datetime));
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [appointments]);

  const todayStr = isoDate(new Date());

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-900">
      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200/80 dark:border-slate-700/60">
        <div className="border-r border-slate-200/80 dark:border-slate-700/60" />
        {days.map((d, i) => {
          const ds = isoDate(d);
          const isToday = ds === todayStr;
          return (
            <div key={i} className={`flex flex-col items-center py-3 border-r last:border-r-0 border-slate-200/80 dark:border-slate-700/60 ${isToday ? "bg-blue-50/60 dark:bg-blue-950/20" : ""}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{DAYS_TR[i]}</p>
              <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-blue-500 text-white" : "text-slate-700 dark:text-slate-200"}`}>
                {d.getDate()}
              </div>
              {(byDay[ds]?.length ?? 0) > 0 && (
                <div className="mt-1 flex gap-0.5">
                  {(byDay[ds] ?? []).slice(0, 4).map((a) => (
                    <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${STATUS_CAL[a.status].split(" ")[0]}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 560 }}>
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          {/* Hour labels */}
          <div>
            {HOURS.map((h) => (
              <div key={h} style={{ height: SLOT_H }} className="relative border-b border-slate-100/80 dark:border-slate-800/60 pr-2 text-right">
                <span className="absolute top-1 right-2 text-[10px] text-slate-400">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, di) => {
            const ds = isoDate(d);
            const isToday = ds === todayStr;
            const dayAppts = byDay[ds] ?? [];

            return (
              <div key={di} className={`relative border-r last:border-r-0 border-slate-200/80 dark:border-slate-700/60 ${isToday ? "bg-blue-50/30 dark:bg-blue-950/10" : ""}`}>
                {HOURS.map((h) => (
                  <div key={h} style={{ height: SLOT_H }}
                    className="border-b border-slate-100/80 dark:border-slate-800/60" />
                ))}

                {/* Appointments */}
                {dayAppts.map((appt) => {
                  const dt = new Date(appt.appointment_datetime);
                  const hour = dt.getHours();
                  const min = dt.getMinutes();
                  const top = (hour - 8) * SLOT_H + (min / 60) * SLOT_H;
                  const dur = appt.duration_minutes ?? 45;
                  const height = Math.max((dur / 60) * SLOT_H, 28);
                  if (hour < 8 || hour > 20) return null;

                  return (
                    <button
                      key={appt.id}
                      type="button"
                      onClick={() => { setSelected(appt); setPostponingId(null); }}
                      style={{ top, height, left: 2, right: 2 }}
                      className={`absolute rounded-lg px-1.5 py-1 text-left text-[10px] font-semibold leading-tight shadow-sm overflow-hidden transition-opacity hover:opacity-90 ${STATUS_CAL[appt.status]}`}
                    >
                      <p className="truncate">{appt.patient_name ?? "Öğrenci"}</p>
                      {height > 36 && (
                        <p className="truncate opacity-80">
                          {dt.getHours().toString().padStart(2,"0")}:{dt.getMinutes().toString().padStart(2,"0")}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected appointment detail */}
      {selected && (
        <div className="border-t border-slate-200/80 dark:border-slate-700/60 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {selected.patient_id ? (
                  <Link href={`/panel/ogrenciler/${selected.patient_id}`}
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    {selected.patient_name ?? "Öğrenci"}
                  </Link>
                ) : (
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{selected.patient_name}</p>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[selected.status]}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{selected.doctor_name}</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                🕐 {formatDateTime(selected.appointment_datetime)}
                {selected.duration_minutes && ` · ${selected.duration_minutes} dk`}
              </p>
              {selected.note && <p className="text-xs text-slate-400 mt-0.5">Not: {selected.note}</p>}
            </div>
            <button type="button" onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>
          <ActionButtons
            appointment={selected}
            loading={actionLoading}
            onStatus={(s) => changeStatus(selected.id, s)}
            onPostpone={() => setPostponingId(selected.id)}
          />
          {postponingId === selected.id && (
            <PostponeForm
              appointment={selected}
              onDone={() => setPostponingId(null)}
              onCancel={() => setPostponingId(null)}
              onUpdate={(a) => { onUpdate(a); setSelected(a); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────
export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";

  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const weekEnd = addDays(weekStart, 6);

  const load = (p = 1) => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    const opts: Parameters<typeof api.admin.appointments>[1] = {
      status: statusFilter || undefined,
      page: p,
      pageSize: PAGE_SIZE,
    };
    if (view === "calendar") {
      opts.dateFrom = isoDate(weekStart);
      opts.dateTo = isoDate(weekEnd);
    }
    api.admin.appointments(token, opts)
      .then((d) => { setAppointments(d.results); setTotal(d.count); })
      .catch(() => setError("Randevular yüklenemedi."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); load(1); }, [statusFilter, view, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (view === "list" && page > 1) load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateAppointment = (updated: Appointment) => {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleFormMessage = (message: string, type: "success" | "error") => {
    type === "error" ? setError(message) : setSuccess(message);
  };

  const weekLabel = (() => {
    const sm = MONTHS_TR[weekStart.getMonth()];
    const em = MONTHS_TR[weekEnd.getMonth()];
    if (sm === em) return `${weekStart.getDate()}–${weekEnd.getDate()} ${sm} ${weekStart.getFullYear()}`;
    return `${weekStart.getDate()} ${sm} – ${weekEnd.getDate()} ${em} ${weekStart.getFullYear()}`;
  })();

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Randevular</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Randevuları onaylayın, erteleyin veya tamamlayın.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/60 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/60">
            <button type="button" onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${view === "calendar" ? "bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Takvim
            </button>
            <button type="button" onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${view === "list" ? "bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Liste
            </button>
          </div>
          <button type="button" onClick={() => setShowCreate((s) => !s)}
            className="shrink-0 rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600">
            {showCreate ? "Kapat" : "+ Yeni Randevu"}
          </button>
        </div>
      </div>

      {showCreate && (
        <AdminCreateAppointmentForm onCreated={() => load(1)} onClose={() => setShowCreate(false)} onMessage={handleFormMessage} />
      )}

      {success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{success}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {/* Controls row: week nav (calendar) + status filters */}
      <div className="flex flex-wrap items-center gap-3">
        {view === "calendar" && (
          <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-2 py-1.5 dark:border-slate-700/60 dark:bg-slate-900">
            <button type="button" onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="rounded-lg px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30">
              Bu Hafta
            </button>
            <span className="px-1 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[180px] text-center">
              {weekLabel}
            </span>
            <button type="button" onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          <Link href="/panel/randevular" scroll={false}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${!statusFilter ? "bg-blue-500 text-white" : "border border-slate-300/60 text-slate-600 dark:border-slate-600/60 dark:text-slate-300"}`}>
            Tümü
          </Link>
          {STATUS_OPTIONS.map((s) => (
            <Link key={s} href={`/panel/randevular?status=${s}`} scroll={false}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${statusFilter === s ? "bg-blue-500 text-white" : "border border-slate-300/60 text-slate-600 dark:border-slate-600/60 dark:text-slate-300"}`}>
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        {view === "calendar" && (
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_CAL[k as Appointment["status"]].split(" ")[0]}`} />
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : view === "calendar" ? (
        <CalendarView weekStart={weekStart} appointments={appointments} onUpdate={updateAppointment} />
      ) : appointments.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">Bu filtrede randevu bulunmuyor.</p>
        </GlassCard>
      ) : (
        <ListView
          appointments={appointments}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          onUpdate={updateAppointment}
        />
      )}
    </div>
  );
}
