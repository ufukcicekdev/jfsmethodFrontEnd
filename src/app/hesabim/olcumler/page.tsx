"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type BodyMeasurement, type PatientProfile } from "@/lib/api";

/* ─── SVG body path ─────────────────────────────────────── */
const BODY_PATH =
  "M104.265,117.959c-0.304,3.58,2.126,22.529,3.38,29.959c0.597,3.52,2.234,9.255,1.645,12.3c-0.841,4.244-1.084,9.736-0.621,12.934c0.292,1.942,1.211,10.899-0.104,14.175c-0.688,1.718-1.949,10.522-1.949,10.522c-3.285,8.294-1.431,7.886-1.431,7.886c1.017,1.248,2.759,0.098,2.759,0.098c1.327,0.846,2.246-0.201,2.246-0.201c1.139,0.943,2.467-0.116,2.467-0.116c1.431,0.743,2.758-0.627,2.758-0.627c0.822,0.414,1.023-0.109,1.023-0.109c2.466-0.158-1.376-8.05-1.376-8.05c-0.92-7.088,0.913-11.033,0.913-11.033c6.004-17.805,6.309-22.53,3.909-29.24c-0.676-1.937-0.847-2.704-0.536-3.545c0.719-1.941,0.195-9.748,1.072-12.848c1.692-5.979,3.361-21.142,4.231-28.217c1.169-9.53-4.141-22.308-4.141-22.308c-1.163-5.2,0.542-23.727,0.542-23.727c2.381,3.705,2.29,10.245,2.29,10.245c-0.378,6.859,5.541,17.342,5.541,17.342c2.844,4.332,3.921,8.442,3.921,8.747c0,1.248-0.273,4.269-0.273,4.269l0.109,2.631c0.049,0.67,0.426,2.977,0.365,4.092c-0.444,6.862,0.646,5.571,0.646,5.571c0.92,0,1.931-5.522,1.931-5.522c0,1.424-0.348,5.687,0.42,7.295c0.919,1.918,1.595-0.329,1.607-0.78c0.243-8.737,0.768-6.448,0.768-6.448c0.511,7.088,1.139,8.689,2.265,8.135c0.853-0.407,0.073-8.506,0.073-8.506c1.461,4.811,2.569,5.577,2.569,5.577c2.411,1.693,0.92-2.983,0.585-3.909c-1.784-4.92-1.839-6.625-1.839-6.625c2.229,4.421,3.909,4.257,3.909,4.257c2.174-0.694-1.9-6.954-4.287-9.953c-1.218-1.528-2.789-3.574-3.245-4.789c-0.743-2.058-1.304-8.674-1.304-8.674c-0.225-7.807-2.155-11.198-2.155-11.198c-3.3-5.282-3.921-15.135-3.921-15.135l-0.146-16.635c-1.157-11.347-9.518-11.429-9.518-11.429c-8.451-1.258-9.627-3.988-9.627-3.988c-1.79-2.576-0.767-7.514-0.767-7.514c1.485-1.208,2.058-4.415,2.058-4.415c2.466-1.891,2.345-4.658,1.206-4.628c-0.914,0.024-0.707-0.733-0.707-0.733C115.068,0.636,104.01,0,104.01,0h-1.688c0,0-11.063,0.636-9.523,13.089c0,0,0.207,0.758-0.715,0.733c-1.136-0.03-1.242,2.737,1.215,4.628c0,0,0.572,3.206,2.058,4.415c0,0,1.023,4.938-0.767,7.514c0,0-1.172,2.73-9.627,3.988c0,0-8.375,0.082-9.514,11.429l-0.158,16.635c0,0-0.609,9.853-3.922,15.135c0,0-1.921,3.392-2.143,11.198c0,0-0.563,6.616-1.303,8.674c-0.451,1.209-2.021,3.255-3.249,4.789c-2.408,2.993-6.455,9.24-4.29,9.953c0,0,1.689,0.164,3.909-4.257c0,0-0.046,1.693-1.827,6.625c-0.35,0.914-1.839,5.59,0.573,3.909c0,0,1.117-0.767,2.569-5.577c0,0-0.779,8.099,0.088,8.506c1.133,0.555,1.751-1.047,2.262-8.135c0,0,0.524-2.289,0.767,6.448c0.012,0.451,0.673,2.698,1.596,0.78c0.779-1.608,0.429-5.864,0.429-7.295c0,0,0.999,5.522,1.933,5.522c0,0,1.099,1.291,0.648-5.571c-0.073-1.121,0.32-3.422,0.369-4.092l0.106-2.631c0,0-0.274-3.014-0.274-4.269c0-0.311,1.078-4.415,3.921-8.747c0,0,5.913-10.488,5.532-17.342c0,0-0.082-6.54,2.299-10.245c0,0,1.69,18.526,0.545,23.727c0,0-5.319,12.778-4.146,22.308c0.864,7.094,2.53,22.237,4.226,28.217c0.886,3.094,0.362,10.899,1.072,12.848c0.32,0.847,0.152,1.627-0.536,3.545c-2.387,6.71-2.083,11.436,3.921,29.24c0,0,1.848,3.945,0.914,11.033c0,0-3.836,7.892-1.379,8.05c0,0,0.192,0.523,1.023,0.109c0,0,1.327,1.37,2.761,0.627c0,0,1.328,1.06,2.463,0.116c0,0,0.91,1.047,2.237,0.201c0,0,1.742,1.175,2.777-0.098c0,0,1.839,0.408-1.435-7.886c0,0-1.254-8.793-1.945-10.522c-1.318-3.275-0.387-12.251-0.106-14.175c0.453-3.216,0.21-8.695-0.618-12.934c-0.606-3.038,1.035-8.774,1.641-12.3c1.245-7.423,3.685-26.373,3.38-29.959l1.008,0.354C103.809,118.312,104.265,117.959,104.265,117.959z";

/* ─── dot positions ─────────────────────────────────────── */
const L_POINTS = [
  { key: "omuz",      dotX: 82,  dotY: 44,  label: "Omuz"      },
  { key: "sol_kol",   dotX: 79,  dotY: 86,  label: "Sol Kol"   },
  { key: "gobek",     dotX: 90,  dotY: 132, label: "Göbek"     },
  { key: "kalca",     dotX: 86,  dotY: 162, label: "Kalça"     },
  { key: "sol_bacak", dotX: 89,  dotY: 198, label: "Sol Bacak" },
];
const R_POINTS = [
  { key: "gogus",     dotX: 120, dotY: 62,  label: "Göğüs"    },
  { key: "bel",       dotX: 118, dotY: 114, label: "Bel"       },
  { key: "alt_karin", dotX: 117, dotY: 138, label: "Alt Karın" },
  { key: "basen",     dotX: 118, dotY: 162, label: "Basen"     },
  { key: "sag_kol",   dotX: 125, dotY: 86,  label: "Sağ Kol"  },
  { key: "sag_bacak", dotX: 116, dotY: 198, label: "Sağ Bacak" },
];

type MRecord = Record<string, number | null | undefined>;

function numVal(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function diffNum(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return +(a - b).toFixed(1);
}

function BodyShape() {
  return (
    <path
      d={BODY_PATH}
      className="fill-slate-200 dark:fill-slate-600"
      style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.08))" }}
    />
  );
}

function BodyWithLabels({ values, prevValues }: { values: MRecord; prevValues?: MRecord }) {
  function LLabel({ k, dotX, dotY, label }: { k: string; dotX: number; dotY: number; label: string }) {
    const v = values[k];
    const d = prevValues ? diffNum(numVal(v), numVal(prevValues[k])) : null;
    const hasVal = v != null;
    return (
      <g>
        <line x1={dotX} y1={dotY} x2="18" y2={dotY} stroke="#cbd5e1" strokeWidth="0.7" />
        <text x="16" y={dotY - 5} textAnchor="end" fontSize="6.5" fill="#94a3b8">{label}</text>
        <text x="16" y={dotY + 5} textAnchor="end" fontSize="9" fontWeight="700"
          fill={hasVal ? "#059669" : "#94a3b8"}>{hasVal ? String(v) : "—"}</text>
        {d != null && Math.abs(d) >= 0.01 && (
          <text x="16" y={dotY + 15} textAnchor="end" fontSize="6.5"
            fill={d < 0 ? "#10b981" : "#ef4444"}>{d < 0 ? "↓" : "↑"}{Math.abs(d).toFixed(1)}</text>
        )}
        {hasVal && <circle cx={dotX} cy={dotY} r="7" fill="#10b981" opacity="0.12" />}
        <circle cx={dotX} cy={dotY} r={hasVal ? 4 : 2.5} fill={hasVal ? "#10b981" : "#94a3b8"} />
      </g>
    );
  }
  function RLabel({ k, dotX, dotY, label }: { k: string; dotX: number; dotY: number; label: string }) {
    const v = values[k];
    const d = prevValues ? diffNum(numVal(v), numVal(prevValues[k])) : null;
    const hasVal = v != null;
    return (
      <g>
        <line x1={dotX} y1={dotY} x2="190" y2={dotY} stroke="#cbd5e1" strokeWidth="0.7" />
        <text x="192" y={dotY - 5} textAnchor="start" fontSize="6.5" fill="#94a3b8">{label}</text>
        <text x="192" y={dotY + 5} textAnchor="start" fontSize="9" fontWeight="700"
          fill={hasVal ? "#059669" : "#94a3b8"}>{hasVal ? String(v) : "—"}</text>
        {d != null && Math.abs(d) >= 0.01 && (
          <text x="192" y={dotY + 15} textAnchor="start" fontSize="6.5"
            fill={d < 0 ? "#10b981" : "#ef4444"}>{d < 0 ? "↓" : "↑"}{Math.abs(d).toFixed(1)}</text>
        )}
        {hasVal && <circle cx={dotX} cy={dotY} r="7" fill="#10b981" opacity="0.12" />}
        <circle cx={dotX} cy={dotY} r={hasVal ? 4 : 2.5} fill={hasVal ? "#10b981" : "#94a3b8"} />
      </g>
    );
  }
  return (
    <svg viewBox="-30 0 260 230" className="w-full select-none">
      <BodyShape />
      {values.weight != null && (
        <text x="103" y="8" textAnchor="middle" fontSize="7" fontWeight="700" fill="#059669">
          {values.weight} kg
        </text>
      )}
      {L_POINTS.map(p => <LLabel key={p.key} k={p.key} dotX={p.dotX} dotY={p.dotY} label={p.label} />)}
      {R_POINTS.map(p => <RLabel key={p.key} k={p.key} dotX={p.dotX} dotY={p.dotY} label={p.label} />)}
    </svg>
  );
}

function toRecord(m: BodyMeasurement): MRecord {
  return {
    weight: numVal(m.weight),
    gogus: numVal(m.gogus),
    omuz: numVal(m.omuz),
    bel: numVal(m.bel),
    gobek: numVal(m.gobek),
    alt_karin: numVal(m.alt_karin),
    kalca: numVal(m.kalca),
    basen: numVal(m.basen),
    sag_bacak: numVal(m.sag_bacak),
    sol_bacak: numVal(m.sol_bacak),
    sag_kol: numVal(m.sag_kol),
    sol_kol: numVal(m.sol_kol),
    yag_orani: numVal(m.yag_orani),
  };
}

const EXTRA_FIELDS = [
  { key: "weight",    label: "Kilo",      unit: "kg" },
  { key: "yag_orani", label: "Yağ Oranı", unit: "%"  },
  { key: "bel",       label: "Bel",       unit: "cm" },
  { key: "basen",     label: "Basen",     unit: "cm" },
];

const TREND_METRICS = [
  { key: "weight",    label: "Kilo",      unit: "kg" },
  { key: "bel",       label: "Bel",       unit: "cm" },
  { key: "kalca",     label: "Kalça",     unit: "cm" },
  { key: "gogus",     label: "Göğüs",     unit: "cm" },
  { key: "yag_orani", label: "Yağ %",     unit: "%"  },
];

function MeasurementTrendChart({
  measurements,
  metricKey,
  unit,
  goalValue,
}: {
  measurements: BodyMeasurement[];
  metricKey: string;
  unit: string;
  goalValue?: number | null;
}) {
  const points = useMemo(() => {
    return [...measurements]
      .reverse()
      .map((m) => ({
        date: m.date,
        label: m.label,
        value: numVal((m as unknown as Record<string, unknown>)[metricKey]),
      }))
      .filter((p) => p.value != null) as { date: string; label: string; value: number }[];
  }, [measurements, metricKey]);

  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
        Grafik için en az 2 ölçüm kaydı gerekir.
      </p>
    );
  }

  const values = points.map((p) => p.value);
  const allVals = goalValue != null ? [...values, goalValue] : values;
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const W = 600;
  const H = 180;
  const PAD = 32;

  const pts = points.map((p, i) => ({
    x: PAD + (i / (points.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((p.value - min) / range) * (H - PAD * 2),
    ...p,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`;
  const last = pts[pts.length - 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[280px]">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Yatay kılavuz çizgileri */}
        {[0, 0.5, 1].map((t) => {
          const y = H - PAD - t * (H - PAD * 2);
          const val = (min + t * range).toFixed(1);
          return (
            <g key={t}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{val}</text>
            </g>
          );
        })}
        {/* Hedef çizgisi */}
        {goalValue != null && (() => {
          const gy = H - PAD - ((goalValue - min) / range) * (H - PAD * 2);
          return (
            <g>
              <line x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
              <text x={W - PAD + 4} y={gy + 4} fontSize="9" fill="#f59e0b">Hedef {goalValue}{unit}</text>
            </g>
          );
        })()}
        {/* Alan */}
        <path d={areaPath} fill="url(#trendGrad)" />
        {/* Çizgi */}
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Noktalar */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#10b981" />
            <circle cx={p.x} cy={p.y} r="7" fill="#10b981" fillOpacity="0.12" />
          </g>
        ))}
        {/* Son değer balonu */}
        <rect x={last.x - 28} y={last.y - 22} width="56" height="18" rx="9" fill="#10b981" />
        <text x={last.x} y={last.y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
          {last.value} {unit}
        </text>
        {/* X ekseni tarihleri */}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {new Date(p.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
          </text>
        ))}
      </svg>
    </div>
  );
}

const METRIC_TO_GOAL: Record<string, keyof PatientProfile> = {
  weight: "target_weight",
  bel: "target_waist",
  kalca: "target_hip",
  gogus: "target_chest",
  yag_orani: "target_body_fat",
};

export default function OlcumlerPage() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [trendMetric, setTrendMetric] = useState("weight");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    Promise.all([api.measurements.list(token), api.profile.get(token)])
      .then(([data, profileData]) => {
        setMeasurements(data);
        setProfile(profileData);
        setSelectedIdx(0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  const selected = measurements[selectedIdx];
  const prev = measurements[selectedIdx + 1];

  return (
    <>
      <style>{`
        @media print {
          aside, header, nav, .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
              Ölçümlerim
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Terapistiniz tarafından kaydedilen vücut ölçümleriniz.
            </p>
          </div>
          {measurements.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print shrink-0 rounded-full border border-slate-300 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Yazdır
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        )}

        {error && (
          <GlassCard className="p-4 text-sm text-red-700 dark:text-red-400">{error}</GlassCard>
        )}

        {!loading && !error && measurements.length === 0 && (
          <GlassCard className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Henüz kaydedilmiş ölçüm bulunmuyor.
          </GlassCard>
        )}

        {!loading && measurements.length > 0 && selected && (
          <>
            {/* Oturum seçici */}
            {measurements.length > 1 && (
              <div className="no-print flex gap-2 overflow-x-auto pb-1">
                {measurements.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedIdx(i)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      i === selectedIdx
                        ? "bg-emerald-500 text-white shadow-md"
                        : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300"
                    }`}
                  >
                    {m.label || new Date(m.date).toLocaleDateString("tr-TR")}
                  </button>
                ))}
              </div>
            )}

            {/* Trend grafiği */}
            {measurements.length >= 2 && (
              <GlassCard className="p-5 no-print">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Trend Grafiği</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TREND_METRICS.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setTrendMetric(m.key)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          trendMetric === m.key
                            ? "bg-emerald-500 text-white"
                            : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <MeasurementTrendChart
                  measurements={measurements}
                  metricKey={trendMetric}
                  unit={TREND_METRICS.find((m) => m.key === trendMetric)?.unit ?? ""}
                  goalValue={profile ? (profile[METRIC_TO_GOAL[trendMetric]] as number | null | undefined) : null}
                />
              </GlassCard>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* SVG vücut görseli */}
              <GlassCard className="p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {selected.label || "Ölçüm"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(selected.date).toLocaleDateString("tr-TR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  {prev && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      Önceki: {prev.label || new Date(prev.date).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </div>
                <BodyWithLabels values={toRecord(selected)} prevValues={prev ? toRecord(prev) : undefined} />
              </GlassCard>

              {/* Özet kartlar */}
              <div className="flex flex-col gap-4">
                <GlassCard className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Özet Değerler
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {EXTRA_FIELDS.map((f) => {
                      const cur = numVal((selected as unknown as Record<string, unknown>)[f.key]);
                      const prv = prev ? numVal((prev as unknown as Record<string, unknown>)[f.key]) : null;
                      const d = diffNum(cur, prv);
                      return (
                        <div key={f.key} className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/60">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{f.label}</p>
                          <p className="mt-0.5 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {cur != null ? `${cur} ${f.unit}` : "—"}
                          </p>
                          {d != null && Math.abs(d) >= 0.01 && (
                            <p className={`mt-0.5 text-xs font-semibold ${d < 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {d < 0 ? "↓" : "↑"} {Math.abs(d).toFixed(1)} {f.unit}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

                {/* Tüm değerler listesi */}
                <GlassCard className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tüm Ölçümler
                  </p>
                  <div className="space-y-2">
                    {[...L_POINTS, ...R_POINTS].map((p) => {
                      const cur = numVal((selected as unknown as Record<string, unknown>)[p.key]);
                      const prv = prev ? numVal((prev as unknown as Record<string, unknown>)[p.key]) : null;
                      const d = diffNum(cur, prv);
                      return (
                        <div key={p.key} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-300">{p.label}</span>
                          <div className="flex items-center gap-2">
                            {d != null && Math.abs(d) >= 0.01 && (
                              <span className={`text-xs font-semibold ${d < 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {d < 0 ? "↓" : "↑"}{Math.abs(d).toFixed(1)}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {cur != null ? `${cur} cm` : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
