"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RandevularRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/hesabim/paketler"); }, [router]);
  return null;
}
