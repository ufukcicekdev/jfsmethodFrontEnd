"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonSlider } from "@/components/ui/NeonSlider";
import {
  BODY_REGIONS,
  painColor,
  painTextColor,
  type BodyRegion,
} from "@/lib/bodyRegions";
import type { RegionPainLog } from "@/lib/api";

interface BodyPainMapProps {
  painMap: RegionPainLog[];
  onSave: (
    entries: { region: BodyRegion; pain_level: number; note?: string }[]
  ) => Promise<void>;
  saving?: boolean;
  selectedRegion?: BodyRegion | null;
  onSelectRegion?: (region: BodyRegion) => void;
  levels?: Partial<Record<BodyRegion, number>>;
  onLevelsChange?: (levels: Partial<Record<BodyRegion, number>>) => void;
}

export function BodyPainMap({
  painMap,
  onSave,
  saving,
  selectedRegion,
  onSelectRegion,
  levels: levelsProp,
  onLevelsChange,
}: BodyPainMapProps) {
  const initialLevels = useMemo(() => {
    const map: Partial<Record<BodyRegion, number>> = {};
    for (const entry of painMap) {
      map[entry.region] = entry.pain_level;
    }
    return map;
  }, [painMap]);

  const [internalLevels, setInternalLevels] =
    useState<Partial<Record<BodyRegion, number>>>(initialLevels);
  const levelsControlled = onLevelsChange !== undefined;
  const levels = levelsControlled ? (levelsProp ?? {}) : internalLevels;
  const [internalSelected, setInternalSelected] =
    useState<BodyRegion | null>("lower_back");
  const selectionControlled = onSelectRegion !== undefined;
  const selected = selectionControlled ? selectedRegion ?? null : internalSelected;
  const setSelected = (region: BodyRegion) => {
    if (selectionControlled) onSelectRegion!(region);
    else setInternalSelected(region);
  };
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (levelsControlled) return;
    setInternalLevels(initialLevels);
    setDirty(false);
  }, [initialLevels, levelsControlled]);

  const selectedLevel = selected ? levels[selected] ?? 0 : 0;

  const updateLevel = (region: BodyRegion, pain_level: number) => {
    const next = { ...levels, [region]: pain_level };
    if (levelsControlled) onLevelsChange!(next);
    else setInternalLevels(next);
    setDirty(true);
  };

  const handleSave = async () => {
    const entries = BODY_REGIONS.filter(
      (region) => levels[region.id] !== undefined
    ).map((region) => ({
      region: region.id,
      pain_level: levels[region.id] ?? 0,
    }));
    if (entries.length === 0) return;
    await onSave(entries);
    setDirty(false);
  };

  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Ağrı Haritası
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Vücut bölgelerinize göre ağrı seviyenizi işaretleyin (0–10).
          </p>
        </div>
        {dirty && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-3 md:gap-3">
        {BODY_REGIONS.map((region) => {
          const level = levels[region.id];
          const isSelected = selected === region.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => setSelected(region.id)}
              className={`rounded-xl border px-2 py-3 text-center transition-all ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-400/30"
                  : "border-slate-200/80 dark:border-slate-600/50"
              }`}
            >
              <div
                className={`mx-auto mb-2 h-8 w-8 rounded-full ${painColor(level)}`}
              />
              <p className="text-[11px] font-medium leading-tight text-slate-700 dark:text-slate-200">
                {region.label}
              </p>
              <p className={`mt-0.5 text-xs font-bold ${painTextColor(level)}`}>
                {level !== undefined ? level : "—"}
              </p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-600/50 dark:bg-slate-800/40">
          <p className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-100">
            {BODY_REGIONS.find((r) => r.id === selected)?.label} — Ağrı seviyesi:{" "}
            <span className={painTextColor(selectedLevel)}>{selectedLevel}</span>
          </p>
          <NeonSlider
            label="Ağrı (0 = yok, 10 = çok şiddetli)"
            value={selectedLevel}
            min={0}
            max={10}
            unit=""
            accent="blue"
            orientation="horizontal"
            onChange={(value) => updateLevel(selected, value)}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-emerald-400" /> Hafif
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-amber-400" /> Orta
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-red-500" /> Şiddetli
        </span>
      </div>
    </GlassCard>
  );
}
