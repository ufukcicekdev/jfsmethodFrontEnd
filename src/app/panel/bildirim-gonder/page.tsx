"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FormField } from "@/components/ui/FormField";
import { getAccessToken } from "@/lib/auth";
import { api, type AdminPatient } from "@/lib/api";

type Mode = "all" | "selected";

export default function BildirimGonderPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<Mode>("all");
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<AdminPatient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (mode !== "selected") return;
    if (patients.length > 0) return;

    setLoadingPatients(true);
    const token = getAccessToken();
    if (!token) return;

    api.admin
      .patients(token)
      .then((data) => {
        setPatients(data);
        setFilteredPatients(data);
      })
      .catch(() => {
        setFeedback({ type: "error", message: "Öğrenciler yüklenemedi." });
      })
      .finally(() => setLoadingPatients(false));
  }, [mode, patients.length]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredPatients(
      patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      )
    );
  }, [search, patients]);

  const togglePatient = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredPatients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPatients.map((p) => p.id)));
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setFeedback({ type: "error", message: "Başlık ve mesaj alanları zorunludur." });
      return;
    }
    if (mode === "selected" && selectedIds.size === 0) {
      setFeedback({ type: "error", message: "Lütfen en az bir öğrenci seçin." });
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setSending(true);
    setFeedback(null);

    try {
      const payload: { title: string; body: string; patient_ids?: number[] } = {
        title: title.trim(),
        body: body.trim(),
      };
      if (mode === "selected") {
        payload.patient_ids = Array.from(selectedIds);
      }

      const result = await api.admin.sendNotification(token, payload);
      setFeedback({
        type: "success",
        message: `Bildirim ${result.sent_to} öğrenciye başarıyla gönderildi.`,
      });
      setTitle("");
      setBody("");
      setSelectedIds(new Set());
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Bildirim gönderilemedi.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Bildirim Gönder
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Öğrencilere push bildirimi ve uygulama içi bildirim gönderin.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <GlassCard className="p-6">
        <div className="space-y-5">
          <FormField
            label="Başlık"
            name="title"
            placeholder="Bildirim başlığı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mesaj<span className="ml-0.5 text-blue-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Bildirim mesajı..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm shadow-slate-200/50 placeholder:text-slate-400 transition-all outline-none hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:border-blue-400 dark:focus:bg-slate-800 resize-none"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Alıcılar
            </p>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="mode"
                  value="all"
                  checked={mode === "all"}
                  onChange={() => setMode("all")}
                  className="accent-blue-500"
                />
                Tüm Öğrenciler
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="mode"
                  value="selected"
                  checked={mode === "selected"}
                  onChange={() => setMode("selected")}
                  className="accent-blue-500"
                />
                Seçili Öğrenciler
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Gönder
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {mode === "selected" && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Öğrenci Seçimi
                {selectedIds.size > 0 && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {selectedIds.size} seçili
                  </span>
                )}
              </h2>
            </div>

            <input
              type="text"
              placeholder="İsim veya e-posta ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />

            {loadingPatients ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200/60 dark:border-slate-600/40">
                {filteredPatients.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">Öğrenci bulunamadı.</p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="flex w-full items-center gap-3 border-b border-slate-200/60 bg-slate-50/70 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100/70 dark:border-slate-600/40 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedIds.size === filteredPatients.length && filteredPatients.length > 0}
                        className="accent-blue-500"
                      />
                      {selectedIds.size === filteredPatients.length && filteredPatients.length > 0
                        ? "Tümünü Kaldır"
                        : "Tümünü Seç"}
                    </button>
                    {filteredPatients.map((patient) => (
                      <label
                        key={patient.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-slate-100/60 px-4 py-3 hover:bg-white/60 dark:border-slate-700/40 dark:hover:bg-slate-800/40 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(patient.id)}
                          onChange={() => togglePatient(patient.id)}
                          className="accent-blue-500"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                            {patient.full_name}
                          </p>
                          {patient.email && (
                            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                              {patient.email}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
