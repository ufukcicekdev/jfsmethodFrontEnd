"use client";

interface KvkkConsentCheckboxesProps {
  kvkkAccepted: boolean;
  acikRizaAccepted: boolean;
  onKvkkChange: (value: boolean) => void;
  onAcikRizaChange: (value: boolean) => void;
  onOpenAydinlatma: () => void;
  onOpenAcikRiza: () => void;
}

export function KvkkConsentCheckboxes({
  kvkkAccepted,
  acikRizaAccepted,
  onKvkkChange,
  onAcikRizaChange,
  onOpenAydinlatma,
  onOpenAcikRiza,
}: KvkkConsentCheckboxesProps) {
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/90 bg-white/70 p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-600/50 dark:bg-slate-800/60 dark:hover:border-slate-500 dark:hover:bg-slate-800/80">
        <input
          type="checkbox"
          checked={kvkkAccepted}
          onChange={(e) => onKvkkChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
        />
        <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onOpenAydinlatma();
            }}
            className="inline font-semibold text-blue-600 underline-offset-2 hover:underline"
          >
            KVKK Aydınlatma Metni
          </button>
          {"'ni okudum ve anladım."}
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/90 bg-white/70 p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-600/50 dark:bg-slate-800/60 dark:hover:border-slate-500 dark:hover:bg-slate-800/80">
        <input
          type="checkbox"
          checked={acikRizaAccepted}
          onChange={(e) => onAcikRizaChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
        />
        <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onOpenAcikRiza();
            }}
            className="inline font-semibold text-blue-600 underline-offset-2 hover:underline"
          >
            Açık Rıza Metni
          </button>
          {"'ni (özel nitelikli sağlık verileri) okudum ve kabul ediyorum."}
        </span>
      </label>
    </div>
  );
}
