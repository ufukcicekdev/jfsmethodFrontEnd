"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  isFirebaseConfigured,
  listenForegroundMessages,
  pushSupported,
  requestPushToken,
} from "@/lib/firebase/messaging";

const DISMISS_KEY = "jfs_push_prompt_dismissed";

interface ForegroundToast {
  title: string;
  body: string;
  link?: string;
}

export function PushNotificationManager() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [toast, setToast] = useState<ForegroundToast | null>(null);
  const registeredRef = useRef(false);

  const registerToken = useCallback(async () => {
    const authToken = getAccessToken();
    if (!authToken) return false;

    const fcmToken = await requestPushToken();
    if (!fcmToken) return false;

    try {
      await api.devices.register(authToken, fcmToken);
      registeredRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      registeredRef.current = false;
      return;
    }

    let active = true;

    (async () => {
      if (!isFirebaseConfigured()) return;
      if (!(await pushSupported())) return;
      if (!active) return;

      const permission = Notification.permission;

      if (permission === "granted") {
        if (!registeredRef.current) {
          await registerToken();
        }
      } else if (permission === "default") {
        const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
        if (!dismissed) setShowPrompt(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, registerToken]);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | undefined;

    listenForegroundMessages((payload) => {
      const notification = payload.notification;
      setToast({
        title: notification?.title ?? "JFS Method",
        body: notification?.body ?? "",
        link: payload.data?.link,
      });
    }).then((fn) => {
      unsubscribe = fn;
    });

    return () => unsubscribe?.();
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleEnable = async () => {
    setShowPrompt(false);
    const ok = await registerToken();
    if (!ok && Notification.permission === "denied") {
      // İzin reddedildi; sessizce geç.
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <>
      {showPrompt && (
        <div className="fixed inset-x-4 bottom-4 z-60 mx-auto max-w-md rounded-2xl border border-blue-200/70 bg-white/95 p-4 shadow-xl shadow-blue-200/40 backdrop-blur-xl sm:left-auto sm:right-4 sm:mx-0 dark:border-blue-900/50 dark:bg-slate-900/95 dark:shadow-black/40">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Bildirimleri aç
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                Randevu onayı, erteleme ve iptallerden anında haberdar ol.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleEnable}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  İzin ver
                </button>
                <Link
                  href="/hesabim/ayarlar"
                  onClick={handleDismiss}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Ayarlardan yönet
                </Link>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  Daha sonra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <button
          type="button"
          onClick={() => {
            if (toast.link) {
              window.location.href = toast.link.startsWith("http")
                ? toast.link
                : toast.link;
            }
            setToast(null);
          }}
          className="fixed inset-x-4 top-4 z-70 mx-auto block max-w-md rounded-2xl border border-slate-200/70 bg-white/95 p-4 text-left shadow-xl shadow-slate-300/40 backdrop-blur-xl sm:left-auto sm:right-4 sm:mx-0 dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-black/40"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {toast.title}
          </p>
          {toast.body && (
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              {toast.body}
            </p>
          )}
        </button>
      )}
    </>
  );
}
