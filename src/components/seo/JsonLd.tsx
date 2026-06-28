"use client";

import { useEffect, useState } from "react";
import { api, type Faq } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jfsmethod.com";

function LocalBusinessSchema() {
  const [settings, setSettings] = useState<{ clinic_name: string; phone: string; address: string; email: string } | null>(null);

  useEffect(() => {
    api.site.settings().then((s) => setSettings(s)).catch(() => undefined);
  }, []);

  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MedicalBusiness", "HealthAndBeautyBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: settings?.clinic_name ?? "JFS Method",
    description: "Fizyoterapi sonrası bilimsel temelli hareket danışmanlığı, postür analizi ve kişiye özel rehabilitasyon programları.",
    url: SITE_URL,
    telephone: settings?.phone ?? "",
    email: settings?.email ?? "",
    address: settings?.address ? {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressCountry: "TR",
      addressLocality: "Türkiye",
    } : undefined,
    priceRange: "₺₺",
    currenciesAccepted: "TRY",
    openingHours: "Mo-Sa 09:00-19:00",
    image: `${SITE_URL}/screenshot-wide.png`,
    logo: `${SITE_URL}/icon-512.png`,
    sameAs: [],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Hizmetler",
      itemListElement: [
        { "@type": "Offer", name: "Online Hareket Danışmanlığı" },
        { "@type": "Offer", name: "Postür Analizi" },
        { "@type": "Offer", name: "Dijital Vücut Takibi" },
        { "@type": "Offer", name: "Yüz Yüze Fizyoterapi Seansı" },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "JFS Method",
    description: "Fizyoterapi sonrası hareket danışmanlığı platformu",
    inLanguage: "tr-TR",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function FaqSchema() {
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    api.faqs.list().then(setFaqs).catch(() => undefined);
  }, []);

  if (faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function JsonLd() {
  return (
    <>
      <WebSiteSchema />
      <LocalBusinessSchema />
      <FaqSchema />
    </>
  );
}
