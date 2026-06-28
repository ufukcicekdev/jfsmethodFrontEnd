"use client";

import { useEffect } from "react";
import {
  ACIK_RIZA_DOCUMENT,
  AYDINLATMA_DOCUMENT,
} from "@/lib/kvkk/legal-content";
import { LegalDocumentView } from "./LegalDocumentView";

interface KvkkLegalModalProps {
  type: "aydinlatma" | "acik_riza";
  onClose: () => void;
}

export function KvkkLegalModal({ type, onClose }: KvkkLegalModalProps) {
  const title =
    type === "aydinlatma"
      ? "KVKK Aydınlatma Metni"
      : "Açık Rıza Metni — Sağlık Verileri";
  const legalDoc =
    type === "aydinlatma" ? AYDINLATMA_DOCUMENT : ACIK_RIZA_DOCUMENT;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kvkk-modal-title"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
              Yasal Metin
            </p>
            <h2
              id="kvkk-modal-title"
              className="mt-0.5 text-lg font-bold text-slate-900"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            aria-label="Kapat"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="kvkk-scroll min-h-0 flex-1 overflow-y-auto bg-white px-6 py-6 sm:px-8">
          <LegalDocumentView document={legalDoc} />
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-200/80 bg-white/90 px-6 py-4 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-blue-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-600"
          >
            Okudum, Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
