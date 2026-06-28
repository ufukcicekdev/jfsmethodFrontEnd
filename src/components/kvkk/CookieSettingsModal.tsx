"use client";

interface CookieSettingsModalProps {
  analytics: boolean;
  marketing: boolean;
  onAnalyticsChange: (value: boolean) => void;
  onMarketingChange: (value: boolean) => void;
  onSave: () => void;
  onAcceptAll: () => void;
  onClose: () => void;
}

function Toggle({
  enabled,
  disabled,
  onChange,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange?.(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        enabled ? "bg-blue-500" : "bg-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function CookieSettingsModal({
  analytics,
  marketing,
  onAnalyticsChange,
  onMarketingChange,
  onSave,
  onAcceptAll,
  onClose,
}: CookieSettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/20 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
    >
      <div
        className="glass w-full max-w-lg rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cookie-settings-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Çerez Tercihleri
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Hangi çerez kategorilerinin kullanılacağını seçebilirsiniz.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/20 p-4 dark:border-slate-600/40 dark:bg-slate-800/40">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Zorunlu Çerezler</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Platformun çalışması için gereklidir. Devre dışı bırakılamaz.
              </p>
            </div>
            <Toggle enabled disabled />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/20 p-4 dark:border-slate-600/40 dark:bg-slate-800/40">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Analitik Çerezler</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Kullanım istatistikleri ve performans ölçümü.
              </p>
            </div>
            <Toggle enabled={analytics} onChange={onAnalyticsChange} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/20 p-4 dark:border-slate-600/40 dark:bg-slate-800/40">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Pazarlama Çerezleri</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Kişiselleştirilmiş içerik ve kampanya ölçümü.
              </p>
            </div>
            <Toggle enabled={marketing} onChange={onMarketingChange} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAcceptAll}
            className="flex-1 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600"
          >
            Hepsini Kabul Et
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex-1 rounded-full border border-blue-500/40 bg-white/30 px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-white/50"
          >
            Seçimleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
