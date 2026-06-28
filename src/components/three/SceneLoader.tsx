"use client";

import { Html, useProgress } from "@react-three/drei";

function LoaderContent() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
        <p className="whitespace-nowrap text-xs text-slate-500">
          Anatomi modeli yükleniyor… %{Math.round(progress)}
        </p>
      </div>
    </Html>
  );
}

export function SceneLoader() {
  return <LoaderContent />;
}
