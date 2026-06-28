"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { FormGroup } from "@/components/ui/FormField";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getAccessToken } from "@/lib/auth";
import {
  api,
  type Appointment,
  type PackagePlan,
  type PatientAttendance,
  type SessionPackage,
} from "@/lib/api";

function formatPrice(value: string | number | null) {
  if (value === null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });
}

const STATUS_LABELS: Record<Appointment["status"], string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  postponed: "Ertelendi",
  completed: "Geldi",
  cancelled: "İptal",
  no_show: "Gelmedi",
};

const STATUS_BADGE: Record<Appointment["status"], string> = {
  pending: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  approved:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  postponed:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  no_show:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PatientPackageSectionProps {
  patientId: number;
  packages: SessionPackage[];
  attendance?: PatientAttendance;
  onMessage: (message: string, type: "success" | "error") => void;
  onChanged: () => void;
}

function StatChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl px-4 py-3 ${className}`}
    >
      <span className="text-2xl font-bold">{value}</span>
      <span className="mt-0.5 text-xs font-medium">{label}</span>
    </div>
  );
}

export function PatientPackageSection({
  patientId,
  packages,
  attendance,
  onMessage,
  onChanged,
}: PatientPackageSectionProps) {
  const confirm = useConfirm();
  const todayIso = new Date().toISOString().slice(0, 10);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [localHistory, setLocalHistory] = useState(attendance?.history ?? []);
  const [updatingApptId, setUpdatingApptId] = useState<number | null>(null);
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [form, setForm] = useState({
    plan_id: 0,
    is_paid: false,
  });

  useEffect(() => {
    setLocalHistory(attendance?.history ?? []);
  }, [attendance]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    api.admin
      .packagePlans(token)
      .then((data) => setPlans(data.filter((p) => p.is_active)))
      .catch(() => setPlans([]));
  }, []);

  const handleMarkAttendance = async (apptId: number, status: Appointment["status"]) => {
    const token = getAccessToken();
    if (!token) return;
    setUpdatingApptId(apptId);
    try {
      await api.admin.updateAppointmentStatus(token, apptId, { status });
      setLocalHistory((prev) =>
        prev.map((r) => (r.id === apptId ? { ...r, status } : r))
      );
      onChanged();
    } catch (err) {
      onMessage(err instanceof Error ? err.message : "Durum güncellenemedi.", "error");
    } finally {
      setUpdatingApptId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    if (!form.plan_id) {
      onMessage("Lütfen bir paket seçin.", "error");
      return;
    }

    setCreating(true);
    try {
      await api.admin.createPackage(token, patientId, {
        plan_id: form.plan_id,
        purchased_at: todayIso,
        is_paid: form.is_paid,
      });
      setForm({ plan_id: 0, is_paid: false });
      onMessage("Paket atandı.", "success");
      onChanged();
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Paket atanamadı.",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePaid = async (pkg: SessionPackage) => {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(pkg.id);
    try {
      await api.admin.updatePackage(token, patientId, pkg.id, {
        is_paid: !pkg.is_paid,
      });
      onChanged();
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Paket güncellenemedi.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (pkg: SessionPackage) => {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(pkg.id);
    try {
      await api.admin.updatePackage(token, patientId, pkg.id, {
        is_active: !pkg.is_active,
      });
      onChanged();
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Paket güncellenemedi.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (pkg: SessionPackage) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({
      title: "Paketi sil",
      message: "Bu paketi silmek istediğinize emin misiniz?",
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    setBusyId(pkg.id);
    try {
      await api.admin.deletePackage(token, patientId, pkg.id);
      onMessage("Paket silindi.", "success");
      onChanged();
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Paket silinemedi.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <GlassCard className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Paket ve Devam Takibi
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Seans paketlerini yönetin, geldiği ve gelmediği günleri görün.
      </p>

      {attendance && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip
            label="Geldi"
            value={attendance.completed}
            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          />
          <StatChip
            label="Gelmedi"
            value={attendance.no_show}
            className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
          />
          <StatChip
            label="İptal"
            value={attendance.cancelled}
            className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          />
          <StatChip
            label="Yaklaşan"
            value={attendance.upcoming}
            className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {packages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300/70 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-600/60 dark:text-slate-400">
            Henüz paket tanımlanmamış.
          </p>
        ) : (
          packages.map((pkg) => {
            const pct =
              pkg.total_sessions > 0
                ? Math.min(
                    100,
                    Math.round((pkg.used_sessions / pkg.total_sessions) * 100)
                  )
                : 0;
            return (
              <div
                key={pkg.id}
                className={`rounded-2xl border p-4 ${
                  pkg.is_active
                    ? "border-blue-200/70 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20"
                    : "border-slate-200/70 bg-slate-50/50 opacity-75 dark:border-slate-700/60 dark:bg-slate-800/30"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {pkg.name || `${pkg.total_sessions} seanslık paket`}
                      {!pkg.is_active && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          Pasif
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(pkg.purchased_at)} ·{" "}
                      {pkg.created_by_name ?? "—"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {formatPrice(pkg.price) && (
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {formatPrice(pkg.price)}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          pkg.is_paid
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        }`}
                      >
                        {pkg.is_paid ? "Ödendi" : "Ödenmedi"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === pkg.id}
                      onClick={() => handleTogglePaid(pkg)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                        pkg.is_paid
                          ? "border-amber-500/50 text-amber-600 dark:text-amber-400"
                          : "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {pkg.is_paid ? "Ödenmedi yap" : "Ödendi işaretle"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === pkg.id}
                      onClick={() => handleToggle(pkg)}
                      className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200 disabled:opacity-50"
                    >
                      {pkg.is_active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === pkg.id}
                      onClick={() => handleDelete(pkg)}
                      className="rounded-full border border-red-500/50 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    Toplam:{" "}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {pkg.total_sessions}
                    </strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Kullanılan:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {pkg.used_sessions}
                    </strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Gelmedi:{" "}
                    <strong className="text-orange-600 dark:text-orange-400">
                      {pkg.no_show_count}
                    </strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Kalan:{" "}
                    <strong className="text-blue-600 dark:text-blue-400">
                      {pkg.remaining_sessions}
                    </strong>
                  </span>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {pkg.note && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {pkg.note}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-6 space-y-4 border-t border-slate-200/80 pt-5 dark:border-slate-600/50"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Hastaya Paket Ata
        </h3>

        {plans.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300/70 px-4 py-4 text-sm text-slate-500 dark:border-slate-600/60 dark:text-slate-400">
            Henüz tanımlı paket yok.{" "}
            <Link
              href="/panel/paketler"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Paketler sayfasından
            </Link>{" "}
            paket tanımlayın.
          </p>
        ) : (
          <>
            <FormGroup label="Paket Seçin">
              <CustomSelect
                value={form.plan_id}
                onChange={(value) => setForm((f) => ({ ...f, plan_id: Number(value) }))}
                className="w-full"
                options={[
                  { value: 0, label: "Paket seçin…" },
                  ...plans.map((p) => ({
                    value: p.id,
                    label: `${p.name} — ${p.total_sessions} seans · ${formatPrice(
                      p.price
                    )}`,
                  })),
                ]}
                aria-label="Paket planı"
              />
            </FormGroup>

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={form.is_paid}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_paid: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
              />
              Ödemesi alındı
            </label>

            <button
              type="submit"
              disabled={creating || !form.plan_id}
              className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
            >
              {creating ? "Kaydediliyor…" : "Paket Ata"}
            </button>
          </>
        )}
      </form>

      {localHistory.length > 0 && (
        <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-slate-600/50">
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Devam Geçmişi ({localHistory.length})
            <span className="text-xs text-slate-400">
              {showHistory ? "▲" : "▼"}
            </span>
          </button>
          {showHistory && (
            <ul className="mt-3 space-y-1.5">
              {localHistory.map((record) => {
                const busy = updatingApptId === record.id;
                const canMark = record.status === "pending" || record.status === "approved";
                const isCompleted = record.status === "completed";
                const isNoShow = record.status === "no_show";
                return (
                  <li
                    key={record.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50"
                  >
                    <span className="text-slate-700 dark:text-slate-200">
                      {formatDateTime(record.appointment_datetime)}
                      <span className="ml-2 text-xs text-slate-400">
                        Dr. {record.doctor_name}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[record.status]}`}
                      >
                        {STATUS_LABELS[record.status]}
                      </span>
                      {canMark && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleMarkAttendance(record.id, "completed")}
                            className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                          >
                            {busy ? "…" : "✓ Geldi"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleMarkAttendance(record.id, "no_show")}
                            className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                          >
                            {busy ? "…" : "✗ Gelmedi"}
                          </button>
                        </>
                      )}
                      {(isCompleted || isNoShow) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleMarkAttendance(record.id, isCompleted ? "no_show" : "completed")}
                          className="rounded-full border border-slate-300/70 px-2.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600/60 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          {busy ? "…" : isCompleted ? "Gelmedi yap" : "Geldi yap"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </GlassCard>
  );
}
