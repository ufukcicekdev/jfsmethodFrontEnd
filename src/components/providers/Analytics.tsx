"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

/**
 * Site ayarlarından Google Analytics ölçüm kimliğini ve Search Console
 * doğrulama içeriğini okuyup ilgili etiketleri <head>'e enjekte eder.
 * Değerler boşsa hiçbir şey eklenmez.
 */
export function Analytics() {
  useEffect(() => {
    let cancelled = false;

    api.site
      .settings()
      .then((settings) => {
        if (cancelled) return;

        const gaId = settings.google_analytics_id?.trim();
        const verification =
          settings.google_search_console_verification?.trim();

        if (
          verification &&
          !document.querySelector('meta[name="google-site-verification"]')
        ) {
          const meta = document.createElement("meta");
          meta.name = "google-site-verification";
          meta.content = verification;
          document.head.appendChild(meta);
        }

        if (gaId && !document.getElementById("ga-gtag")) {
          const loader = document.createElement("script");
          loader.id = "ga-gtag";
          loader.async = true;
          loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
            gaId
          )}`;
          document.head.appendChild(loader);

          const inline = document.createElement("script");
          inline.id = "ga-gtag-init";
          inline.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
          document.head.appendChild(inline);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
