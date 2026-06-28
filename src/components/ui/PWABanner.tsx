"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

function recentlyDismissed() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function PWABanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    const installed = () => {
      setDeferredPrompt(null);
      setOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);

    // iOS beforeinstallprompt desteklemez → manuel yönergeli modal.
    // (Senkron setState + hydration uyumsuzluğundan kaçınmak için mikrotask.)
    queueMicrotask(() => {
      if (isIOS()) {
        setIos(true);
        setOpen(true);
      }
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage erişilemezse sessizce geç
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setOpen(false);
    } else {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      {/* Arka plan */}
      <button
        type="button"
        aria-label="Kapat"
        onClick={dismiss}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl glass p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 text-white shadow-lg">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2
            id="pwa-install-title"
            className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50"
          >
            JFS Method'i Yükle
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Uygulamayı cihazına ekle; offline egzersiz kütüphanesine ve
            randevularına ana ekrandan anında eriş.
          </p>

          {ios ? (
            <div className="mt-5 w-full rounded-2xl bg-slate-50/80 p-4 text-left text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
              Safari&apos;de alttaki{" "}
              <span className="font-semibold">Paylaş</span> simgesine dokun →{" "}
              <span className="font-semibold">Ana Ekrana Ekle</span>&apos;yi
              seç.
              <button
                type="button"
                onClick={dismiss}
                className="mt-4 w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Anladım
              </button>
            </div>
          ) : (
            <div className="mt-5 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-600"
              >
                Yükle
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="w-full rounded-full px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Daha sonra
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
