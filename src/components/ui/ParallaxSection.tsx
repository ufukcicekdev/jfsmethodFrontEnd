"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  intensity?: number;
}

export function ParallaxSection({
  children,
  className = "",
  id,
  intensity = 0.08,
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    if (!section || !bg) return;

    // Mobilde ve reduced-motion tercihinde parallax'ı devre dışı bırak
    if (window.innerWidth < 768 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const offset = (center - viewH / 2) * intensity;
      bg.style.transform = `translateY(${offset}px)`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [intensity]);

  return (
    <section ref={sectionRef} id={id} className={`relative overflow-hidden ${className}`}>
      <div
        ref={bgRef}
        className="pointer-events-none absolute -inset-x-20 -top-20 bottom-0 will-change-transform"
        aria-hidden
      >
        <div className="absolute left-[10%] top-[15%] h-64 w-64 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/15" />
        <div className="absolute right-[5%] top-[40%] h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/15" />
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
