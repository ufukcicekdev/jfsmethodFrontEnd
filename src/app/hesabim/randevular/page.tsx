"use client";

import { PatientAppointmentsPanel } from "@/components/patient/PatientAppointmentsPanel";

export default function PatientAppointmentsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
          Randevular
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Yeni randevu oluşturun veya mevcut randevularınızı yönetin.
        </p>
      </div>
      <PatientAppointmentsPanel />
    </div>
  );
}
