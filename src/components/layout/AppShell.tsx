"use client";

import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgressBar />
      {children}
    </>
  );
}
