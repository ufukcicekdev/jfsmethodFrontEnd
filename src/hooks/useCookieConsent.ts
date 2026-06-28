"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COOKIE_CONSENT_KEY,
  KVKK_VERSION,
} from "@/lib/kvkk/constants";
import { api } from "@/lib/api";

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  version: string;
  savedAt: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  version: KVKK_VERSION,
  savedAt: "",
};

function readStoredPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (parsed.version !== KVKK_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistPreferences(prefs: CookiePreferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftMarketing, setDraftMarketing] = useState(false);

  useEffect(() => {
    const stored = readStoredPreferences();
    setPreferences(stored);
    setShowBanner(!stored);
    setDraftAnalytics(stored?.analytics ?? false);
    setDraftMarketing(stored?.marketing ?? false);
    setIsLoaded(true);
  }, []);

  const syncToBackend = useCallback(async (analytics: boolean, marketing: boolean) => {
    try {
      await api.kvkk.saveCookieConsent({ analytics, marketing });
    } catch {
      // Consent is still stored locally; backend sync can retry later.
    }
  }, []);

  const savePreferences = useCallback(
    async (analytics: boolean, marketing: boolean) => {
      const prefs: CookiePreferences = {
        essential: true,
        analytics,
        marketing,
        version: KVKK_VERSION,
        savedAt: new Date().toISOString(),
      };
      persistPreferences(prefs);
      setPreferences(prefs);
      setShowBanner(false);
      setShowSettings(false);
      await syncToBackend(analytics, marketing);
    },
    [syncToBackend]
  );

  const acceptAll = useCallback(() => savePreferences(true, true), [savePreferences]);

  const saveSelection = useCallback(
    () => savePreferences(draftAnalytics, draftMarketing),
    [savePreferences, draftAnalytics, draftMarketing]
  );

  const openSettings = useCallback(() => {
    setDraftAnalytics(preferences?.analytics ?? false);
    setDraftMarketing(preferences?.marketing ?? false);
    setShowSettings(true);
  }, [preferences]);

  return {
    isLoaded,
    showBanner,
    showSettings,
    preferences,
    draftAnalytics,
    draftMarketing,
    setDraftAnalytics,
    setDraftMarketing,
    acceptAll,
    saveSelection,
    openSettings,
    closeSettings: () => setShowSettings(false),
  };
}
