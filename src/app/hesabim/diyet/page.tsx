"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAccessToken } from "@/lib/auth";
import { api, type DietPlan } from "@/lib/api";

const MEAL_LABELS: Record<string, string> = {
  sabah: "Kahvaltı",
  ara1: "Ara Öğün 1",
  ogle: "Öğle",
  ara2: "Ara Öğün 2",
  aksam: "Akşam",
  gece: "Gece",
};

export default function HesabimDiyetPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    api.myDiets
      .list(token)
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const byDate = plans.reduce<Record<string, DietPlan[]>>((acc, p) => {
    (acc[p.date] = acc[p.date] ?? []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Diyet Planlarım</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Size atanan günlük öğün planları.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        </div>
      ) : Object.keys(byDate).length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">Henüz diyet planı atanmamış.</p>
        </GlassCard>
      ) : (
        Object.entries(byDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, datePlans]) => (
            <div key={date}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="space-y-3">
                {datePlans.map((plan) => (
                  <GlassCard key={plan.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {MEAL_LABELS[plan.meal_type] ?? plan.meal_type_label}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{plan.title}</span>
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{plan.total_calories} kcal</span>
                    </div>
                    {plan.description && (
                      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                    )}
                    {plan.plan_items.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {plan.plan_items.map((pi) => (
                          <div key={pi.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2 dark:bg-slate-800/40">
                            <span className="text-sm text-slate-800 dark:text-slate-200">{pi.diet_item.name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              {pi.quantity !== 1 && (
                                <span className="text-xs text-slate-400">×{pi.quantity}</span>
                              )}
                              <span className="text-xs font-semibold text-orange-500">
                                {Math.round(pi.diet_item.calories * pi.quantity)} kcal
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-end pt-1">
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            Toplam: {plan.total_calories} kcal
                          </span>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
