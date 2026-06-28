"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export const MODEL_CENTER_Y = 1.05;
export const MODEL_HEIGHT = 2.1;

interface HumanBodyModelProps {
  height: number;
  weight: number;
  variant?: "hero" | "twin";
  interactive?: boolean;
}

function lerp(current: number, target: number, speed: number) {
  return current + (target - current) * speed;
}

function prepareModel(scene: THREE.Object3D) {
  const clone = scene.clone(true);
  clone.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());

  clone.position.set(
    -(box.min.x + box.max.x) / 2,
    -box.min.y,
    -(box.min.z + box.max.z) / 2
  );

  const scale = MODEL_HEIGHT / size.y;
  clone.scale.setScalar(scale);

  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      const newMaterials = materials.map((mat) => {
        const cloned = mat.clone();
        if ("envMapIntensity" in cloned) {
          (cloned as THREE.MeshStandardMaterial).envMapIntensity = 0.9;
        }
        return cloned;
      });
      child.material =
        newMaterials.length === 1 ? newMaterials[0] : newMaterials;
    }
  });

  return clone;
}

useGLTF.preload("/models/body.glb");

export function HumanBodyModel({
  height,
  weight,
  variant = "twin",
  interactive = false,
}: HumanBodyModelProps) {
  const { scene } = useGLTF("/models/body.glb");
  const groupRef = useRef<THREE.Group>(null);
  const smoothRef = useRef({ h: height, w: weight });

  const model = useMemo(() => prepareModel(scene), [scene]);

  const isHero = variant === "hero";

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    smoothRef.current.h = lerp(smoothRef.current.h, height, delta * 3.5);
    smoothRef.current.w = lerp(smoothRef.current.w, weight, delta * 3.5);

    const h = smoothRef.current.h;
    const w = smoothRef.current.w;
    const heightScale = 0.92 + ((h - 140) / 70) * 0.16;
    const bmi = w / (h / 100) ** 2;
    const widthScale =
      0.92 + Math.min(Math.max((bmi - 18) / 28, 0), 1.2) * 0.18;

    groupRef.current.scale.set(widthScale, heightScale, widthScale);

    if (interactive) {
      groupRef.current.rotation.y = 0;
      groupRef.current.position.y = 0;
    } else if (isHero) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.7) * 0.03;
    } else {
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      <primitive object={model} />
    </group>
  );
}
