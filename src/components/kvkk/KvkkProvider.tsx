"use client";

import { CookieBanner } from "./CookieBanner";

export function KvkkProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}
