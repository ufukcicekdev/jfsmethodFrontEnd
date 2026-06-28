"use client";

import { useEffect } from "react";

/**
 * Ana service worker'ı (/sw.js) kök kapsamda kaydeder. PWA kurulabilirliği
 * ve temel offline desteği için gereklidir. Push SW'si ayrı (dar) bir
 * kapsamda kaydolur, böylece bu kaydı ezmez.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          console.warn("Service worker kaydı başarısız:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
