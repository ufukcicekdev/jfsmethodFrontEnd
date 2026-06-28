"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { FormGroup } from "@/components/ui/FormField";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getAccessToken } from "@/lib/auth";
import { api, type PostureAssessment } from "@/lib/api";
import {
  analyzePosture,
  poseConnections,
  STATUS_STYLES,
  type PostureMetric,
  type PostureView,
} from "@/lib/posture";

interface PostureAnalysisProps {
  patientId: number;
  onMessage: (message: string, type: "success" | "error") => void;
}

const VIEW_OPTIONS = [
  { value: "front", label: "Önden" },
  { value: "side", label: "Yandan" },
  { value: "back", label: "Arkadan" },
];

const MAX_CANVAS_WIDTH = 900;

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostureAnalysis({
  patientId,
  onMessage,
}: PostureAnalysisProps) {
  const confirm = useConfirm();
  const [history, setHistory] = useState<PostureAssessment[]>([]);
  const [view, setView] = useState<PostureView>("front");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<PostureMetric[] | null>(null);
  const [summary, setSummary] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadHistory = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await api.admin.postureAssessments(token, patientId);
      setHistory(data);
    } catch {
      // sessizce geç
    }
  }, [patientId]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    api.admin
      .postureAssessments(token, patientId)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [patientId]);

  const drawResult = useCallback(
    (
      img: HTMLImageElement,
      landmarks: { x: number; y: number; visibility?: number }[],
      highlights: [number, number][],
      resultMetrics: PostureMetric[]
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scale = Math.min(1, MAX_CANVAS_WIDTH / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);

      const px = (i: number) => ({
        x: landmarks[i].x * w,
        y: landmarks[i].y * h,
      });

      // İnce iskelet
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = Math.max(1.5, w / 500);
      poseConnections().forEach(({ start, end }) => {
        const a = landmarks[start];
        const b = landmarks[end];
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      });

      // Anahtar noktalar
      ctx.fillStyle = "#38bdf8";
      const r = Math.max(2.5, w / 220);
      landmarks.forEach((l) => {
        if ((l.visibility ?? 1) < 0.3) return;
        ctx.beginPath();
        ctx.arc(l.x * w, l.y * h, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ölçüm çizgileri + açı etiketleri
      ctx.lineWidth = Math.max(2.5, w / 240);
      ctx.font = `${Math.max(12, Math.round(w / 42))}px sans-serif`;
      ctx.textBaseline = "middle";
      highlights.forEach(([s, e], idx) => {
        const a = px(s);
        const b = px(e);
        const m = resultMetrics[idx];
        const color =
          m?.status === "warn"
            ? "#f43f5e"
            : m?.status === "mild"
              ? "#f59e0b"
              : "#10b981";
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        if (m) {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const label = `${m.value}${m.unit}`;
          ctx.fillStyle = "rgba(15,23,42,0.78)";
          const tw = ctx.measureText(label).width + 10;
          const th = Math.max(16, Math.round(w / 34));
          ctx.fillRect(midX + 6, midY - th / 2, tw, th);
          ctx.fillStyle = "#fff";
          ctx.fillText(label, midX + 11, midY + 1);
        }
      });
    },
    []
  );

  const handleFile = async (file: File) => {
    setAnalyzing(true);
    setHasResult(false);
    setMetrics(null);
    const url = URL.createObjectURL(file);
    try {
      const img = new window.Image();
      img.src = url;
      await img.decode();

      const result = await analyzePosture(img, view);
      drawResult(img, result.landmarks, result.highlights, result.metrics);
      setMetrics(result.metrics);
      setSummary(result.summary);
      setHasResult(true);
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Analiz başarısız oldu.",
        "error"
      );
    } finally {
      URL.revokeObjectURL(url);
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    const token = getAccessToken();
    if (!canvas || !token || !metrics) return;

    setSaving(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("Görsel oluşturulamadı.");

      await api.admin.createPostureAssessment(token, patientId, {
        image: blob,
        view,
        metrics,
        summary,
      });
      onMessage("Postür analizi kaydedildi.", "success");
      setHasResult(false);
      setMetrics(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadHistory();
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Kayıt başarısız oldu.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assessmentId: number) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({
      title: "Analizi sil",
      message: "Bu analizi silmek istediğinize emin misiniz?",
      confirmLabel: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.admin.deletePostureAssessment(token, patientId, assessmentId);
      onMessage("Analiz silindi.", "success");
      await loadHistory();
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Analiz silinemedi.",
        "error"
      );
    }
  };

  return (
    <GlassCard className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        3D Postür Analizi
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Hastanın önden / yandan fotoğrafını yükleyin. Vücut noktaları cihazda
        (yapay zekâ ile) tespit edilir, duruş açıları hesaplanır. Fotoğraf
        sunucuya gönderilmez; yalnızca işaretlenmiş sonucu kaydedebilirsiniz.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormGroup label="Görünüm">
          <CustomSelect
            value={view}
            onChange={(v) => setView(v as PostureView)}
            className="w-full"
            options={VIEW_OPTIONS}
            aria-label="Fotoğraf görünümü"
          />
        </FormGroup>

        <FormGroup label="Fotoğraf">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={analyzing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 dark:text-slate-300"
          />
        </FormGroup>
      </div>

      {analyzing && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          Analiz ediliyor… (ilk çalıştırmada model indirilir)
        </div>
      )}

      <div className={`mt-5 grid gap-5 ${hasResult ? "lg:grid-cols-2" : ""}`}>
        <div
          className={`relative overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-900/5 dark:border-slate-600/50 ${
            hasResult ? "" : "hidden"
          }`}
        >
          <canvas ref={canvasRef} className="h-auto w-full" />
        </div>

        {hasResult && metrics && (
          <div className="space-y-3">
            {metrics.map((m) => {
              const s = STATUS_STYLES[m.status];
              return (
                <div
                  key={m.key}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/50 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-800/40"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {m.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {m.detail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      {m.value}
                      {m.unit}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${s.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Analizi Kaydet"}
            </button>
            <p className="text-center text-xs text-slate-400">
              Bu ölçümler bilgilendirme amaçlıdır; klinik tanı yerine geçmez.
            </p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-8 border-t border-slate-200/80 pt-5 dark:border-slate-600/50">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Geçmiş Analizler
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/50 dark:border-slate-600/50 dark:bg-slate-800/40"
              >
                {item.image_url && (
                  <div className="relative aspect-3/4 w-full bg-slate-900/5">
                    <Image
                      src={item.image_url}
                      alt={`Postür analizi — ${item.view_label}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      {item.view_label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.metrics?.map((m) => {
                      const s = STATUS_STYLES[m.status];
                      return (
                        <span
                          key={m.key}
                          className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700/60 ${s.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
                          />
                          {m.label}: {m.value}
                          {m.unit}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-xs font-medium text-rose-500 hover:text-rose-600"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
