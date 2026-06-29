"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { WeightChart } from "@/components/admin/WeightChart";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, type BodyMeasurement, type WellnessDashboard, type DietPlan } from "@/lib/api";
import { buildWeightStats } from "@/lib/weightStats";

/* ─── SVG body path (aynı olcumler sayfasından) ─── */
const BODY_PATH =
  "M104.265,117.959c-0.304,3.58,2.126,22.529,3.38,29.959c0.597,3.52,2.234,9.255,1.645,12.3c-0.841,4.244-1.084,9.736-0.621,12.934c0.292,1.942,1.211,10.899-0.104,14.175c-0.688,1.718-1.949,10.522-1.949,10.522c-3.285,8.294-1.431,7.886-1.431,7.886c1.017,1.248,2.759,0.098,2.759,0.098c1.327,0.846,2.246-0.201,2.246-0.201c1.139,0.943,2.467-0.116,2.467-0.116c1.431,0.743,2.758-0.627,2.758-0.627c0.822,0.414,1.023-0.109,1.023-0.109c2.466-0.158-1.376-8.05-1.376-8.05c-0.92-7.088,0.913-11.033,0.913-11.033c6.004-17.805,6.309-22.53,3.909-29.24c-0.676-1.937-0.847-2.704-0.536-3.545c0.719-1.941,0.195-9.748,1.072-12.848c1.692-5.979,3.361-21.142,4.231-28.217c1.169-9.53-4.141-22.308-4.141-22.308c-1.163-5.2,0.542-23.727,0.542-23.727c2.381,3.705,2.29,10.245,2.29,10.245c-0.378,6.859,5.541,17.342,5.541,17.342c2.844,4.332,3.921,8.442,3.921,8.747c0,1.248-0.273,4.269-0.273,4.269l0.109,2.631c0.049,0.67,0.426,2.977,0.365,4.092c-0.444,6.862,0.646,5.571,0.646,5.571c0.92,0,1.931-5.522,1.931-5.522c0,1.424-0.348,5.687,0.42,7.295c0.919,1.918,1.595-0.329,1.607-0.78c0.243-8.737,0.768-6.448,0.768-6.448c0.511,7.088,1.139,8.689,2.265,8.135c0.853-0.407,0.073-8.506,0.073-8.506c1.461,4.811,2.569,5.577,2.569,5.577c2.411,1.693,0.92-2.983,0.585-3.909c-1.784-4.92-1.839-6.625-1.839-6.625c2.229,4.421,3.909,4.257,3.909,4.257c2.174-0.694-1.9-6.954-4.287-9.953c-1.218-1.528-2.789-3.574-3.245-4.789c-0.743-2.058-1.304-8.674-1.304-8.674c-0.225-7.807-2.155-11.198-2.155-11.198c-3.3-5.282-3.921-15.135-3.921-15.135l-0.146-16.635c-1.157-11.347-9.518-11.429-9.518-11.429c-8.451-1.258-9.627-3.988-9.627-3.988c-1.79-2.576-0.767-7.514-0.767-7.514c1.485-1.208,2.058-4.415,2.058-4.415c2.466-1.891,2.345-4.658,1.206-4.628c-0.914,0.024-0.707-0.733-0.707-0.733C115.068,0.636,104.01,0,104.01,0h-1.688c0,0-11.063,0.636-9.523,13.089c0,0,0.207,0.758-0.715,0.733c-1.136-0.03-1.242,2.737,1.215,4.628c0,0,0.572,3.206,2.058,4.415c0,0,1.023,4.938-0.767,7.514c0,0-1.172,2.73-9.627,3.988c0,0-8.375,0.082-9.514,11.429l-0.158,16.635c0,0-0.609,9.853-3.922,15.135c0,0-1.921,3.392-2.143,11.198c0,0-0.563,6.616-1.303,8.674c-0.451,1.209-2.021,3.255-3.249,4.789c-2.408,2.993-6.455,9.24-4.29,9.953c0,0,1.689,0.164,3.909-4.257c0,0-0.046,1.693-1.827,6.625c-0.35,0.914-1.839,5.59,0.573,3.909c0,0,1.117-0.767,2.569-5.577c0,0-0.779,8.099,0.088,8.506c1.133,0.555,1.751-1.047,2.262-8.135c0,0,0.524-2.289,0.767,6.448c0.012,0.451,0.673,2.698,1.596,0.78c0.779-1.608,0.429-5.864,0.429-7.295c0,0,0.999,5.522,1.933,5.522c0,0,1.099,1.291,0.648-5.571c-0.073-1.121,0.32-3.422,0.369-4.092l0.106-2.631c0,0-0.274-3.014-0.274-4.269c0-0.311,1.078-4.415,3.921-8.747c0,0,5.913-10.488,5.532-17.342c0,0-0.082-6.54,2.299-10.245c0,0,1.69,18.526,0.545,23.727c0,0-5.319,12.778-4.146,22.308c0.864,7.094,2.53,22.237,4.226,28.217c0.886,3.094,0.362,10.899,1.072,12.848c0.32,0.847,0.152,1.627-0.536,3.545c-2.387,6.71-2.083,11.436,3.921,29.24c0,0,1.848,3.945,0.914,11.033c0,0-3.836,7.892-1.379,8.05c0,0,0.192,0.523,1.023,0.109c0,0,1.327,1.37,2.761,0.627c0,0,1.328,1.06,2.463,0.116c0,0,0.91,1.047,2.237,0.201c0,0,1.742,1.175,2.777-0.098c0,0,1.839,0.408-1.435-7.886c0,0-1.254-8.793-1.945-10.522c-1.318-3.275-0.387-12.251-0.106-14.175c0.453-3.216,0.21-8.695-0.618-12.934c-0.606-3.038,1.035-8.774,1.641-12.3c1.245-7.423,3.685-26.373,3.38-29.959l1.008,0.354C103.809,118.312,104.265,117.959,104.265,117.959z";

const L_POINTS = [
  { key: "omuz", dotX: 82, dotY: 44, label: "Omuz" },
  { key: "sol_kol", dotX: 79, dotY: 86, label: "Sol Kol" },
  { key: "gobek", dotX: 90, dotY: 132, label: "Göbek" },
  { key: "kalca", dotX: 86, dotY: 162, label: "Kalça" },
  { key: "sol_bacak", dotX: 89, dotY: 198, label: "Sol Bacak" },
];
const R_POINTS = [
  { key: "gogus", dotX: 120, dotY: 62, label: "Göğüs" },
  { key: "bel", dotX: 118, dotY: 114, label: "Bel" },
  { key: "alt_karin", dotX: 117, dotY: 138, label: "Alt Karın" },
  { key: "basen", dotX: 118, dotY: 162, label: "Basen" },
  { key: "sag_kol", dotX: 125, dotY: 86, label: "Sağ Kol" },
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
  return <path d={BODY_PATH} fill="#e2e8f0" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.08))" }} />;
}

function BodyWithLabels({ values, prevValues }: { values: MRecord; prevValues?: MRecord }) {
  function LLabel({ k, dotX, dotY, label }: { k: string; dotX: number; dotY: number; label: string }) {
    const v = values[k]; const d = prevValues ? diffNum(numVal(v), numVal(prevValues[k])) : null; const hasVal = v != null;
    return (
      <g>
        <line x1={dotX} y1={dotY} x2="18" y2={dotY} stroke="#cbd5e1" strokeWidth="0.7" />
        <text x="16" y={dotY - 5} textAnchor="end" fontSize="6.5" fill="#94a3b8">{label}</text>
        <text x="16" y={dotY + 5} textAnchor="end" fontSize="9" fontWeight="700" fill={hasVal ? "#059669" : "#94a3b8"}>{hasVal ? String(v) : "—"}</text>
        {d != null && Math.abs(d) >= 0.01 && <text x="16" y={dotY + 15} textAnchor="end" fontSize="6.5" fill={d < 0 ? "#10b981" : "#ef4444"}>{d < 0 ? "↓" : "↑"}{Math.abs(d).toFixed(1)}</text>}
        {hasVal && <circle cx={dotX} cy={dotY} r="7" fill="#10b981" opacity="0.12" />}
        <circle cx={dotX} cy={dotY} r={hasVal ? 4 : 2.5} fill={hasVal ? "#10b981" : "#94a3b8"} />
      </g>
    );
  }
  function RLabel({ k, dotX, dotY, label }: { k: string; dotX: number; dotY: number; label: string }) {
    const v = values[k]; const d = prevValues ? diffNum(numVal(v), numVal(prevValues[k])) : null; const hasVal = v != null;
    return (
      <g>
        <line x1={dotX} y1={dotY} x2="190" y2={dotY} stroke="#cbd5e1" strokeWidth="0.7" />
        <text x="192" y={dotY - 5} textAnchor="start" fontSize="6.5" fill="#94a3b8">{label}</text>
        <text x="192" y={dotY + 5} textAnchor="start" fontSize="9" fontWeight="700" fill={hasVal ? "#059669" : "#94a3b8"}>{hasVal ? String(v) : "—"}</text>
        {d != null && Math.abs(d) >= 0.01 && <text x="192" y={dotY + 15} textAnchor="start" fontSize="6.5" fill={d < 0 ? "#10b981" : "#ef4444"}>{d < 0 ? "↓" : "↑"}{Math.abs(d).toFixed(1)}</text>}
        {hasVal && <circle cx={dotX} cy={dotY} r="7" fill="#10b981" opacity="0.12" />}
        <circle cx={dotX} cy={dotY} r={hasVal ? 4 : 2.5} fill={hasVal ? "#10b981" : "#94a3b8"} />
      </g>
    );
  }
  return (
    <svg viewBox="-30 0 260 230" className="w-full select-none">
      <BodyShape />
      {values.weight != null && <text x="103" y="8" textAnchor="middle" fontSize="7" fontWeight="700" fill="#059669">{values.weight} kg</text>}
      {L_POINTS.map((p) => <LLabel key={p.key} k={p.key} dotX={p.dotX} dotY={p.dotY} label={p.label} />)}
      {R_POINTS.map((p) => <RLabel key={p.key} k={p.key} dotX={p.dotX} dotY={p.dotY} label={p.label} />)}
    </svg>
  );
}

function toRecord(m: BodyMeasurement): MRecord {
  return { weight: numVal(m.weight), gogus: numVal(m.gogus), omuz: numVal(m.omuz), bel: numVal(m.bel), gobek: numVal(m.gobek), alt_karin: numVal(m.alt_karin), kalca: numVal(m.kalca), basen: numVal(m.basen), sag_bacak: numVal(m.sag_bacak), sol_bacak: numVal(m.sol_bacak), sag_kol: numVal(m.sag_kol), sol_kol: numVal(m.sol_kol), yag_orani: numVal(m.yag_orani) };
}

const MEAL_ORDER = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack"];

export default function RaporPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wellness, setWellness] = useState<WellnessDashboard | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [diets, setDiets] = useState<DietPlan[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    Promise.all([
      api.wellness.dashboard(token).catch(() => null),
      api.measurements.list(token).catch(() => []),
      api.myDiets.list(token).catch(() => []),
    ]).then(([w, m, d]) => {
      setWellness(w);
      setMeasurements(m as BodyMeasurement[]);
      setDiets(d as DietPlan[]);
    }).finally(() => setLoading(false));
  }, []);

  const latestMeasurement = measurements[0];
  const prevMeasurement = measurements[1];
  const activeExercises = (wellness?.exercises ?? []).filter((e) => e.is_active && e.exercise);
  const weightHistory = (wellness?.weight_history ?? []).map((e, i) => ({ id: i, weight: e.weight, recorded_at: e.recorded_at }));
  const weightStats = buildWeightStats(weightHistory, latestMeasurement ? numVal(latestMeasurement.weight) : null);
  const activeDiets = diets.filter((d) => d.is_active).sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type));

  const fullName = user ? `${(user as { first_name?: string }).first_name ?? ""} ${(user as { last_name?: string }).last_name ?? ""}`.trim() || user.username : "";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside, header, nav, footer { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; background: white !important; border-radius: 8px; margin-bottom: 16px; padding: 16px; }
          .print-break { break-before: page; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Başlık + PDF butonu */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Raporum</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Ölçüm, egzersiz ve diyet özetinizi PDF olarak indirin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PDF İndir
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
          </div>
        )}

        {!loading && (
          <>
            {/* Rapor başlığı (print'te görünür) */}
            <GlassCard className="print-card p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">JFS Method — Hasta Raporu</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{fullName || "Hasta"}</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500">Aktif Egzersiz</p>
                  <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100">{activeExercises.length}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500">Diyet Öğünü</p>
                  <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100">{activeDiets.length}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500">Toplam Kalori</p>
                  <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100">
                    {activeDiets.reduce((s, d) => s + (d.total_calories ?? 0), 0)} kcal
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Son ölçümler */}
            {latestMeasurement && (
              <GlassCard className="print-card p-5 sm:p-6">
                <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-50">Son Vücut Ölçümleri</h3>
                <p className="mb-4 text-xs text-slate-500">
                  {new Date(latestMeasurement.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  {latestMeasurement.label ? ` — ${latestMeasurement.label}` : ""}
                </p>
                <div className="mx-auto max-w-sm">
                  <BodyWithLabels values={toRecord(latestMeasurement)} prevValues={prevMeasurement ? toRecord(prevMeasurement) : undefined} />
                </div>
              </GlassCard>
            )}

            {/* Kilo trendi */}
            {(weightStats.history?.length ?? 0) >= 2 && (
              <GlassCard className="print-card p-5 sm:p-6">
                <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Kilo Trendi</h3>
                <WeightChart stats={weightStats} />
              </GlassCard>
            )}

            {/* Aktif egzersizler */}
            {activeExercises.length > 0 && (
              <GlassCard className="print-card p-5 sm:p-6">
                <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Egzersiz Programı</h3>
                <div className="space-y-2">
                  {activeExercises.map((a) => (
                    <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-700/50">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.exercise.title}</p>
                        {a.therapist_note && <p className="mt-0.5 text-xs text-slate-500">{a.therapist_note}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {a.exercise.sets} set × {a.exercise.reps} tekrar
                        </p>
                        <p className="text-xs text-slate-400">{a.frequency_label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Diyet planı */}
            {activeDiets.length > 0 && (
              <GlassCard className="print-card p-5 sm:p-6">
                <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Diyet Planı</h3>
                <div className="space-y-3">
                  {activeDiets.map((plan) => (
                    <div key={plan.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.meal_type_label}</p>
                        <span className="text-xs text-slate-500">{plan.total_calories} kcal</span>
                      </div>
                      {plan.title && <p className="mt-0.5 text-xs text-slate-500">{plan.title}</p>}
                      <ul className="mt-2 space-y-1">
                        {plan.plan_items.map((item) => (
                          <li key={item.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                            <span>{item.diet_item.name}</span>
                            <span>{item.quantity} {item.diet_item.portion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {!latestMeasurement && activeExercises.length === 0 && activeDiets.length === 0 && (
              <GlassCard className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Henüz raporlanacak veri yok. Terapistiniz program ekledikçe burada görünecek.
              </GlassCard>
            )}
          </>
        )}
      </div>
    </>
  );
}
