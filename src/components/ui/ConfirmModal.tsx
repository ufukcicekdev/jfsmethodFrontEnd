"use client";

export interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = "Emin misiniz?",
  message,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 focus-visible:ring-red-400"
      : "bg-blue-500 hover:bg-blue-600 focus-visible:ring-blue-400";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/30 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-slate-600/40 dark:bg-slate-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-modal-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-50"
        >
          {title}
        </h2>
        <p
          id="confirm-modal-message"
          className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
        >
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full border border-slate-300/70 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600/60 dark:text-slate-200 dark:hover:bg-slate-800/60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 ${confirmClass}`}
          >
            {loading ? "İşleniyor…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
