"use client";

import { useCookieConsent } from "@/hooks/useCookieConsent";
import { CookieSettingsModal } from "./CookieSettingsModal";

export function CookieBanner() {
  const {
    isLoaded,
    showBanner,
    showSettings,
    draftAnalytics,
    draftMarketing,
    setDraftAnalytics,
    setDraftMarketing,
    acceptAll,
    saveSelection,
    openSettings,
    closeSettings,
  } = useCookieConsent();

  if (!isLoaded) return null;

  return (
    <>
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[80] p-4 sm:p-6">
          <div className="glass mx-auto flex max-w-4xl flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Çerez Kullanımı
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Deneyiminizi iyileştirmek için zorunlu, analitik ve pazarlama
                çerezleri kullanıyoruz. Tercihlerinizi dilediğiniz zaman
                değiştirebilirsiniz.{" "}
                <button
                  type="button"
                  onClick={openSettings}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Detaylı ayarlar
                </button>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600"
              >
                Hepsini Kabul Et
              </button>
              <button
                type="button"
                onClick={openSettings}
                className="rounded-full border border-blue-500/40 bg-white/30 px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-white/50"
              >
                Seçimleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <CookieSettingsModal
          analytics={draftAnalytics}
          marketing={draftMarketing}
          onAnalyticsChange={setDraftAnalytics}
          onMarketingChange={setDraftMarketing}
          onSave={saveSelection}
          onAcceptAll={acceptAll}
          onClose={closeSettings}
        />
      )}
    </>
  );
}
