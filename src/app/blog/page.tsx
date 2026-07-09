import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { FilterTabs } from "./FilterTabs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jfsmethod.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://jfsmethod.com/api";

export const metadata: Metadata = {
  title: "Blog | JFS Method — Fizyoterapi & Sağlıklı Yaşam",
  description:
    "Fizyoterapi, egzersiz ve sağlıklı yaşam hakkında uzman yazıları. JFS Method bloguyla sağlığınızı yönetin.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: "Blog | JFS Method",
    description: "Fizyoterapi, egzersiz ve sağlıklı yaşam hakkında uzman yazıları.",
    siteName: "JFS Method",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | JFS Method",
    description: "Fizyoterapi, egzersiz ve sağlıklı yaşam hakkında uzman yazıları.",
  },
};

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  is_published: boolean;
  ai_generated: boolean;
  published_at: string | null;
  created_at: string;
  view_count: number;
  excerpt?: string;
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/blog/`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function readingTime(excerpt: string) {
  const words = excerpt.trim().split(/\s+/).length;
  return Math.max(1, Math.round((words * 5) / 200));
}

// ── Featured kart ─────────────────────────────────────────────────────────────
function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-2xl min-h-[340px] flex flex-col justify-end">
        {post.cover_image ? (
          <>
            <img
              src={post.cover_image}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/20" />
          </>
        ) : (
          <>
            {/* Light: koyu lacivert-slate / Dark: canlı violet-blue */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 dark:from-blue-600 dark:via-violet-700 dark:to-indigo-900" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute right-8 top-8 h-56 w-56 rounded-full bg-white/5 dark:bg-white/10 blur-3xl" />
            <div className="absolute left-16 top-16 h-36 w-36 rounded-full bg-blue-400/10 dark:bg-violet-300/20 blur-2xl" />
          </>
        )}
        <div className="relative z-10 p-7">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-emerald-500/30 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-300">
              Öne Çıkan
            </span>
            <span className="text-xs text-white/60">{formatDate(post.published_at)}</span>
            <span className="text-white/30">·</span>
            <span className="text-xs text-white/60">{readingTime(post.excerpt ?? "")} dk okuma</span>
          </div>
          <h2 className="text-xl font-bold text-white sm:text-2xl leading-snug max-w-lg group-hover:text-blue-200 transition-colors">
            {post.title}
          </h2>
          <p className="mt-2 text-white/65 text-sm leading-relaxed line-clamp-2 max-w-lg">
            {post.excerpt}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-2 text-xs font-semibold text-white group-hover:bg-white/25 transition-colors">
              Yazıyı Oku
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="flex items-center gap-1 text-xs text-white/40">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" opacity=".6"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>
              {post.view_count}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Normal kart ───────────────────────────────────────────────────────────────
function PostCard({ post, large }: { post: BlogPost; large?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className={`h-full flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-900/80 ${large ? "sm:flex-row" : ""}`}>
        <div className={`overflow-hidden bg-gradient-to-br from-blue-100 to-violet-100 dark:from-slate-800 dark:to-slate-700 ${large ? "sm:w-2/5 sm:shrink-0 aspect-video sm:aspect-auto" : "aspect-video"}`}>
          {post.cover_image ? (
            <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <svg className="h-10 w-10 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(post.published_at)}</span>
            <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{readingTime(post.excerpt ?? "")} dk</span>
          </div>
          <h2 className={`font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2 ${large ? "text-lg" : "text-sm"}`}>
            {post.title}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 flex-1 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-1.5 transition-all">
              Devamını oku
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" opacity=".5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>
              {post.view_count}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Sidebar: en çok okunan ────────────────────────────────────────────────────
function PopularPost({ post, rank }: { post: BlogPost; rank: number }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex gap-3 py-3">
      <span className="text-2xl font-black text-slate-200 dark:text-slate-700 w-6 shrink-0 leading-none mt-0.5">
        {rank}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {post.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-slate-400">{formatDate(post.published_at)}</span>
          <span className="flex items-center gap-0.5 text-xs text-slate-400">
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" opacity=".5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>
            {post.view_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const posts = await getPosts();

  const sorted = sort === "popular"
    ? [...posts].sort((a, b) => b.view_count - a.view_count)
    : posts;

  const popular = [...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 5);
  const featured = sorted[0] ?? null;
  const rest = sorted.slice(1);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">

        {/* Hero header */}
        <div className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/60 pb-12 pt-32">
          {/* Light: beyaz → hafif mavi-violet; Dark: siyah → mavi tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(139,92,246,0.12),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(59,130,246,0.18),transparent)]" />
          {/* Dekoratif blob */}
          <div className="absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-violet-200/40 dark:bg-violet-900/15 blur-3xl pointer-events-none" />
          <div className="absolute -top-10 left-1/3 h-60 w-60 rounded-full bg-blue-200/40 dark:bg-blue-900/15 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 dark:border-blue-800/60 dark:bg-blue-900/30 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Blog</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Sağlık &{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Fizyoterapi
              </span>
            </h1>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Uzman görüşleri, egzersiz rehberleri ve sağlıklı yaşam ipuçları.
            </p>
          </div>
        </div>

        {/* İçerik */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-4 rounded-full bg-slate-100 dark:bg-slate-800 p-6">
                <svg className="h-10 w-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Henüz blog yazısı yok.</p>
              <p className="mt-1 text-sm text-slate-400">Yakında içerikler eklenecek.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 xl:gap-14">

              {/* Sol — yazılar */}
              <div className="space-y-8">
                {/* Filtre */}
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{posts.length}</span> yazı
                  </p>
                  <Suspense fallback={null}>
                    <FilterTabs />
                  </Suspense>
                </div>

                {/* Featured */}
                {featured && <FeaturedCard post={featured} />}

                {/* Rest */}
                {rest.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {sort === "popular" ? "En Çok Okunanlar" : "Son Yazılar"}
                      </h2>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {rest.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sağ — sidebar */}
              <aside className="space-y-6">

                {/* En çok okunan */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-md p-5 dark:border-slate-700/60 dark:bg-slate-900/80 sticky top-24">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      En Çok Okunan
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {popular.map((post, i) => (
                      <PopularPost key={post.id} post={post} rank={i + 1} />
                    ))}
                  </div>
                </div>

                {/* Hakkında kutu */}
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-violet-50 p-5 dark:border-slate-700/60 dark:from-blue-900/20 dark:to-violet-900/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">JFS Method</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Fizyoterapi & Sağlık</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Uzman fizyoterapistler tarafından hazırlanan içeriklerle sağlıklı yaşam yolculuğunuza rehberlik ediyoruz.
                  </p>
                  <Link
                    href="/#hizmetler"
                    className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:gap-2 transition-all"
                  >
                    Hizmetlerimiz
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                  </Link>
                </div>

              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
