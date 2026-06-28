"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

interface LottieIconProps {
  src: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function LottieIcon({ src, className = "h-14 w-14", fallback }: LottieIconProps) {
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    fetch(src)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [src]);

  if (!data) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {fallback ?? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/40" />
        )}
      </div>
    );
  }

  return (
    <Lottie
      animationData={data}
      loop
      className={className}
    />
  );
}
