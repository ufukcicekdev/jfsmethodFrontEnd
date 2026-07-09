import Link from "next/link";

export const metadata = {
  title: "Sayfa Bulunamadı — JFS Method",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">

        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
          <span className="text-5xl font-black text-slate-300 dark:text-slate-600">4</span>
          <span className="text-5xl font-black text-blue-500">0</span>
          <span className="text-5xl font-black text-slate-300 dark:text-slate-600">4</span>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-50">
          Sayfa bulunamadı
        </h1>
        <p className="mb-8 text-base text-slate-500 dark:text-slate-400">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Blog'a Git
          </Link>
        </div>

      </div>
    </div>
  );
}
