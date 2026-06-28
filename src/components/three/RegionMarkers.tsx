"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BodyRegion } from "@/lib/bodyRegions";

/** Modelin önünde, vücut bölgelerine yakın yaklaşık 3B konumlar
 * (ayaklar y=0, baş ~y=2.0; ön taraf +z). */
const REGION_POSITIONS: Record<BodyRegion, [number, number, number]> = {
  neck: [0, 1.72, 0.08],
  shoulder_left: [-0.26, 1.56, 0.06],
  shoulder_right: [0.26, 1.56, 0.06],
  upper_back: [0, 1.46, 0.12],
  lower_back: [0, 1.08, 0.12],
  hip_left: [-0.15, 0.98, 0.08],
  hip_right: [0.15, 0.98, 0.08],
  knee_left: [-0.11, 0.52, 0.1],
  knee_right: [0.11, 0.52, 0.1],
};

function colorForLevel(level: number | undefined): string {
  if (level === undefined) return "#94a3b8";
  if (level === 0) return "#34d399";
  if (level <= 3) return "#6ee7b7";
  if (level <= 5) return "#fbbf24";
  if (level <= 7) return "#f97316";
  return "#ef4444";
}

interface MarkerProps {
  position: [number, number, number];
  color: string;
  level: number | undefined;
  selected: boolean;
  onSelect: () => void;
}

function Marker({ position, color, level, selected, onSelect }: MarkerProps) {
  const haloRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const painLevel = level ?? 0;
  const hasPain = painLevel > 0;
  const baseOpacity = hasPain ? 0.3 + painLevel * 0.055 : 0.14;
  const haloRadius =
    (selected ? 0.2 : 0.15) + (hasPain ? painLevel * 0.018 : 0);

  useFrame((state) => {
    if (!haloRef.current) return;
    const pulse = selected
      ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.14
      : 1;
    haloRef.current.scale.setScalar(pulse);
    const mat = haloRef.current.material as THREE.MeshBasicMaterial;
    mat.color.set(color);
    mat.opacity = selected
      ? Math.min(baseOpacity + 0.2, 0.92)
      : baseOpacity;
    if (coreRef.current) {
      const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
      coreMat.color.set(color);
      coreMat.emissive.set(color);
      coreMat.emissiveIntensity = selected ? 1.4 : 0.5 + painLevel * 0.08;
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <mesh ref={haloRef}>
        <sphereGeometry args={[haloRadius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={baseOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.035 + painLevel * 0.004, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1.4 : 0.5 + painLevel * 0.08}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

interface RegionMarkersProps {
  levelByRegion: Partial<Record<BodyRegion, number>>;
  selectedRegion: BodyRegion | null;
  onSelect: (region: BodyRegion) => void;
}

export function RegionMarkers({
  levelByRegion,
  selectedRegion,
  onSelect,
}: RegionMarkersProps) {
  return (
    <group>
      {(Object.keys(REGION_POSITIONS) as BodyRegion[]).map((region) => (
        <Marker
          key={region}
          position={REGION_POSITIONS[region]}
          color={colorForLevel(levelByRegion[region])}
          level={levelByRegion[region]}
          selected={selectedRegion === region}
          onSelect={() => onSelect(region)}
        />
      ))}
    </group>
  );
}
