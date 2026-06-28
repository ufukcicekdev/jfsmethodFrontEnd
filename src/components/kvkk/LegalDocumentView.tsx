import type { LegalDocument } from "@/lib/kvkk/legal-content";

interface LegalDocumentViewProps {
  document: LegalDocument;
}

export function LegalDocumentView({ document }: LegalDocumentViewProps) {
  return (
    <article className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4">
        <p className="text-sm font-medium text-slate-500">JFS Method</p>
        <p className="mt-1 text-base font-semibold text-slate-800">
          {document.subtitle}
        </p>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {document.meta.map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-sm text-slate-700">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {document.sections.map((section) => (
        <section key={section.title}>
          <h3 className="text-sm font-bold text-slate-800">{section.title}</h3>
          {section.paragraphs?.map((p) => (
            <p
              key={p}
              className="mt-2 text-[15px] leading-7 text-slate-600"
            >
              {p}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-3 space-y-2">
              {section.bullets.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-[15px] leading-7 text-slate-600"
                >
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {document.footer && (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          {document.footer}
        </p>
      )}
    </article>
  );
}
