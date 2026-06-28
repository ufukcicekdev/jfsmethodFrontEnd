"use client";

import dynamic from "next/dynamic";
import type { BodyRegion } from "@/lib/bodyRegions";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
    </div>
  ),
});

const DigitalTwinScene = dynamic(
  () => import("@/components/three/DigitalTwinScene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    ),
  }
);

interface Model3DCanvasProps {
  variant: "hero" | "twin";
  height?: number;
  weight?: number;
  className?: string;
  levelByRegion?: Partial<Record<BodyRegion, number>>;
  selectedRegion?: BodyRegion | null;
  onSelectRegion?: (region: BodyRegion) => void;
}

export function Model3DCanvas({
  variant,
  height = 175,
  weight = 72,
  className = "",
  levelByRegion,
  selectedRegion,
  onSelectRegion,
}: Model3DCanvasProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {variant === "hero" ? (
        <HeroScene />
      ) : (
        <DigitalTwinScene
          height={height}
          weight={weight}
          levelByRegion={levelByRegion}
          selectedRegion={selectedRegion}
          onSelectRegion={onSelectRegion}
        />
      )}
    </div>
  );
}
