"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormInput } from "@/components/ui/FormField";
import { Pagination } from "@/components/ui/Pagination";
import { getAccessToken } from "@/lib/auth";
import { api, type AuditLog } from "@/lib/api";

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  login: "Giriş",
  login_fail: "Başarısız Giriş",
  register: "Kayıt",
  impersonate: "Kullanıcı Olarak Giriş",
  appointment_create: "Randevu Oluşturma",
  appointment_cancel: "Randevu İptal",
  appointment_status: "Randevu Durum",
  package_assign: "Paket Atama",
  package_delete: "Paket Silme",
  package_status: "Paket Güncelleme",
  attendance_mark: "Devam İşareti",
  attendance_delete: "Devam Silme",
  patient_create: "Öğrenci Oluşturma",
  patient_delete: "Öğrenci Silme",
  password_change: "Şifre Değiştirme",
  onboarding_submit: "Onboarding Tamamlandı",
  frontend_error: "Frontend Hatası",
  other: "Diğer",
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  failure: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  error: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  login_fail: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  register: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  impersonate: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  appointment_create: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  appointment_cancel: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  package_assign: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  package_delete: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  attendance_mark: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  attendance_delete: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  onboarding_submit: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  frontend_error: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = async (p: number) => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.admin.auditLogs(token, {
        action: actionFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page: p,
        pageSize: PAGE_SIZE,
      });
      setLogs(data.results);
      setTotal(data.count);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(page), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, actionFilter, statusFilter, page]);

  const handlePageChange = (p: number) => {
    setPage(p);
    setExpandedId(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Sistem Logları</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Giriş, randevu, paket ve diğer önemli işlemlerin kayıtları.
        </p>
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <FormInput
              placeholder="Kullanıcı adı veya isim ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">Tüm İşlemler</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">Tüm Durumlar</option>
            <option value="success">Başarılı</option>
            <option value="failure">Başarısız</option>
            <option value="error">Hata</option>
          </select>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : logs.length === 0 ? (
        <GlassCard className="p-10 text-center text-slate-500">Log bulunamadı.</GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-700/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">İşlem</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Kim Yaptı</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hedef</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Detay</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {log.created_at}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                          {log.action_display}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[log.status] ?? ""}`}>
                          {log.status === "success" ? "Başarılı" : log.status === "failure" ? "Başarısız" : "Hata"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {log.actor ? (
                          <span>{log.actor.full_name} <span className="text-xs text-slate-400">@{log.actor.username}</span></span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {log.target_user ? (
                          <span>{log.target_user.full_name} <span className="text-xs text-slate-400">@{log.target_user.username}</span></span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                        {log.ip_address ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {Object.keys(log.detail).length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {expandedId === log.id ? "Kapat" : "Göster"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`} className="bg-slate-50/80 dark:bg-slate-800/40">
                        <td colSpan={7} className="px-6 py-3">
                          <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all">
                            {JSON.stringify(log.detail, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200/60 px-4 py-3 dark:border-slate-700/40">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <span className="text-xs text-slate-500">{total} kayıt · Sayfa {page}/{totalPages}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
