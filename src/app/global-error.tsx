"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>

            <div style={{ margin: "0 auto 32px", display: "flex", height: "96px", width: "96px", alignItems: "center", justifyContent: "center", borderRadius: "24px", backgroundColor: "#fef2f2" }}>
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#f87171">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>

            <h1 style={{ margin: "0 0 12px", fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>
              Kritik bir hata oluştu
            </h1>
            <p style={{ margin: "0 0 32px", fontSize: "15px", color: "#64748b", lineHeight: 1.6 }}>
              Uygulama beklenmedik bir hatayla karşılaştı. Sayfayı yenilemeyi deneyin.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{ borderRadius: "50px", backgroundColor: "#2563eb", padding: "12px 24px", fontSize: "14px", fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}
              >
                Tekrar Dene
              </button>
              <a
                href="/"
                style={{ borderRadius: "50px", border: "1px solid #e2e8f0", backgroundColor: "#fff", padding: "12px 24px", fontSize: "14px", fontWeight: 600, color: "#374151", textDecoration: "none" }}
              >
                Ana Sayfa
              </a>
            </div>

          </div>
        </div>
      </body>
    </html>
  );
}
