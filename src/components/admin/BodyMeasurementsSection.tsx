"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type BodyMeasurement } from "@/lib/api";

/* ─── fields ─────────────────────────────────────────────── */
const FIELDS = [
  { key: "weight",    label: "Kilo",      unit: "kg" },
  { key: "gogus",     label: "Göğüs",     unit: "cm" },
  { key: "omuz",      label: "Omuz",      unit: "cm" },
  { key: "bel",       label: "Bel",       unit: "cm" },
  { key: "gobek",     label: "Göbek",     unit: "cm" },
  { key: "alt_karin", label: "Alt Karın", unit: "cm" },
  { key: "kalca",     label: "Kalça",     unit: "cm" },
  { key: "basen",     label: "Basen",     unit: "cm" },
  { key: "sag_bacak", label: "Sağ Bacak", unit: "cm" },
  { key: "sol_bacak", label: "Sol Bacak", unit: "cm" },
  { key: "sag_kol",   label: "Sağ Kol",   unit: "cm" },
  { key: "sol_kol",   label: "Sol Kol",   unit: "cm" },
  { key: "yag_orani", label: "Yağ Oranı", unit: "%" },
] as const;

type MKey = typeof FIELDS[number]["key"];
const fieldMeta = Object.fromEntries(FIELDS.map(f => [f.key, f])) as Record<MKey, { key: MKey; label: string; unit: string }>;
type FormValues = Partial<Record<MKey, string>>;

/* ─── body measurement dot positions (body viewBox ~55..155 x 0..218) ── */
// The real SVG path is centered around x≈103, y: 0→218
const L_POINTS = [
  { key: "omuz"      as MKey, dotX: 82,  dotY: 44,  label: "Omuz"      },
  { key: "sol_kol"   as MKey, dotX: 79,  dotY: 86,  label: "Sol Kol"   },
  { key: "gobek"     as MKey, dotX: 90,  dotY: 132, label: "Göbek"     },
  { key: "kalca"     as MKey, dotX: 86,  dotY: 162, label: "Kalça"     },
  { key: "sol_bacak" as MKey, dotX: 89,  dotY: 198, label: "Sol Bacak" },
];
const R_POINTS = [
  { key: "gogus"     as MKey, dotX: 120, dotY: 62,  label: "Göğüs"    },
  { key: "bel"       as MKey, dotX: 118, dotY: 114, label: "Bel"       },
  { key: "alt_karin" as MKey, dotX: 117, dotY: 138, label: "Alt Karın" },
  { key: "basen"     as MKey, dotX: 118, dotY: 162, label: "Basen"     },
  { key: "sag_kol"   as MKey, dotX: 125, dotY: 86,  label: "Sağ Kol"  },
  { key: "sag_bacak" as MKey, dotX: 116, dotY: 198, label: "Sağ Bacak" },
];
const ALL_POINTS = [...L_POINTS, ...R_POINTS];

/* ─── helpers ────────────────────────────────────────────── */
function numVal(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v); return isNaN(n) ? null : n;
}
function diffNum(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || b == null) return null; return a - b;
}
function pctNum(c: number | null, f: number | null) {
  if (c == null || f == null || f === 0) return null; return ((c - f) / f) * 100;
}
function mVal(m: BodyMeasurement, k: string): number | null {
  return (m as unknown as Record<string, number | null>)[k] ?? null;
}

function TrendBadge({ d, unit = "" }: { d: number | null; unit?: string }) {
  if (d == null || Math.abs(d) < 0.01) return null;
  const down = d < 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${down ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"}`}>
      {down ? "↓" : "↑"}{Math.abs(d).toFixed(1)}{unit}
    </span>
  );
}

/* ─── SVG body silhouette (real path from svgrepo.com/show/76394) ── */
// Original viewBox approx 55..155 x 0..218, centered around x=103
const BODY_PATH = `M104.265,117.959c-0.304,3.58,2.126,22.529,3.38,29.959c0.597,3.52,2.234,9.255,1.645,12.3
c-0.841,4.244-1.084,9.736-0.621,12.934c0.292,1.942,1.211,10.899-0.104,14.175c-0.688,1.718-1.949,10.522-1.949,10.522
c-3.285,8.294-1.431,7.886-1.431,7.886c1.017,1.248,2.759,0.098,2.759,0.098c1.327,0.846,2.246-0.201,2.246-0.201
c1.139,0.943,2.467-0.116,2.467-0.116c1.431,0.743,2.758-0.627,2.758-0.627c0.822,0.414,1.023-0.109,1.023-0.109
c2.466-0.158-1.376-8.05-1.376-8.05c-0.92-7.088,0.913-11.033,0.913-11.033c6.004-17.805,6.309-22.53,3.909-29.24
c-0.676-1.937-0.847-2.704-0.536-3.545c0.719-1.941,0.195-9.748,1.072-12.848c1.692-5.979,3.361-21.142,4.231-28.217
c1.169-9.53-4.141-22.308-4.141-22.308c-1.163-5.2,0.542-23.727,0.542-23.727c2.381,3.705,2.29,10.245,2.29,10.245
c-0.378,6.859,5.541,17.342,5.541,17.342c2.844,4.332,3.921,8.442,3.921,8.747c0,1.248-0.273,4.269-0.273,4.269l0.109,2.631
c0.049,0.67,0.426,2.977,0.365,4.092c-0.444,6.862,0.646,5.571,0.646,5.571c0.92,0,1.931-5.522,1.931-5.522
c0,1.424-0.348,5.687,0.42,7.295c0.919,1.918,1.595-0.329,1.607-0.78c0.243-8.737,0.768-6.448,0.768-6.448
c0.511,7.088,1.139,8.689,2.265,8.135c0.853-0.407,0.073-8.506,0.073-8.506c1.461,4.811,2.569,5.577,2.569,5.577
c2.411,1.693,0.92-2.983,0.585-3.909c-1.784-4.92-1.839-6.625-1.839-6.625c2.229,4.421,3.909,4.257,3.909,4.257
c2.174-0.694-1.9-6.954-4.287-9.953c-1.218-1.528-2.789-3.574-3.245-4.789c-0.743-2.058-1.304-8.674-1.304-8.674
c-0.225-7.807-2.155-11.198-2.155-11.198c-3.3-5.282-3.921-15.135-3.921-15.135l-0.146-16.635
c-1.157-11.347-9.518-11.429-9.518-11.429c-8.451-1.258-9.627-3.988-9.627-3.988c-1.79-2.576-0.767-7.514-0.767-7.514
c1.485-1.208,2.058-4.415,2.058-4.415c2.466-1.891,2.345-4.658,1.206-4.628c-0.914,0.024-0.707-0.733-0.707-0.733
C115.068,0.636,104.01,0,104.01,0h-1.688c0,0-11.063,0.636-9.523,13.089c0,0,0.207,0.758-0.715,0.733
c-1.136-0.03-1.242,2.737,1.215,4.628c0,0,0.572,3.206,2.058,4.415c0,0,1.023,4.938-0.767,7.514c0,0-1.172,2.73-9.627,3.988
c0,0-8.375,0.082-9.514,11.429l-0.158,16.635c0,0-0.609,9.853-3.922,15.135c0,0-1.921,3.392-2.143,11.198
c0,0-0.563,6.616-1.303,8.674c-0.451,1.209-2.021,3.255-3.249,4.789c-2.408,2.993-6.455,9.24-4.29,9.953
c0,0,1.689,0.164,3.909-4.257c0,0-0.046,1.693-1.827,6.625c-0.35,0.914-1.839,5.59,0.573,3.909c0,0,1.117-0.767,2.569-5.577
c0,0-0.779,8.099,0.088,8.506c1.133,0.555,1.751-1.047,2.262-8.135c0,0,0.524-2.289,0.767,6.448
c0.012,0.451,0.673,2.698,1.596,0.78c0.779-1.608,0.429-5.864,0.429-7.295c0,0,0.999,5.522,1.933,5.522
c0,0,1.099,1.291,0.648-5.571c-0.073-1.121,0.32-3.422,0.369-4.092l0.106-2.631c0,0-0.274-3.014-0.274-4.269
c0-0.311,1.078-4.415,3.921-8.747c0,0,5.913-10.488,5.532-17.342c0,0-0.082-6.54,2.299-10.245c0,0,1.69,18.526,0.545,23.727
c0,0-5.319,12.778-4.146,22.308c0.864,7.094,2.53,22.237,4.226,28.217c0.886,3.094,0.362,10.899,1.072,12.848
c0.32,0.847,0.152,1.627-0.536,3.545c-2.387,6.71-2.083,11.436,3.921,29.24c0,0,1.848,3.945,0.914,11.033
c0,0-3.836,7.892-1.379,8.05c0,0,0.192,0.523,1.023,0.109c0,0,1.327,1.37,2.761,0.627c0,0,1.328,1.06,2.463,0.116
c0,0,0.91,1.047,2.237,0.201c0,0,1.742,1.175,2.777-0.098c0,0,1.839,0.408-1.435-7.886c0,0-1.254-8.793-1.945-10.522
c-1.318-3.275-0.387-12.251-0.106-14.175c0.453-3.216,0.21-8.695-0.618-12.934c-0.606-3.038,1.035-8.774,1.641-12.3
c1.245-7.423,3.685-26.373,3.38-29.959l1.008,0.354C103.809,118.312,104.265,117.959,104.265,117.959z`;

function BodyShape() {
  return (
    <path
      d={BODY_PATH}
      className="fill-slate-200 dark:fill-slate-600"
      style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.08))" }}
    />
  );
}

/* ─── body SVG: dots only (card size) ───────────────────── */
function BodyDotsOnly({
  values, activeKey,
}: {
  values: Record<string, number | null | undefined>;
  activeKey?: string;
}) {
  return (
    <svg viewBox="60 0 88 220" className="w-full select-none">
      <BodyShape />
      {ALL_POINTS.map(p => {
        const v = values[p.key];
        const hasVal = v != null;
        const isActive = p.key === activeKey;
        return (
          <g key={p.key}>
            {isActive && (
              <circle cx={p.dotX} cy={p.dotY} r="7" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
            )}
            {hasVal && <circle cx={p.dotX} cy={p.dotY} r="7" fill="#10b981" opacity="0.15" />}
            <circle
              cx={p.dotX} cy={p.dotY} r={hasVal ? 4 : 2.5}
              fill={hasVal ? "#10b981" : "#94a3b8"}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ─── body SVG: with side labels (expand modal) ─────────── */
function BodyWithLabels({
  values, prevValues,
}: {
  values: Record<string, number | null | undefined>;
  prevValues?: Record<string, number | null | undefined>;
}) {
  // Extra horizontal space for labels: viewBox "-45 0 190 252"
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
    <svg viewBox="5 0 198 220" className="w-full select-none">
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

/* ─── custom dropdown ────────────────────────────────────── */
function MeasurementDropdown({
  selected, entered, onChange,
}: {
  selected: MKey;
  entered: Set<MKey>;
  onChange: (k: MKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const meta = fieldMeta[selected];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex h-[42px] min-w-[160px] items-center justify-between gap-2 rounded-xl border border-white/30 bg-white/70 px-3.5 text-sm font-medium text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-emerald-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-600/50 dark:bg-slate-800/70 dark:text-slate-100"
      >
        <div className="flex items-center gap-2">
          {entered.has(selected) && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          )}
          <span>{meta.label}</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-700 dark:text-slate-400">
            {meta.unit}
          </span>
        </div>
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-xl backdrop-blur-md dark:border-slate-600/50 dark:bg-slate-800/95">
          <div className="max-h-64 overflow-y-auto py-1.5">
            {FIELDS.map(f => {
              const isSelected = f.key === selected;
              const isDone = entered.has(f.key as MKey);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => { onChange(f.key as MKey); setOpen(false); }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-900/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    isDone
                      ? "border-emerald-400 bg-emerald-500 text-white"
                      : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {isDone ? "✓" : ""}
                  </span>
                  <span className={`flex-1 text-sm ${isSelected ? "font-semibold text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>
                    {f.label}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">{f.unit}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── print ──────────────────────────────────────────────── */
function printSession(m: BodyMeasurement, patientName?: string) {
  const vals: Record<string, number | null | undefined> = {
    weight: m.weight, gogus: m.gogus, omuz: m.omuz, bel: m.bel, gobek: m.gobek,
    alt_karin: m.alt_karin, kalca: m.kalca, basen: m.basen, sag_bacak: m.sag_bacak,
    sol_bacak: m.sol_bacak, sag_kol: m.sag_kol, sol_kol: m.sol_kol, yag_orani: m.yag_orani,
  };
  const filled = FIELDS.filter(f => vals[f.key] != null);

  const bodyDots = ALL_POINTS.map(p => {
    const v = vals[p.key];
    return `<circle cx="${p.dotX}" cy="${p.dotY}" r="${v != null ? 4 : 2.5}" fill="${v != null ? "#10b981" : "#cbd5e1"}"/>
    ${v != null ? `<circle cx="${p.dotX}" cy="${p.dotY}" r="7" fill="#10b981" opacity="0.15"/>` : ""}`;
  }).join("");

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 0 88 220" width="160" height="200" style="display:block">
    <path fill="#e2e8f0" d="${BODY_PATH}"/>
    ${bodyDots}
  </svg>`;

  const win = window.open("", "_blank", "width=960,height=740");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"><title>Vücut Ölçüm Raporu – ${m.date}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;padding:44px;background:#fff}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2.5px solid #e2e8f0}
.brand{font-size:26px;font-weight:900;letter-spacing:-.5px}.brand span{color:#059669}
.brand small{display:block;font-size:13px;font-weight:400;color:#64748b;margin-top:3px}
.meta{text-align:right}.meta-label{font-size:20px;font-weight:700}
.meta-date{color:#64748b;font-size:14px;margin-top:2px}
.meta-weight{font-size:30px;font-weight:900;color:#059669;margin-top:6px}
.content{display:flex;gap:48px;align-items:flex-start}
.table-wrap{flex:1}
table{width:100%;border-collapse:collapse}
th{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;padding:8px 14px;border-bottom:1.5px solid #e2e8f0;text-align:left}
th:last-child{text-align:right}
td{padding:10px 14px;font-size:14px;border-bottom:1px solid #f1f5f9}
td:last-child{font-weight:700;color:#059669;text-align:right}
.notes-box{margin-top:20px;padding:14px;background:#f8fafc;border-radius:10px;font-size:13px;color:#475569;border-left:3px solid #10b981}
.footer{margin-top:36px;padding-top:14px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;text-align:center}
@media print{body{padding:22px}@page{margin:18mm}}
</style></head><body>
<div class="header">
  <div class="brand">JFS <span>Method</span><small>Vücut Ölçüm Raporu${patientName ? ` · ${patientName}` : ""}</small></div>
  <div class="meta">
    <div class="meta-label">${m.label || "Ölçüm"}</div>
    <div class="meta-date">${m.date}</div>
    ${m.weight != null ? `<div class="meta-weight">${m.weight} kg</div>` : ""}
  </div>
</div>
<div class="content">
  <div>${svgStr}</div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Bölge</th><th>Değer</th></tr></thead>
      <tbody>${filled.map(f => `<tr><td>${f.label}</td><td>${vals[f.key]} ${f.unit}</td></tr>`).join("")}</tbody>
    </table>
    ${m.notes ? `<div class="notes-box">${m.notes}</div>` : ""}
  </div>
</div>
<div class="footer">JFS Method · Rapor tarihi: ${new Date().toLocaleDateString("tr-TR")}</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
}

/* ─── expand modal ───────────────────────────────────────── */
function ExpandModal({ m, prev, patientName, onClose }: {
  m: BodyMeasurement; prev: BodyMeasurement | null; patientName?: string; onClose: () => void;
}) {
  const vals = { weight: m.weight, gogus: m.gogus, omuz: m.omuz, bel: m.bel, gobek: m.gobek, alt_karin: m.alt_karin, kalca: m.kalca, basen: m.basen, sag_bacak: m.sag_bacak, sol_bacak: m.sol_bacak, sag_kol: m.sag_kol, sol_kol: m.sol_kol, yag_orani: m.yag_orani };
  const prevVals = prev ? { weight: prev.weight, gogus: prev.gogus, omuz: prev.omuz, bel: prev.bel, gobek: prev.gobek, alt_karin: prev.alt_karin, kalca: prev.kalca, basen: prev.basen, sag_bacak: prev.sag_bacak, sol_bacak: prev.sol_bacak, sag_kol: prev.sag_kol, sol_kol: prev.sol_kol, yag_orani: prev.yag_orani } : undefined;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/20 bg-white/95 shadow-2xl dark:border-slate-600/40 dark:bg-slate-900/95" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-700/50">
          <div>
            {patientName && <p className="text-xs font-medium text-slate-400">{patientName}</p>}
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{m.label || "Ölçüm"} · {m.date}</h2>
            {m.weight != null && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{m.weight} kg</span>
                <TrendBadge d={diffNum(m.weight, prev?.weight)} unit=" kg" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => printSession(m, patientName)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" /></svg>
              Yazdır
            </button>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">✕</button>
          </div>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto]">
          <BodyWithLabels values={vals} prevValues={prevVals} />
          <div className="min-w-[160px] space-y-1.5">
            {FIELDS.filter(f => (vals as Record<string, unknown>)[f.key] != null).map(f => {
              const v = (vals as Record<string, unknown>)[f.key] as number;
              const d = prevVals ? diffNum(v, numVal((prevVals as Record<string, unknown>)[f.key])) : null;
              return (
                <div key={f.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500">{f.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{v} {f.unit}</span>
                    <TrendBadge d={d} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {m.notes && <div className="mx-6 mb-6 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-slate-600 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-slate-300">{m.notes}</div>}
      </div>
    </div>
  );
}

/* ─── measurement form ───────────────────────────────────── */
function MeasurementForm({ initial, onSave, onCancel, saveLabel = "Ölçümü Kaydet" }: {
  initial?: Partial<BodyMeasurement>;
  onSave: (payload: Omit<BodyMeasurement, "id" | "created_at">) => Promise<void>;
  onCancel: () => void;
  saveLabel?: string;
}) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split("T")[0]);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<FormValues>(() => {
    if (!initial) return {};
    const v: FormValues = {};
    for (const f of FIELDS) { const n = mVal(initial as BodyMeasurement, f.key); if (n != null) v[f.key] = String(n); }
    return v;
  });
  const [selectedKey, setSelectedKey] = useState<MKey>(FIELDS[0].key);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const enteredKeys = (Object.entries(values).filter(([, v]) => v != null && v !== "") as [MKey, string][]);
  const enteredSet = new Set(enteredKeys.map(([k]) => k));

  const addMeasurement = () => {
    const v = inputVal.trim(); if (!v) return;
    setValues(prev => ({ ...prev, [selectedKey]: v }));
    setInputVal("");
    // advance to next unentered field
    const keys = FIELDS.map(f => f.key);
    const next = keys.find(k => k !== selectedKey && !values[k]);
    if (next) setSelectedKey(next as MKey);
    inputRef.current?.focus();
  };

  const removeMeasurement = (k: MKey) => setValues(prev => { const n = { ...prev }; delete n[k]; return n; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await onSave({
        date, label, notes,
        weight:    values.weight    ? Number(values.weight)    : null,
        gogus:     values.gogus     ? Number(values.gogus)     : null,
        omuz:      values.omuz      ? Number(values.omuz)      : null,
        bel:       values.bel       ? Number(values.bel)       : null,
        gobek:     values.gobek     ? Number(values.gobek)     : null,
        alt_karin: values.alt_karin ? Number(values.alt_karin) : null,
        kalca:     values.kalca     ? Number(values.kalca)     : null,
        basen:     values.basen     ? Number(values.basen)     : null,
        sag_bacak: values.sag_bacak ? Number(values.sag_bacak) : null,
        sol_bacak: values.sol_bacak ? Number(values.sol_bacak) : null,
        sag_kol:   values.sag_kol   ? Number(values.sag_kol)   : null,
        sol_kol:   values.sol_kol   ? Number(values.sol_kol)   : null,
        yag_orani: values.yag_orani ? Number(values.yag_orani) : null,
      });
    } finally { setSaving(false); }
  };

  const previewVals: Record<string, number | null | undefined> = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, v ? Number(v) : null])
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* body preview */}
        <div className="flex flex-col items-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Canlı Önizleme</p>
          <div className="w-full max-w-[240px] rounded-2xl border border-slate-200/60 bg-gradient-to-b from-slate-50 to-white p-4 dark:border-slate-700/40 dark:from-slate-800/60 dark:to-slate-900/40">
            <BodyDotsOnly values={previewVals} activeKey={selectedKey} />
          </div>
          {enteredKeys.length === 0 && (
            <p className="mt-2 text-center text-[11px] text-slate-400">Ölçüm ekledikçe vücutta görünür</p>
          )}
        </div>

        {/* entry controls */}
        <div className="space-y-4">
          {/* date + label */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tarih *</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/50 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Etiket</label>
              <input type="text" placeholder="Başlangıç, Ara, Bitiş…" value={label} onChange={e => setLabel(e.target.value)}
                className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/50 dark:text-slate-100" />
            </div>
          </div>

          {/* dropdown + value */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ölçüm Ekle</label>
            <div className="flex gap-2">
              <MeasurementDropdown selected={selectedKey} entered={enteredSet} onChange={k => { setSelectedKey(k); inputRef.current?.focus(); }} />
              <input
                ref={inputRef}
                type="number" step="0.1" min="0"
                placeholder={fieldMeta[selectedKey]?.unit}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMeasurement(); } }}
                className="w-20 rounded-xl border border-white/30 bg-white/50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/50 dark:text-slate-100"
              />
              <button type="button" onClick={addMeasurement}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-transform">
                Ekle
              </button>
            </div>
          </div>

          {/* chips */}
          {enteredKeys.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">Girilen ({enteredKeys.length} / {FIELDS.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {enteredKeys.map(([k, v]) => (
                  <span key={k} className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 pl-2.5 pr-1.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {fieldMeta[k]?.label}: {v} {fieldMeta[k]?.unit}
                    <button type="button" onClick={() => removeMeasurement(k)}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200/80 text-emerald-600 hover:bg-red-100 hover:text-red-500 dark:bg-emerald-700/40 text-[10px]">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Not</label>
            <textarea rows={2} placeholder="Ek notlar…" value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/50 dark:text-slate-100" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || enteredKeys.length === 0}
              className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-opacity">
              {saving ? "Kaydediliyor…" : saveLabel}
            </button>
            <button type="button" onClick={onCancel}
              className="rounded-full border border-slate-300/60 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-white/60 dark:border-slate-600/60 dark:text-slate-300">
              İptal
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ─── session card ───────────────────────────────────────── */
function SessionCard({ m, prev, patientName, onDelete, onExpand, onEdit }: {
  m: BodyMeasurement; prev: BodyMeasurement | null; patientName?: string;
  onDelete: () => void; onExpand: () => void; onEdit: () => void;
}) {
  const vals = { weight: m.weight, gogus: m.gogus, omuz: m.omuz, bel: m.bel, gobek: m.gobek, alt_karin: m.alt_karin, kalca: m.kalca, basen: m.basen, sag_bacak: m.sag_bacak, sol_bacak: m.sol_bacak, sag_kol: m.sag_kol, sol_kol: m.sol_kol, yag_orani: m.yag_orani };
  const filledFields = FIELDS.filter(f => (vals as Record<string, unknown>)[f.key] != null);
  return (
    <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-sm dark:border-slate-600/40 dark:bg-slate-800/60">
      {/* header */}
      <div className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-700/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.label || "Ölçüm"}</p>
            <p className="mt-0.5 text-base font-bold text-slate-800 dark:text-slate-100">{m.date}</p>
          </div>
          {m.weight != null && (
            <div className="flex items-center gap-1.5">
              <TrendBadge d={diffNum(m.weight, prev?.weight)} unit=" kg" />
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{m.weight} kg</span>
            </div>
          )}
        </div>
      </div>
      {/* body figure */}
      <button type="button" onClick={onExpand} className="group relative cursor-zoom-in px-6 py-3">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">Büyüt ↗</span>
        </div>
        <BodyDotsOnly values={vals} />
      </button>
      {/* measurement grid */}
      {filledFields.filter(f => f.key !== "weight").length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700/50">
          <div className="grid grid-cols-2 gap-1">
            {filledFields.filter(f => f.key !== "weight").map(f => {
              const d = diffNum(numVal((vals as Record<string, unknown>)[f.key]), numVal(prev ? mVal(prev, f.key) : null));
              return (
                <div key={f.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-slate-700/40">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{f.label}</span>
                  <div className="flex items-center gap-1">
                    <TrendBadge d={d} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{String((vals as Record<string, unknown>)[f.key])}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {m.notes && <p className="border-t border-slate-100 px-4 py-2 text-[11px] italic text-slate-400 dark:border-slate-700/50 line-clamp-1">{m.notes}</p>}
      {/* actions */}
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 px-4 py-2 dark:border-slate-700/50">
        <div className="flex gap-1">
          {[
            { label: "Büyüt", icon: "M4 8V4h4M4 16v4h4M16 4h4v4M16 20h4v-4", onClick: onExpand, cls: "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700" },
            { label: "Yazdır", icon: "M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z", onClick: () => printSession(m, patientName), cls: "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700" },
            { label: "Düzenle", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", onClick: onEdit, cls: "text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20" },
          ].map(btn => (
            <button key={btn.label} type="button" onClick={btn.onClick}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${btn.cls}`}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={btn.icon} />
              </svg>
              {btn.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onDelete} className="text-[10px] font-medium text-red-400 hover:text-red-500">Sil</button>
      </div>
    </div>
  );
}

/* ─── trends bar ─────────────────────────────────────────── */
function TrendsBar({ first, last }: { first: BodyMeasurement; last: BodyMeasurement }) {
  const keys = ["kalca", "gogus", "yag_orani", "bel", "sag_kol", "sag_bacak", "basen"] as const;
  const labels: Record<string, string> = { kalca: "Kalça", gogus: "Göğüs", yag_orani: "Yağ%", bel: "Bel", sag_kol: "Sağ kol", sag_bacak: "Sağ bacak", basen: "Basen" };
  const entries = keys.map(k => ({ key: k, label: labels[k], p: pctNum(mVal(last, k), mVal(first, k)) })).filter(e => e.p != null) as { key: string; label: string; p: number }[];
  if (!entries.length) return null;
  const max = Math.max(...entries.map(e => Math.abs(e.p)));
  return (
    <GlassCard className="p-5 sm:p-6">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Genel Trend (İlk → Son)</h3>
      <div className="flex flex-wrap items-end gap-5">
        {entries.map(e => (
          <div key={e.key} className="flex flex-col items-center gap-1">
            <span className={`text-xs font-bold ${e.p < 0 ? "text-emerald-600" : "text-red-500"}`}>{e.p > 0 ? "+" : ""}{e.p.toFixed(1)}%</span>
            <div className="relative flex w-10 justify-center" style={{ height: 56 }}>
              <div className={`absolute bottom-0 w-full rounded-t ${e.p < 0 ? "bg-emerald-500" : "bg-red-400"}`} style={{ height: `${(Math.abs(e.p) / max) * 50 + 6}px` }} />
            </div>
            <span className="text-center text-[10px] text-slate-400">{e.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ─── edit modal ─────────────────────────────────────────── */
function EditModal({ m, patientId, onDone, onClose }: {
  m: BodyMeasurement; patientId: number; onDone: () => void; onClose: () => void;
}) {
  const handleSave = async (payload: Omit<BodyMeasurement, "id" | "created_at">) => {
    const token = getAccessToken(); if (!token) return;
    await api.admin.updateBodyMeasurement(token, patientId, m.id, payload);
    onDone(); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/20 bg-white/95 shadow-2xl dark:border-slate-600/40 dark:bg-slate-900/95" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700/50">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">Düzenle — {m.date}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">✕</button>
        </div>
        <div className="p-6">
          <MeasurementForm initial={m} onSave={handleSave} onCancel={onClose} saveLabel="Güncelle" />
        </div>
      </div>
    </div>
  );
}

/* ─── main ───────────────────────────────────────────────── */
interface Props {
  patientId: number; patientName?: string;
  onMessage: (msg: string, type: "success" | "error") => void;
}

export function BodyMeasurementsSection({ patientId, patientName, onMessage }: Props) {
  const confirm = useConfirm();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => {
    const token = getAccessToken(); if (!token) return;
    setLoading(true);
    api.admin.bodyMeasurements(token, patientId).then(setMeasurements).catch(() => onMessage("Ölçümler yüklenemedi.", "error")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [patientId]);

  const handleSave = async (payload: Omit<BodyMeasurement, "id" | "created_at">) => {
    const token = getAccessToken(); if (!token) return;
    await api.admin.addBodyMeasurement(token, patientId, payload);
    setShowForm(false); load(); onMessage("Ölçüm kaydedildi.", "success");
  };

  const handleDelete = async (id: number, date: string) => {
    const ok = await confirm({ title: "Ölçümü sil", message: `${date} tarihli ölçümü silmek istediğinize emin misiniz?`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    const token = getAccessToken(); if (!token) return;
    try { await api.admin.deleteBodyMeasurement(token, patientId, id); load(); onMessage("Ölçüm silindi.", "success"); }
    catch { onMessage("Silinemedi.", "error"); }
  };

  const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  const expandedM = sorted.find(m => m.id === expandedId) ?? null;
  const expandedPrev = expandedM ? (sorted[sorted.indexOf(expandedM) - 1] ?? null) : null;
  const editingM = sorted.find(m => m.id === editingId) ?? null;

  return (
    <div className="space-y-5">
      {/* body measurements */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Vücut Ölçümleri</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{measurements.length} seans kaydı</p>
          </div>
          <button type="button" onClick={() => setShowForm(v => !v)}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {showForm ? "İptal" : "+ Yeni Ölçüm"}
          </button>
        </div>
        {showForm && (
          <div className="mt-6 border-t border-white/20 pt-6">
            <MeasurementForm onSave={handleSave} onCancel={() => setShowForm(false)} />
          </div>
        )}
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" /></div>
      ) : sorted.length === 0 ? (
        !showForm && <GlassCard className="p-8 text-center"><p className="text-sm text-slate-500">Henüz ölçüm kaydı yok.</p></GlassCard>
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {sorted.map((m, i) => (
              <SessionCard key={m.id} m={m} prev={i > 0 ? sorted[i - 1] : null} patientName={patientName}
                onDelete={() => handleDelete(m.id, m.date)} onExpand={() => setExpandedId(m.id)} onEdit={() => setEditingId(m.id)} />
            ))}
          </div>
          {sorted.length >= 2 && <TrendsBar first={sorted[0]} last={sorted[sorted.length - 1]} />}
        </>
      )}

      {expandedM && <ExpandModal m={expandedM} prev={expandedPrev} patientName={patientName} onClose={() => setExpandedId(null)} />}
      {editingM && <EditModal m={editingM} patientId={patientId} onDone={() => { load(); onMessage("Güncellendi.", "success"); }} onClose={() => setEditingId(null)} />}
    </div>
  );
}
