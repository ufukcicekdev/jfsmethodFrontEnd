import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ShareButtons, SidebarShareIcons } from "./ShareButtons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jfsmethod.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://jfsmethod.com/api";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  is_published: boolean;
  ai_generated: boolean;
  published_at: string | null;
  created_at: string;
  view_count: number;
  excerpt?: string;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/blog/${slug}/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getRecentPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/blog/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Yazı bulunamadı | JFS Method" };
  }

  const excerpt = post.excerpt ?? post.content?.replace(/<[^>]+>/g, " ").slice(0, 160) ?? "";
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${post.title} | JFS Method Blog`,
    description: excerpt,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: post.title,
      description: excerpt,
      siteName: "JFS Method",
      publishedTime: post.published_at ?? undefined,
      ...(post.cover_image ? { images: [{ url: post.cover_image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: post.cover_image ? "summary_large_image" : "summary",
      title: post.title,
      description: excerpt,
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function readingTime(content: string) {
  const text = content.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, recentPosts] = await Promise.all([getPost(slug), getRecentPosts()]);

  if (!post) notFound();

  const mins = readingTime(post.content || "");
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const otherPosts = recentPosts.filter((p) => p.slug !== slug).slice(0, 5);

  // JSON-LD Article yapılandırılmış veri
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? "",
    url: canonicalUrl,
    datePublished: post.published_at,
    dateModified: post.published_at,
    publisher: {
      "@type": "Organization",
      name: "JFS Method",
      url: SITE_URL,
    },
    ...(post.cover_image
      ? { image: { "@type": "ImageObject", url: post.cover_image } }
      : {}),
  };

  return (
    <>
      <Navbar />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Hero kapak */}
        {post.cover_image && (
          <div className="relative h-[380px] sm:h-[460px] w-full overflow-hidden">
            <img
              src={post.cover_image}
              alt={post.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-10 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors mb-4"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                  </svg>
                  Blog'a dön
                </Link>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-xs text-white/60">{formatDate(post.published_at)}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-xs text-white/60">{mins} dk okuma</span>
                  <span className="text-white/30">·</span>
                  <span className="text-xs text-white/60">{post.view_count} görüntülenme</span>
                </div>
                <h1 className="text-2xl font-black text-white sm:text-3xl lg:text-4xl max-w-3xl leading-tight">
                  {post.title}
                </h1>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {/* Kapak yoksa başlık burada */}
          {!post.cover_image && (
            <>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-500 transition-colors mb-8"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                Blog'a dön
              </Link>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm text-slate-400">{formatDate(post.published_at)}</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-sm text-slate-400">{mins} dk okuma</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-sm text-slate-400">{post.view_count} görüntülenme</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl lg:text-5xl max-w-3xl leading-tight mb-10">
                {post.title}
              </h1>
            </>
          )}

          {/* İki kolon */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 xl:gap-16">
            {/* Ana içerik */}
            <article>
              <div
                className="
                  prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed
                  [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h1]:mt-10 [&_h1]:mb-4
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-slate-200 dark:[&_h2]:border-slate-700 [&_h2]:pb-2
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-800 dark:[&_h3]:text-slate-100 [&_h3]:mt-7 [&_h3]:mb-3
                  [&_p]:mb-5 [&_p]:leading-8 [&_p]:text-base
                  [&_ul]:my-4 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1.5
                  [&_ol]:my-4 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1.5
                  [&_li]:leading-7 [&_li]:text-base
                  [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100
                  [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-5 [&_blockquote]:py-1 [&_blockquote]:my-6 [&_blockquote]:bg-blue-50 dark:[&_blockquote]:bg-blue-900/20 [&_blockquote]:rounded-r-xl [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-400 [&_blockquote]:italic
                  [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2
                  [&_img]:rounded-2xl [&_img]:my-6 [&_img]:shadow-md
                  [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700 [&_hr]:my-8
                "
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Paylaş — makale altı */}
              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700/80">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                  Bu yazıyı paylaş
                </p>
                <ShareButtons url={canonicalUrl} title={post.title} />
              </div>
            </article>

            {/* Sağ sidebar */}
            <aside className="space-y-6">
              {/* Yazı özet kutusu — sticky */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 dark:border-slate-700/60 dark:bg-slate-900/80 sticky top-24">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                  Bu Yazı
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                      <svg className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Okuma süresi</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{mins} dakika</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/30">
                      <svg className="h-4 w-4 text-violet-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Görüntülenme</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{post.view_count}</p>
                    </div>
                  </div>
                  {post.published_at && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                        <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Yayın tarihi</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {formatDate(post.published_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/60">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                    Paylaş
                  </p>
                  <SidebarShareIcons url={canonicalUrl} title={post.title} />
                </div>
              </div>

              {/* Diğer yazılar */}
              {otherPosts.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 dark:border-slate-700/60 dark:bg-slate-900/80">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    Diğer Yazılar
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {otherPosts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/blog/${p.slug}`}
                        className="group flex gap-3 py-3"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-slate-700 dark:to-slate-600">
                          {p.cover_image ? (
                            <img src={p.cover_image} alt={p.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <svg className="h-6 w-6 text-slate-300 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                            {p.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{formatDate(p.published_at)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/blog"
                    className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Tüm yazıları gör
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
