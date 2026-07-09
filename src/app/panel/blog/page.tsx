"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { getAccessToken } from "@/lib/auth";
import { api, type BlogPost, type BlogTopic } from "@/lib/api";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

const SUGGESTED_TOPICS = [
  "Bel fıtığında evde yapılabilecek egzersizler",
  "Skolyoz nedir, belirtileri ve tedavi yöntemleri",
  "Diz ağrısına karşı güçlendirme egzersizleri",
  "Boyun düzleşmesi (düz boyun) nedenleri ve çözümleri",
  "Omuz sıkışma sendromunda fizyoterapi",
  "Sporcu yaralanmalarında rehabilitasyon süreci",
  "Postür bozukluğu neden olur, nasıl düzeltilir?",
  "Plantar fasiit: Topuk ağrısının nedeni ve tedavisi",
  "Günlük 10 dakikalık esneme rutini",
  "Masa başı çalışanlarda kas-iskelet sorunları",
  "Yaşlılarda denge egzersizleri ve düşme önleme",
  "Romatoid artrit hastalarında hareket egzersizleri",
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

type Tab = "posts" | "topics" | "generate";

export default function AdminBlogPage() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [topics, setTopics] = useState<BlogTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Post form
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState({ title: "", content: "", is_published: false });
  const [savingPost, setSavingPost] = useState(false);

  // Topic form
  const [topicForm, setTopicForm] = useState({ topic: "", scheduled_date: "" });
  const [savingTopic, setSavingTopic] = useState(false);

  // Generate
  const [genTopic, setGenTopic] = useState("");
  const [genTopicId, setGenTopicId] = useState<number | "">("");
  const [generating, setGenerating] = useState(false);
  const [genDropdownOpen, setGenDropdownOpen] = useState(false);
  const genDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (genDropdownRef.current && !genDropdownRef.current.contains(e.target as Node)) {
        setGenDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notify = (text: string, type: "success" | "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadData = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        api.admin.blog.posts.list(token),
        api.admin.blog.topics.list(token),
      ]);
      setPosts(p);
      setTopics(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Post actions ─────────────────────────────────────────────────────────────

  const openNewPost = () => {
    setEditingPost(null);
    setPostForm({ title: "", content: "", is_published: false });
    setShowPostForm(true);
  };

  const openEditPost = async (post: BlogPost) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const full = await api.admin.blog.posts.get(token, post.id);
      setEditingPost(full);
      setPostForm({ title: full.title, content: full.content, is_published: full.is_published });
    } catch {
      setEditingPost(post);
      setPostForm({ title: post.title, content: post.content ?? "", is_published: post.is_published });
    }
    setShowPostForm(true);
  };

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    if (!postForm.title.trim() || !postForm.content.trim()) {
      notify("Başlık ve içerik zorunludur.", "error");
      return;
    }
    setSavingPost(true);
    try {
      if (editingPost) {
        await api.admin.blog.posts.update(token, editingPost.id, postForm);
        notify("Yazı güncellendi.", "success");
      } else {
        await api.admin.blog.posts.create(token, postForm);
        notify("Yazı oluşturuldu.", "success");
      }
      setShowPostForm(false);
      loadData();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Hata.", "error");
    } finally {
      setSavingPost(false);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await api.admin.blog.posts.update(token, post.id, { is_published: !post.is_published });
      loadData();
    } catch {
      notify("Durum değiştirilemedi.", "error");
    }
  };

  const deletePost = async (post: BlogPost) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Yazıyı Sil", message: `"${post.title}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try {
      await api.admin.blog.posts.delete(token, post.id);
      notify("Yazı silindi.", "success");
      loadData();
    } catch {
      notify("Silinemedi.", "error");
    }
  };

  // ── Topic actions ─────────────────────────────────────────────────────────────

  const saveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    if (!topicForm.topic.trim() || !topicForm.scheduled_date) {
      notify("Konu ve tarih zorunludur.", "error");
      return;
    }
    setSavingTopic(true);
    try {
      await api.admin.blog.topics.create(token, topicForm);
      notify("Konu eklendi.", "success");
      setTopicForm({ topic: "", scheduled_date: "" });
      loadData();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Hata.", "error");
    } finally {
      setSavingTopic(false);
    }
  };

  const deleteTopic = async (topic: BlogTopic) => {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({ title: "Konuyu Sil", message: `"${topic.topic}" silinecek.`, confirmLabel: "Sil", variant: "danger" });
    if (!ok) return;
    try {
      await api.admin.blog.topics.delete(token, topic.id);
      notify("Konu silindi.", "success");
      loadData();
    } catch {
      notify("Silinemedi.", "error");
    }
  };

  // ── Generate ──────────────────────────────────────────────────────────────────

  const generate = async () => {
    const token = getAccessToken();
    if (!token) return;
    if (!genTopic.trim() && !genTopicId) {
      notify("Bir konu yazın veya seçin.", "error");
      return;
    }
    setGenerating(true);
    try {
      const data = genTopicId
        ? { topic_id: genTopicId as number }
        : { topic: genTopic };
      const post = await api.admin.blog.generate(token, data);
      notify(`"${post.title}" oluşturuldu ve yayınlandı.`, "success");
      setGenTopic("");
      setGenTopicId("");
      loadData();
      setTab("posts");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gemini API hatası.", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">Blog Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Yazı oluştur, konu kuyruğu planla, Gemini AI ile otomatik içerik üret.
          </p>
        </div>
        {tab === "posts" && (
          <button type="button" onClick={openNewPost} className="shrink-0 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">
            + Yeni Yazı
          </button>
        )}
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.type === "error" ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/50 w-fit">
        {(["posts", "topics", "generate"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === t ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            {t === "posts" ? `Yazılar (${posts.length})` : t === "topics" ? `Konu Kuyruğu (${topics.length})` : "AI Üret"}
          </button>
        ))}
      </div>

      {/* ── POSTS TAB ── */}
      {tab === "posts" && (
        <>
          {showPostForm && (
            <GlassCard className="p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                {editingPost ? "Yazıyı Düzenle" : "Yeni Blog Yazısı"}
              </h2>
              <form onSubmit={savePost} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Başlık</label>
                  <input
                    type="text"
                    required
                    value={postForm.title}
                    onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                    placeholder="Blog yazısı başlığı…"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">İçerik</label>
                  <RichTextEditor
                    value={postForm.content}
                    onChange={(html) => setPostForm((f) => ({ ...f, content: html }))}
                    placeholder="Yazı içeriğini buraya girin…"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={postForm.is_published}
                    onChange={(e) => setPostForm((f) => ({ ...f, is_published: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-500"
                  />
                  Hemen yayınla
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingPost} className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
                    {savingPost ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                  <button type="button" onClick={() => setShowPostForm(false)} className="rounded-full border border-slate-300/60 px-6 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600/60 dark:text-slate-200">
                    İptal
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
          ) : posts.length === 0 ? (
            <GlassCard className="p-10 text-center"><p className="text-slate-400">Henüz blog yazısı yok.</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <GlassCard key={post.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${post.is_published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                          {post.is_published ? "Yayında" : "Taslak"}
                        </span>
                        {post.ai_generated && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">AI</span>
                        )}
                        <span className="text-xs text-slate-400">{formatDate(post.published_at ?? post.created_at)}</span>
                        <span className="text-xs text-slate-400">{post.view_count} görüntülenme</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{post.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400 font-mono">/blog/{post.slug}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => togglePublish(post)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${post.is_published ? "border-amber-300/60 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30" : "border-emerald-300/60 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"}`}
                      >
                        {post.is_published ? "Gizle" : "Yayınla"}
                      </button>
                      <button type="button" onClick={() => openEditPost(post)} className="rounded-full border border-slate-300/60 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-200">
                        Düzenle
                      </button>
                      <button type="button" onClick={() => deletePost(post)} className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">
                        Sil
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TOPICS TAB ── */}
      {tab === "topics" && (
        <>
          <GlassCard className="p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Yeni Konu Ekle</h2>
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Örnek Konular (tıkla seç)</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopicForm((f) => ({ ...f, topic: t }))}
                    className="rounded-full border border-slate-300/60 px-3 py-1 text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors dark:border-slate-600/60 dark:text-slate-300"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={saveTopic} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  required
                  value={topicForm.topic}
                  onChange={(e) => setTopicForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="Konu başlığı…"
                  className="flex-1 rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
                <input
                  type="date"
                  required
                  value={topicForm.scheduled_date}
                  onChange={(e) => setTopicForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                  className="rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
                />
                <button type="submit" disabled={savingTopic} className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 shrink-0">
                  {savingTopic ? "…" : "Ekle"}
                </button>
              </div>
            </form>
          </GlassCard>

          {loading ? (
            <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /></div>
          ) : topics.length === 0 ? (
            <GlassCard className="p-10 text-center"><p className="text-slate-400">Konu kuyruğu boş.</p></GlassCard>
          ) : (
            <div className="space-y-2">
              {topics.map((topic) => (
                <GlassCard key={topic.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 rounded-full w-2 h-2 ${topic.is_generated ? "bg-emerald-400" : "bg-amber-400"}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-sm line-clamp-1">{topic.topic}</p>
                        <p className="text-xs text-slate-400">{formatDate(topic.scheduled_date)} · {topic.is_generated ? "Üretildi" : "Bekliyor"}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => deleteTopic(topic)} className="shrink-0 rounded-full border border-red-500/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400">
                      Sil
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── GENERATE TAB ── */}
      {tab === "generate" && (
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-6">Gemini AI ile İçerik Üret</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Kuyruktan Konu Seç</label>
              <div className="relative" ref={genDropdownRef}>
                <button
                  type="button"
                  onClick={() => setGenDropdownOpen((o) => !o)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 dark:bg-slate-800/50 dark:text-slate-100 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <span className={genTopicId ? "text-slate-800 dark:text-slate-100" : "text-slate-400"}>
                    {genTopicId
                      ? topics.find((t) => t.id === genTopicId)?.topic ?? "— Seçin —"
                      : "— Seçin —"}
                  </span>
                  <svg className={`h-4 w-4 text-slate-400 transition-transform ${genDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {genDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => { setGenTopicId(""); setGenTopic(""); setGenDropdownOpen(false); }}
                      className="flex w-full items-center px-4 py-3 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      — Seçin —
                    </button>
                    {topics.filter((t) => !t.is_generated).length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-400 italic">Bekleyen konu yok</div>
                    ) : (
                      topics.filter((t) => !t.is_generated).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { setGenTopicId(t.id); setGenTopic(""); setGenDropdownOpen(false); }}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 ${genTopicId === t.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                        >
                          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                          <div>
                            <p className={`font-medium leading-snug ${genTopicId === t.id ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-100"}`}>
                              {t.topic}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">{t.scheduled_date}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">ya da</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Serbest Konu</label>
              <input
                type="text"
                value={genTopic}
                onChange={(e) => { setGenTopic(e.target.value); setGenTopicId(""); }}
                placeholder="Örn: Fibromiyalji hastalarında egzersiz…"
                className="w-full rounded-xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800/50 dark:text-slate-100"
              />
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hızlı Konular</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.slice(0, 6).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setGenTopic(t); setGenTopicId(""); }}
                    className="rounded-full border border-slate-300/60 px-3 py-1 text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors dark:border-slate-600/60 dark:text-slate-300"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={generating || (!genTopic.trim() && !genTopicId)}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 py-3 text-sm font-semibold text-white hover:from-violet-600 hover:to-blue-600 disabled:opacity-50 transition-all"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Gemini yazıyor… (30-60 sn sürebilir)
                </span>
              ) : (
                "Gemini ile Blog Yazısı Oluştur"
              )}
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
