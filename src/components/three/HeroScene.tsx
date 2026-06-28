"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, OrbitControls } from "@react-three/drei";
import { HumanBodyModel } from "./HumanBodyModel";
import { HERO_CAMERA, ORBIT_TARGET } from "./sceneConfig";
import { SceneLoader } from "./SceneLoader";

function HeroDecor() {
  return (
    <>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[1.8, 1.6, -0.8]} rotation={[0.5, 0.3, 0.2]}>
          <torusGeometry args={[0.5, 0.035, 16, 48]} />
          <meshPhysicalMaterial
            color="#93c5fd"
            emissive="#3b82f6"
            emissiveIntensity={0.25}
            metalness={0.7}
            roughness={0.15}
            transparent
            opacity={0.6}
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.4}>
        <mesh position={[-1.6, 2, -0.4]} rotation={[0.2, 0.8, 0.5]}>
          <torusGeometry args={[0.3, 0.025, 12, 36]} />
          <meshPhysicalMaterial
            color="#6ee7b7"
            emissive="#34d399"
            emissiveIntensity={0.3}
            metalness={0.6}
            roughness={0.2}
            transparent
            opacity={0.55}
          />
        </mesh>
      </Float>
    </>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, 3, 2]} intensity={0.6} color="#6ee7b7" />
      <pointLight position={[4, 2, -3]} intensity={0.5} color="#93c5fd" />
      <spotLight
        position={[0, 6, 4]}
        angle={0.35}
        penumbra={0.6}
        intensity={0.8}
        color="#f0f9ff"
      />

      <Environment preset="studio" />

      <HumanBodyModel height={178} weight={74} variant="hero" />
      <HeroDecor />

      <OrbitControls
        target={ORBIT_TARGET}
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.85}
        minPolarAngle={Math.PI / 2.8}
      />
    </>
  );
}

export default function HeroScene() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Canvas
        camera={{
          position: HERO_CAMERA.position,
          fov: HERO_CAMERA.fov,
        }}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <Suspense fallback={<SceneLoader />}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
