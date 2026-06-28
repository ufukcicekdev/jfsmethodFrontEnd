"use client";

import { useEffect, useMemo, useState } from "react";
import { FormField, FormGroup } from "@/components/ui/FormField";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getAccessToken } from "@/lib/auth";
import {
  api,
  type AdminPatient,
  type AvailableSlot,
  type Doctor,
} from "@/lib/api";

interface AdminCreateAppointmentFormProps {
  onCreated: () => void;
  onClose: () => void;
  onMessage: (message: string, type: "success" | "error") => void;
}

function slotTimeLabel(value: string) {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminCreateAppointmentForm({
  onCreated,
  onClose,
  onMessage,
}: AdminCreateAppointmentFormProps) {
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [patientId, setPatientId] = useState(0);
  const [doctorId, setDoctorId] = useState(0);
  const [date, setDate] = useState("");
  const [datetime, setDatetime] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    Promise.all([api.admin.patients(token), api.appointments.doctors(token)])
      .then(([patientList, doctorList]) => {
        setPatients(patientList);
        setDoctors(doctorList);
        if (doctorList.length) setDoctorId(doctorList[0].id);
      })
      .catch(() => onMessage("Liste verileri yüklenemedi.", "error"));
  }, [onMessage]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setDatetime("");
    api.appointments
      .availableSlots(token, date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date]);

  const doctorSlots = useMemo(
    () => slots.filter((s) => s.doctor_id === doctorId),
    [slots, doctorId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    if (!patientId) {
      onMessage("Lütfen bir öğrenci seçin.", "error");
      return;
    }
    if (!doctorId || !datetime) {
      onMessage("Lütfen doktor ve saat seçin.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.admin.createAppointment(token, {
        patient_id: patientId,
        doctor: doctorId,
        appointment_datetime: datetime,
        note: note.trim(),
      });
      onMessage("Randevu oluşturuldu.", "success");
      onCreated();
      onClose();
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Randevu oluşturulamadı.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/60 p-4 sm:p-5 dark:border-slate-600/50 dark:bg-slate-800/40"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Yeni Randevu Oluştur
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Kapat
        </button>
      </div>

      <FormGroup label="Öğrenci" required>
        <CustomSelect
          value={patientId}
          onChange={setPatientId}
          className="w-full"
          options={[
            { value: 0, label: "Öğrenci seçin…" },
            ...patients.map((p) => ({
              value: p.id,
              label: `${p.full_name}${p.phone ? ` · ${p.phone}` : ""}`,
            })),
          ]}
          aria-label="Öğrenci"
        />
      </FormGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormGroup label="Doktor" required>
          <CustomSelect
            value={doctorId}
            onChange={setDoctorId}
            className="w-full"
            options={doctors.map((d) => ({
              value: d.id,
              label: d.full_name,
            }))}
            aria-label="Doktor"
          />
        </FormGroup>

        <FormField
          label="Tarih"
          name="date"
          type="date"
          required
          min={todayIso}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <FormGroup label="Saat" required>
        {!date ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Önce tarih seçin.
          </p>
        ) : slotsLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Müsait saatler yükleniyor…
          </p>
        ) : doctorSlots.length === 0 ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Bu tarih ve doktor için müsait saat yok.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {doctorSlots.map((slot) => (
              <button
                key={slot.datetime}
                type="button"
                onClick={() => setDatetime(slot.datetime)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  datetime === slot.datetime
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-slate-300/60 text-slate-700 hover:border-blue-400 dark:border-slate-600/60 dark:text-slate-200"
                }`}
              >
                {slotTimeLabel(slot.datetime)}
                {typeof slot.remaining === "number" && slot.remaining > 1 && (
                  <span className="ml-1 text-xs opacity-70">
                    ({slot.remaining})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </FormGroup>

      <FormField
        label="Not (opsiyonel)"
        name="note"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button
        type="submit"
        disabled={submitting || !patientId || !datetime}
        className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Oluşturuluyor…" : "Randevu Oluştur"}
      </button>
    </form>
  );
}
