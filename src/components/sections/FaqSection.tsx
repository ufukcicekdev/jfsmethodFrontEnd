"use client";

import { useEffect, useState } from "react";
import { ParallaxSection } from "@/components/ui/ParallaxSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api, type Faq } from "@/lib/api";

export function FaqSection() {
  const [items, setItems] = useState<Faq[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    api.faqs.list()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <ParallaxSection id="sss" className="mx-auto max-w-3xl px-6 py-24" intensity={0.06}>
      <ScrollReveal>
        <SectionHeader
          eyebrow="SSS"
          title="Sıkça Sorulan Sorular"
          description="Merak ettiklerinizin cevapları burada."
        />
      </ScrollReveal>

      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <ScrollReveal key={item.id} delay={index * 60}>
              <div className="glass overflow-hidden rounded-2xl transition-shadow hover:shadow-lg">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 transition-transform duration-300 dark:text-blue-400 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-white/20 px-5 pb-4 pt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </ParallaxSection>
  );
}
