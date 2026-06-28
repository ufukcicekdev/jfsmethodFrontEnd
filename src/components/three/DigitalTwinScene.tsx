"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { HumanBodyModel } from "./HumanBodyModel";
import { RegionMarkers } from "./RegionMarkers";
import { ORBIT_TARGET, TWIN_CAMERA } from "./sceneConfig";
import { SceneLoader } from "./SceneLoader";
import type { BodyRegion } from "@/lib/bodyRegions";

interface DigitalTwinSceneProps {
  height: number;
  weight: number;
  levelByRegion?: Partial<Record<BodyRegion, number>>;
  selectedRegion?: BodyRegion | null;
  onSelectRegion?: (region: BodyRegion) => void;
}

function Scene({
  height,
  weight,
  levelByRegion,
  selectedRegion,
  onSelectRegion,
}: DigitalTwinSceneProps) {
  const interactive = Boolean(onSelectRegion);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 3, 2]} intensity={0.45} color="#6ee7b7" />
      <pointLight position={[3, 2, -2]} intensity={0.35} color="#93c5fd" />
      <hemisphereLight args={["#e0f2fe", "#f1f5f9", 0.4]} />

      <Environment preset="city" />

      <HumanBodyModel
        height={height}
        weight={weight}
        variant="twin"
        interactive={interactive}
      />

      {interactive && (
        <RegionMarkers
          levelByRegion={levelByRegion ?? {}}
          selectedRegion={selectedRegion ?? null}
          onSelect={onSelectRegion!}
        />
      )}

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.35}
        scale={2.8}
        blur={2}
        far={3}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[1.6, 64]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.1} />
      </mesh>

      <OrbitControls
        target={ORBIT_TARGET}
        enableZoom
        enablePan={false}
        minDistance={2.1}
        maxDistance={6.8}
        zoomSpeed={0.9}
        autoRotate={!interactive}
        autoRotateSpeed={0.6}
        maxPolarAngle={Math.PI / 1.85}
        minPolarAngle={Math.PI / 2.8}
      />
    </>
  );
}

export default function DigitalTwinScene({
  height,
  weight,
  levelByRegion,
  selectedRegion,
  onSelectRegion,
}: DigitalTwinSceneProps) {
  const [camera, setCamera] = useState(TWIN_CAMERA);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateCamera = () => {
      setCamera(
        mediaQuery.matches
          ? {
              position: [0, TWIN_CAMERA.position[1], 4.6] as [
                number,
                number,
                number,
              ],
              fov: 40,
            }
          : TWIN_CAMERA
      );
    };

    updateCamera();
    mediaQuery.addEventListener("change", updateCamera);
    return () => mediaQuery.removeEventListener("change", updateCamera);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Canvas
        camera={{
          position: camera.position,
          fov: camera.fov,
        }}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <Suspense fallback={<SceneLoader />}>
          <Scene
            height={height}
            weight={weight}
            levelByRegion={levelByRegion}
            selectedRegion={selectedRegion}
            onSelectRegion={onSelectRegion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
