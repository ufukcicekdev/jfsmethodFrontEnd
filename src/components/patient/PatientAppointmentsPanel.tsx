"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormDateField } from "@/components/ui/CustomDatePicker";
import { KvkkConsentCheckboxes } from "@/components/kvkk/KvkkConsentCheckboxes";
import { KvkkLegalModal } from "@/components/kvkk/KvkkLegalModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useKvkkConsent } from "@/hooks/useKvkkConsent";
import { getAccessToken } from "@/lib/auth";
import {
  api,
  type Appointment,
  type AvailableSlot,
  type SessionPackage,
  type SiteSettings,
} from "@/lib/api";
import { AddToCalendarButton } from "@/components/patient/AddToCalendarButton";
import type { CalendarEvent } from "@/lib/calendar";

const STATUS_LABELS: Record<Appointment["status"], string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  postponed: "Ertelendi",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelinmedi",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PatientAppointmentsPanel({ compact }: { compact?: boolean }) {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePackage, setActivePackage] = useState<SessionPackage | null | undefined>(undefined);
  const [success, setSuccess] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    api.site
      .settings()
      .then(setSiteSettings)
      .catch(() => setSiteSettings(null));
  }, []);

  const {
    kvkkAccepted,
    acikRizaAccepted,
    setKvkkAccepted,
    setAcikRizaAccepted,
    isValid,
    legalModal,
    openLegalModal,
    closeLegalModal,
    reset,
  } = useKvkkConsent();

  useEffect(() => {
    setToken(getAccessToken());
  }, [user]);

  useEffect(() => {
    if (!token) return;
    api.packages
      .me(token)
      .then((pkgs) => {
        const active = pkgs.find(
          (p) =>
            p.is_active &&
            p.remaining_sessions - p.scheduled_count > 0
        );
        setActivePackage(active ?? null);
      })
      .catch(() => setActivePackage(null));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.appointments
      .availableSlots(token, date)
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [token, date]);

  const loadMyAppointments = () => {
    if (!token) return;
    api.appointments
      .list(token)
      .then(setMyAppointments)
      .catch(() => setMyAppointments([]));
  };

  useEffect(() => {
    loadMyAppointments();
  }, [token]);

  const handleCancel = async (id: number, appointment: Appointment) => {
    if (!token) return;
    const warning = getCancelWarning(appointment);
    const ok = await confirm({
      title: "Randevuyu iptal et",
      message: warning
        ? `⚠️ ${warning}\n\nYine de iptal etmek istiyor musunuz?`
        : "Randevunuzu iptal etmek istediğinize emin misiniz?",
      confirmLabel: "İptal et",
      variant: "danger",
    });
    if (!ok) return;
    setCancellingId(id);
    setError("");
    try {
      await api.appointments.cancel(token, id);
      loadMyAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevu iptal edilemedi.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSlot || !isValid) return;

    setLoading(true);
    setError("");
    try {
      await api.appointments.book(token, {
        doctor: selectedSlot.doctor_id,
        appointment_datetime: selectedSlot.datetime,
        kvkk_accepted: kvkkAccepted,
        acik_riza_accepted: acikRizaAccepted,
      });
      setSuccess(true);
      reset();
      setSelectedSlot(null);
      loadMyAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevu alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const getCancelLabel = (appointment: Appointment) => {
    const msLeft = new Date(appointment.appointment_datetime).getTime() - Date.now();
    const minutesLeft = msLeft / 60000;
    if (minutesLeft <= 30) return "İptal Et (seans hakkı yanar!)";
    if (minutesLeft <= 360) return "İptal Et (6 saatten az kaldı)";
    return "İptal";
  };

  const getCancelWarning = (appointment: Appointment) => {
    const msLeft = new Date(appointment.appointment_datetime).getTime() - Date.now();
    const minutesLeft = msLeft / 60000;
    if (minutesLeft <= 30)
      return "Son 30 dakika içinde iptal ettiğiniz için bu seans hakkınız düşecektir.";
    return null;
  };

  const upcoming = myAppointments.filter(
    (a) =>
      (a.status === "pending" || a.status === "approved") &&
      new Date(a.appointment_datetime) >= new Date()
  );

  const postponed = myAppointments.filter((a) => a.status === "postponed");
  const listAppointments = compact ? upcoming.slice(0, 3) : myAppointments;

  const buildCalendarEvent = (appointment: Appointment): CalendarEvent => {
    const clinicName = siteSettings?.clinic_name || "JFS Method";
    return {
      title: `${clinicName} — Fizyoterapi Randevusu`,
      start: new Date(appointment.appointment_datetime),
      durationMinutes: appointment.duration_minutes ?? 45,
      description: `Terapist: Dr. ${appointment.doctor_name}`,
      location: siteSettings?.address || undefined,
    };
  };

  const canAddToCalendar = (appointment: Appointment) =>
    (appointment.status === "pending" || appointment.status === "approved") &&
    new Date(appointment.appointment_datetime) >= new Date();

  const hasBookablePackage = activePackage !== null && activePackage !== undefined;

  return (
    <div className="space-y-4 sm:space-y-6">
      {!compact && (
        <GlassCard className="p-4 sm:p-6">
          {activePackage === null && (
            <div className="mb-5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Aktif paketiniz bulunmuyor
              </p>
              <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-300/90">
                Randevu alabilmek için aktif bir seans paketi gereklidir. Paketler
                sayfasından mevcut paket planlarını inceleyebilirsiniz.
              </p>
              <Link
                href="/hesabim/paketler"
                className="mt-2 inline-block text-sm font-medium text-amber-800 underline dark:text-amber-300"
              >
                Paketlere git →
              </Link>
            </div>
          )}
          {success ? (
            <div className="text-center">
              <p className="text-lg font-semibold text-emerald-600">
                Randevu talebiniz alındı!
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {user?.email} adresine bilgilendirme e-postası gönderildi. Klinik
                onayından sonra ayrıca onay maili iletilecektir.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="mt-6 rounded-full border border-blue-500/40 px-6 py-2.5 text-sm font-semibold text-blue-600"
              >
                Yeni Randevu
              </button>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Yeni Randevu
              </h2>

              <FormDateField
                label="Randevu Tarihi"
                name="appointment_date"
                required
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(value) => {
                  setDate(value);
                  setSelectedSlot(null);
                }}
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Müsait Saatler
                </label>
                {slots.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Bu tarih için müsait randevu bulunmuyor.
                  </p>
                ) : (
                  <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                    {slots.map((slot) => {
                      const time = new Date(slot.datetime).toLocaleTimeString(
                        "tr-TR",
                        { hour: "2-digit", minute: "2-digit" }
                      );
                      const isSelected =
                        selectedSlot?.datetime === slot.datetime &&
                        selectedSlot?.doctor_id === slot.doctor_id;

                      return (
                        <button
                          key={`${slot.doctor_id}-${slot.datetime}`}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-400/30 dark:bg-blue-950/50 dark:text-blue-300"
                              : "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-200"
                          }`}
                        >
                          {time}
                          <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400">
                            {slot.doctor_name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <KvkkConsentCheckboxes
                kvkkAccepted={kvkkAccepted}
                acikRizaAccepted={acikRizaAccepted}
                onKvkkChange={setKvkkAccepted}
                onAcikRizaChange={setAcikRizaAccepted}
                onOpenAydinlatma={() => openLegalModal("aydinlatma")}
                onOpenAcikRiza={() => openLegalModal("acik_riza")}
              />

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Randevu alarak{" "}
                <button
                  type="button"
                  onClick={() => openLegalModal("randevu_sozlesmesi")}
                  className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  Randevu &amp; İptal Politikası
                </button>
                'nı kabul etmiş sayılırsınız.
              </p>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={!isValid || !selectedSlot || loading || !hasBookablePackage}
                className="w-full rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
              >
                {loading ? "Randevu oluşturuluyor…" : "Randevu Al"}
              </button>
            </form>
          )}
        </GlassCard>
      )}

      {postponed.length > 0 && !compact && (
        <GlassCard className="border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {postponed.length} randevunuz ertelendi
          </p>
          <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-300/90">
            Yeni tarih aşağıda listelenmiştir. Uygun değilse yeni randevu
            alabilirsiniz.
          </p>
          <Link
            href="/hesabim/randevular"
            className="mt-3 inline-block text-sm font-medium text-amber-800 underline dark:text-amber-300"
          >
            Randevu sayfasına git →
          </Link>
        </GlassCard>
      )}

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {compact ? "Yaklaşan Randevular" : "Randevularım"}
        </h2>
        {listAppointments.length === 0 ? (
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            <p>
              {compact
                ? "Yaklaşan randevunuz yok."
                : "Henüz randevunuz bulunmuyor."}
            </p>
            {compact && (
              <Link
                href="/hesabim/randevular"
                className="mt-2 inline-block font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Randevu al →
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {listAppointments.map((appointment) => (
              <li
                key={appointment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/50 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-800/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatDateTime(appointment.appointment_datetime)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dr. {appointment.doctor_name}
                  </p>
                  {appointment.status === "postponed" && appointment.note && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Ertelenme notu: {appointment.note}
                    </p>
                  )}
                  {appointment.status === "cancelled" &&
                    appointment.cancellation_reason && (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {appointment.cancellation_reason}
                      </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {STATUS_LABELS[appointment.status]}
                  </span>
                  {canAddToCalendar(appointment) && (
                    <AddToCalendarButton
                      event={buildCalendarEvent(appointment)}
                    />
                  )}
                  {!compact &&
                    (appointment.status === "pending" ||
                      appointment.status === "approved") && (
                      <button
                        type="button"
                        disabled={cancellingId === appointment.id}
                        onClick={() => handleCancel(appointment.id, appointment)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
                      >
                        {cancellingId === appointment.id
                          ? "İptaliniz…"
                          : getCancelLabel(appointment)}
                      </button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {legalModal && (
        <KvkkLegalModal type={legalModal} onClose={closeLegalModal} />
      )}
    </div>
  );
}
