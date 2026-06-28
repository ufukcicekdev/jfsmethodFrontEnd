"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Model3DCanvas } from "@/components/ui/Model3DCanvas";
import { NeonSlider } from "@/components/ui/NeonSlider";
import {
  calculateBMI,
  getBMICategory,
  getIdealWeightRange,
} from "@/lib/bmi";

export function DigitalTwinPanel() {
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);

  const bmi = useMemo(() => calculateBMI(height, weight), [height, weight]);
  const category = useMemo(() => getBMICategory(bmi), [bmi]);
  const idealRange = useMemo(() => getIdealWeightRange(height), [height]);

  return (
    <section id="dijital-ikiz" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <ScrollReveal>
        <SectionHeader
          eyebrow="Teknoloji"
          title="Senin Dijital İkizin"
          description="Boy ve kilo verilerinizle kişiselleştirilmiş 3D vücut modelinizi oluşturun. Tedavi ilerlemenizi görsel olarak takip edin."
        />
      </ScrollReveal>

      <ScrollReveal delay={150}>
        <GlassCard className="relative overflow-hidden p-4 sm:p-8 lg:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="order-2 hidden lg:block lg:order-1">
              <NeonSlider
                label="Boy"
                value={height}
                min={140}
                max={210}
                unit="cm"
                accent="mint"
                onChange={setHeight}
              />
            </div>

            <div className="order-1 flex flex-1 flex-col items-center lg:order-2">
              <div className="relative mx-auto w-full lg:max-w-[320px]">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-blue-200/20 to-emerald-200/20 blur-2xl" />
                <div className="relative aspect-[3/4] w-full min-h-[280px] max-h-[min(420px,65vh)] overflow-hidden rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm sm:rounded-3xl dark:border-slate-600/40 dark:bg-slate-800/50 lg:aspect-auto lg:h-[480px] lg:max-h-none">
                  <Model3DCanvas
                    variant="twin"
                    height={height}
                    weight={weight}
                    className="h-full w-full"
                  />
                </div>
              </div>

              <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center sm:mt-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    BMI
                  </p>
                  <p className="text-base font-bold text-slate-800 sm:text-lg dark:text-slate-100">
                    {bmi.toFixed(1)}
                  </p>
                </div>
                <div className="hidden h-8 w-px bg-slate-300/50 sm:block dark:bg-slate-600/60" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Durum
                  </p>
                  <p
                    className={`text-base font-bold sm:text-lg ${category.colorClass}`}
                  >
                    {category.label}
                  </p>
                </div>
                <div className="hidden h-8 w-px bg-slate-300/50 sm:block dark:bg-slate-600/60" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    İdeal Kilo
                  </p>
                  <p className="text-base font-bold text-slate-700 sm:text-lg dark:text-slate-100">
                    {idealRange.min}–{idealRange.max} kg
                  </p>
                </div>
              </div>
            </div>

            <div className="order-3 hidden lg:block">
              <NeonSlider
                label="Kilo"
                value={weight}
                min={40}
                max={150}
                unit="kg"
                accent="blue"
                onChange={setWeight}
              />
            </div>

            <div className="order-2 grid grid-cols-2 gap-4 lg:hidden">
              <NeonSlider
                label="Boy"
                value={height}
                min={140}
                max={210}
                unit="cm"
                accent="mint"
                orientation="horizontal"
                onChange={setHeight}
              />
              <NeonSlider
                label="Kilo"
                value={weight}
                min={40}
                max={150}
                unit="kg"
                accent="blue"
                orientation="horizontal"
                onChange={setWeight}
              />
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>
    </section>
  );
}
