"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormInput } from "@/components/ui/FormField";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 20;
import { AdminCreatePatientForm } from "@/components/admin/AdminCreatePatientForm";
import { getAccessToken, setTokens } from "@/lib/auth";
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

const todayIso = new Date().toISOString().slice(0, 10);

function PkgDropdown({
  packages,
  value,
  onChange,
}: {
  packages: { id: number; name: string; remaining: number }[];
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = packages.find((p) => p.id === value);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onScroll = (e: Event) => {
      // ignore scrolls that happen inside the dropdown list itself
      if (listRef.current && listRef.current.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <span>{selected ? `${selected.name} (${selected.remaining} kaldı)` : "Paket seçin"}</span>
        <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && rect && typeof document !== "undefined" && createPortal(
        <ul
          ref={listRef}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, minWidth: rect.width, zIndex: 9999, maxHeight: 200, overflowY: "auto" }}
          className="rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
        >
          <li>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50">
              Paket seçin…
            </button>
          </li>
          {packages.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(p.id); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-950/30 ${value === p.id ? "font-semibold text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>
                {p.name} <span className="text-slate-400">({p.remaining} kaldı)</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}

function DownloadAllReportButton() {
  const [busy, setBusy] = useState(false);

  const download = async (fmt: "xlsx" | "pdf") => {
    const token = getAccessToken();
    if (!token || busy) return;
    setBusy(true);
    try {
      const res = await api.admin.downloadAllPatientsReport(token, fmt);
      if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ogrenciler_raporu.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rapor indirilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => download("xlsx")}
        disabled={busy}
        className="rounded-full border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
      >
        ↓ Excel Raporu
      </button>
      <button
        onClick={() => download("pdf")}
        disabled={busy}
        className="rounded-full border border-blue-500/50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
      >
        ↓ PDF Raporu
      </button>
    </>
  );
}

function AttendanceBar({
  patientId,
  activePackages,
  onMarked,
}: {
  patientId: number;
  activePackages: { id: number; name: string; remaining: number }[];
  onMarked: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(todayIso);
  const [selectedPkgId, setSelectedPkgId] = useState<number | "">(
    activePackages.length === 1 ? activePackages[0].id : ""
  );

  const doMark = async (s: "came" | "no_show") => {
    const token = getAccessToken();
    if (!token || busy) return;
    setBusy(true);
    try {
      await api.admin.markAttendance(token, patientId, s, date, selectedPkgId || undefined);
      onMarked();
    } catch {
      // sessiz geç
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 bg-slate-50/50 px-4 py-2.5 dark:border-slate-700/40 dark:bg-slate-800/20"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {activePackages.length > 1 && (
        <PkgDropdown
          packages={activePackages}
          value={selectedPkgId}
          onChange={setSelectedPkgId}
        />
      )}
      {activePackages.length === 1 && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {activePackages[0].name} ({activePackages[0].remaining} kaldı)
        </span>
      )}
      <input
        type="date"
        value={date}
        max={todayIso}
        onChange={(e) => { e.stopPropagation(); setDate(e.target.value); }}
        className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
      />
      <button
        type="button"
        disabled={busy}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); doMark("came"); }}
        className="rounded-full border border-emerald-400/60 px-3 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
      >
        {busy ? "…" : "✓ Geldi"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); doMark("no_show"); }}
        className="rounded-full border border-orange-400/60 px-3 py-0.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
      >
        {busy ? "…" : "✗ Gelmedi"}
      </button>
    </div>
  );
}

const todayStr = new Date().toISOString().slice(0, 10);

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeFilter = searchParams.get("filter") ?? "";
  const activeDate = searchParams.get("date") ?? "";

  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [dateInput, setDateInput] = useState(activeDate || todayStr);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadPatients = (p: number) => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    const date = activeFilter === "completed_date" ? activeDate : undefined;
    api.admin
      .patients(token, search.trim() || undefined, p, PAGE_SIZE, activeFilter || undefined, date || undefined)
      .then((data) => { setPatients(data.results); setTotal(data.count); })
      .catch(() => setError("Öğrenciler yüklenemedi."))
      .finally(() => setLoading(false));
  };

  const applyFilter = (filter: string, date?: string) => {
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (date) params.set("date", date);
    router.push(`/panel/ogrenciler${params.toString() ? `?${params}` : ""}`);
  };

  useEffect(() => { setPage(1); }, [search, activeFilter, activeDate]);

  useEffect(() => {
    const timer = setTimeout(() => loadPatients(page), 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, activeFilter, activeDate]);

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

  const handlePageChange = (p: number) => setPage(p);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Öğrenciler</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kayıtlı öğrencileri görüntüleyin, profil ve kilo takibini yönetin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadAllReportButton />
          <button
            type="button"
            onClick={() => setShowCreate((s) => !s)}
            className="shrink-0 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            {showCreate ? "Formu Kapat" : "+ Yeni Öğrenci"}
          </button>
        </div>
      </div>

      {showCreate && (
        <AdminCreatePatientForm onCreated={() => loadPatients(1)} onClose={() => setShowCreate(false)} />
      )}

      <GlassCard className="p-4 sm:p-6 space-y-3">
        <FormInput
          type="search"
          placeholder="Ad, kullanıcı adı veya e-posta ile ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Öğrenci ara"
        />

        {/* Egzersiz filtresi */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Egzersiz:</span>
          {[
            { label: "Tümü", value: "" },
            { label: "Bugün", value: "completed_today" },
            { label: "Bu Hafta", value: "completed_week" },
            { label: "Tarihe Göre", value: "completed_date" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => applyFilter(opt.value, opt.value === "completed_date" ? dateInput : undefined)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeFilter === opt.value
                  ? "bg-violet-500 text-white shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-400"
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* Tarih picker — sadece "Tarihe Göre" seçiliyken */}
          {activeFilter === "completed_date" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateInput}
                max={todayStr}
                onChange={(e) => {
                  setDateInput(e.target.value);
                  applyFilter("completed_date", e.target.value);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {activeFilter && (
            <button
              type="button"
              onClick={() => applyFilter("")}
              className="ml-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              ✕ Temizle
            </button>
          )}

          {activeFilter && (
            <span className="ml-auto text-xs text-slate-400">
              {total} öğrenci bulundu
            </span>
          )}
        </div>
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
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{patient.full_name}</p>
                        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                          @{patient.username} · {patient.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const token = getAccessToken();
                          if (!token) return;
                          try {
                            const data = await api.admin.impersonate(token, patient.id);
                            setTokens(data.access, data.refresh);
                            window.open("/hesabim", "_blank");
                          } catch {
                            alert("Giriş yapılamadı.");
                          }
                        }}
                        className="shrink-0 rounded-full border border-violet-400/60 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:border-violet-500/40 dark:hover:bg-violet-950/30"
                      >
                        Olarak Giriş Yap
                      </button>
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

                    {/* Bugünkü aktivite özeti */}
                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-slate-800/40">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">💧</span>
                        <div>
                          <p className="text-[10px] text-slate-400">Su</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {patient.today_water_ml > 0 ? `${(patient.today_water_ml / 1000).toFixed(1)}L` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">👟</span>
                        <div>
                          <p className="text-[10px] text-slate-400">Adım</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {patient.today_steps > 0 ? patient.today_steps.toLocaleString("tr-TR") : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">✅</span>
                        <div>
                          <p className="text-[10px] text-slate-400">Egzersiz</p>
                          <p className={`text-xs font-semibold ${patient.today_exercises_done > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}>
                            {patient.today_exercises_done > 0 ? `${patient.today_exercises_done} tamamlandı` : "—"}
                          </p>
                        </div>
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

                {(patient.active_packages?.length ?? 0) > 0 && (
                  <AttendanceBar
                    patientId={patient.id}
                    activePackages={patient.active_packages ?? []}
                    onMarked={() => loadPatients(page)}
                  />
                )}
              </GlassCard>
            );
          })}
          {totalPages > 1 && (
            <GlassCard className="p-3">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <span className="text-xs text-slate-500">{total} öğrenci · Sayfa {page}/{totalPages}</span>
                <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
