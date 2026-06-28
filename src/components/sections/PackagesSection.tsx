"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api, type PackagePlan } from "@/lib/api";

function formatPrice(value: string | number) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "Fiyat için iletişime geçin";
  return num.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });
}

export function PackagesSection() {
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.packagePlans
      .public()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && plans.length === 0) return null;

  return (
    <section id="paketler" className="relative px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Danışmanlık Paketleri"
          title="Size Uygun Programı Seçin"
          description="Ağrısız, kişiye özel ve sürdürülebilir vücut dönüşümü için esnek danışmanlık paketleri."
        />

        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <GlassCard
                key={plan.id}
                className="flex flex-col p-6 transition-shadow hover:shadow-lg"
              >
                {plan.image_url && (
                  <div className="mb-4 overflow-hidden rounded-xl">
                    <img src={plan.image_url} alt={plan.name} className="h-44 w-full object-cover" />
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {plan.total_sessions} seans
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-50">
                  {plan.name}
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatPrice(plan.price)}
                </p>
                {plan.description && (
                  <div className="prose prose-sm mt-3 flex-1 max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: plan.description }} />
                )}
                <Link
                  href="#iletisim"
                  className="mt-6 block rounded-full bg-blue-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Bilgi Al
                </Link>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
