"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { AdminCreateAppointmentForm } from "@/components/admin/AdminCreateAppointmentForm";
import { getAccessToken } from "@/lib/auth";
import { api, type Appointment } from "@/lib/api";

const STATUS_LABELS: Record<Appointment["status"], string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  postponed: "Ertelendi",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelmedi",
};

const STATUS_BADGE: Record<Appointment["status"], string> = {
  pending:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  approved:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  postponed:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  completed:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  no_show:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
};

const STATUS_OPTIONS: Appointment["status"][] = [
  "pending",
  "approved",
  "postponed",
  "completed",
  "cancelled",
  "no_show",
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postponingId, setPostponingId] = useState<number | null>(null);
  const [postponeForm, setPostponeForm] = useState({
    appointment_datetime: "",
    note: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState("");

  const loadAppointments = () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    api.admin
      .appointments(token, { status: statusFilter || undefined })
      .then(setAppointments)
      .catch(() => setError("Randevular yüklenemedi."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleFormMessage = (message: string, type: "success" | "error") => {
    if (type === "error") {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
  };

  const handleStatusChange = async (
    id: number,
    status: Appointment["status"]
  ) => {
    const token = getAccessToken();
    if (!token) return;

    setActionLoading(true);
    setError("");

    try {
      const updated = await api.admin.updateAppointmentStatus(token, id, {
        status,
      });
      setAppointments((items) =>
        items.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Durum güncellenemedi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostpone = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || postponingId === null) return;

    setActionLoading(true);
    setError("");

    try {
      const updated = await api.appointments.postpone(token, postponingId, {
        ...postponeForm,
        appointment_datetime: new Date(
          postponeForm.appointment_datetime
        ).toISOString(),
      });
      setAppointments((items) =>
        items.map((item) => (item.id === updated.id ? updated : item))
      );
      setPostponingId(null);
      setPostponeForm({ appointment_datetime: "", note: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevu ertelenemedi.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
            Randevular
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Randevuları onaylayın, erteleyin veya tamamlayın.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="shrink-0 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
        >
          {showCreate ? "Formu Kapat" : "+ Yeni Randevu"}
        </button>
      </div>

      {showCreate && (
        <AdminCreateAppointmentForm
          onCreated={loadAppointments}
          onClose={() => setShowCreate(false)}
          onMessage={handleFormMessage}
        />
      )}

      {success && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {success}
        </p>
      )}

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-max min-w-full gap-2 sm:flex-wrap sm:w-auto">
        <Link
          href="/panel/randevular"
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
            !statusFilter
              ? "bg-blue-500 text-white"
              : "border border-slate-300/60 text-slate-700 dark:border-slate-600/60 dark:text-slate-200"
          }`}
        >
          Tümü
        </Link>
        {STATUS_OPTIONS.map((status) => (
          <Link
            key={status}
            href={`/panel/randevular?status=${status}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              statusFilter === status
                ? "bg-blue-500 text-white"
                : "border border-slate-300/60 text-slate-700 dark:border-slate-600/60 dark:text-slate-200"
            }`}
          >
            {STATUS_LABELS[status]}
          </Link>
        ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : appointments.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Bu filtrede randevu bulunmuyor.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <GlassCard key={appointment.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  {appointment.patient_id ? (
                    <Link
                      href={`/panel/ogrenciler/${appointment.patient_id}`}
                      className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {appointment.patient_name ?? "Öğrenci"}
                    </Link>
                  ) : (
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {appointment.patient_name ?? "Öğrenci"}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Dr. {appointment.doctor_name}
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    {formatDateTime(appointment.appointment_datetime)}
                  </p>
                  {appointment.note && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Not: {appointment.note}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-3 sm:items-end sm:border-0 sm:pt-0 dark:border-slate-600/50">
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_BADGE[appointment.status]
                    }`}
                  >
                    {STATUS_LABELS[appointment.status]}
                  </span>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {appointment.status === "pending" && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          handleStatusChange(appointment.id, "approved")
                        }
                        className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        Onayla
                      </button>
                    )}
                    {appointment.status !== "completed" &&
                      appointment.status !== "cancelled" &&
                      appointment.status !== "no_show" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setPostponingId(appointment.id);
                            setPostponeForm({
                              appointment_datetime: "",
                              note: appointment.note ?? "",
                            });
                          }}
                          className="rounded-full border border-amber-500/50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400"
                        >
                          Ertele
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleStatusChange(appointment.id, "completed")
                          }
                          className="rounded-full border border-slate-300/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600/60 dark:text-slate-200 disabled:opacity-50"
                        >
                          Tamamla
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleStatusChange(appointment.id, "no_show")
                          }
                          className="rounded-full border border-orange-500/50 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 disabled:opacity-50"
                        >
                          Gelmedi
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleStatusChange(appointment.id, "cancelled")
                          }
                          className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 disabled:opacity-50"
                        >
                          İptal Et
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {postponingId === appointment.id && (
                <form
                  onSubmit={handlePostpone}
                  className="mt-4 space-y-4 border-t border-slate-200/80 pt-4 dark:border-slate-600/50"
                >
                  <FormField
                    label="Yeni Tarih ve Saat"
                    name="appointment_datetime"
                    type="datetime-local"
                    required
                    value={postponeForm.appointment_datetime}
                    onChange={(e) =>
                      setPostponeForm((f) => ({
                        ...f,
                        appointment_datetime: e.target.value,
                      }))
                    }
                  />
                  <FormField
                    label="Erteleme Notu"
                    name="note"
                    type="text"
                    required
                    value={postponeForm.note}
                    onChange={(e) =>
                      setPostponeForm((f) => ({ ...f, note: e.target.value }))
                    }
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
                    >
                      {actionLoading ? "Kaydediliyor…" : "Ertelemeyi Kaydet"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostponingId(null)}
                      className="w-full rounded-full border border-slate-300/60 px-5 py-2 text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200 sm:w-auto"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
