"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormInput } from "@/components/ui/FormField";
import { AdminCreatePatientForm } from "@/components/admin/AdminCreatePatientForm";
import { getAccessToken } from "@/lib/auth";
import { api, type AdminPatient } from "@/lib/api";
import { getBMICategory } from "@/lib/bmi";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AttendanceBar({
  patientId,
  todayAttendance,
  onMarked,
}: {
  patientId: number;
  todayAttendance: { id: number; status: "came" | "no_show" } | null;
  onMarked: (status: "came" | "no_show" | null) => void;
}) {
  const [busy, setBusy] = useState(false);

  const mark = async (s: "came" | "no_show", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = getAccessToken();
    if (!token || busy) return;
    setBusy(true);
    try {
      if (todayAttendance?.status === s) {
        await api.admin.removeAttendance(token, patientId);
        onMarked(null);
      } else {
        await api.admin.markAttendance(token, patientId, s);
        onMarked(s);
      }
    } finally {
      setBusy(false);
    }
  };

  const came = todayAttendance?.status === "came";
  const noShow = todayAttendance?.status === "no_show";

  return (
    <div
      className="flex items-center gap-2 border-t border-slate-200/60 bg-slate-50/50 px-4 py-2.5 dark:border-slate-700/40 dark:bg-slate-800/20"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Bugün:</span>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => mark("came", e)}
        className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50 ${came ? "bg-emerald-500 text-white" : "border border-emerald-400/60 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"}`}
      >
        {busy && came ? "…" : "✓ Geldi"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => mark("no_show", e)}
        className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50 ${noShow ? "bg-orange-500 text-white" : "border border-orange-400/60 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"}`}
      >
        {busy && noShow ? "…" : "✗ Gelmedi"}
      </button>
    </div>
  );
}

export default function StudentsPage() {
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadPatients = () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    api.admin
      .patients(token, search.trim() || undefined)
      .then(setPatients)
      .catch(() => setError("Öğrenciler yüklenemedi."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const timer = setTimeout(loadPatients, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleMarked = (patientId: number, newStatus: "came" | "no_show" | null) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        const prev_status = p.today_attendance?.status ?? null;
        let came_count = p.came_count;
        let no_show_count = p.no_show_count;
        if (prev_status === "came") came_count--;
        if (prev_status === "no_show") no_show_count--;
        if (newStatus === "came") came_count++;
        if (newStatus === "no_show") no_show_count++;
        return {
          ...p,
          today_attendance: newStatus ? { id: Date.now(), status: newStatus } : null,
          came_count,
          no_show_count,
        };
      })
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Öğrenciler</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kayıtlı öğrencileri görüntüleyin, profil ve kilo takibini yönetin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="shrink-0 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
        >
          {showCreate ? "Formu Kapat" : "+ Yeni Öğrenci"}
        </button>
      </div>

      {showCreate && (
        <AdminCreatePatientForm onCreated={loadPatients} onClose={() => setShowCreate(false)} />
      )}

      <GlassCard className="p-4 sm:p-6">
        <FormInput
          type="search"
          placeholder="Ad, kullanıcı adı veya e-posta ile ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Öğrenci ara"
        />
      </GlassCard>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : patients.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            {search ? "Arama sonucu bulunamadı." : "Henüz kayıtlı öğrenci yok."}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => {
            const bmi = patient.bmi && patient.height && patient.weight ? getBMICategory(patient.bmi) : null;

            return (
              <GlassCard key={patient.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <Link href={`/panel/ogrenciler/${patient.id}`} className="block p-4 sm:p-5">
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{patient.full_name}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                        @{patient.username} · {patient.email}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 sm:gap-4">
                      <div>
                        <p className="text-xs uppercase text-slate-400">Boy</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {patient.height ? `${patient.height} cm` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">Kilo</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {patient.weight ? `${patient.weight} kg` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">BMI</p>
                        <p className={`font-medium ${bmi?.colorClass ?? "text-slate-700 dark:text-slate-200"}`}>
                          {patient.bmi ?? "—"}{bmi ? ` (${bmi.label})` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">Son Geldi</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {formatDate(patient.last_attended)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-700/50">
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {patient.came_count} Geldi
                      </span>
                      {patient.no_show_count > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          {patient.no_show_count} Gelmedi
                        </span>
                      )}
                      {patient.remaining_sessions > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {patient.remaining_sessions} ders kaldı
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <AttendanceBar
                  patientId={patient.id}
                  todayAttendance={patient.today_attendance}
                  onMarked={(status) => handleMarked(patient.id, status)}
                />
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
