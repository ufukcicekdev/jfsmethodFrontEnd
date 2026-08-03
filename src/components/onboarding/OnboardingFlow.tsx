"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type OnboardingQuestion, type OnboardingSection } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface Props {
  onComplete: () => void;
}

type AnswerValue = string | string[] | number;

// Flat step: either a "section-intro" or a "question"
type Step =
  | { kind: "intro"; section: OnboardingSection }
  | { kind: "question"; question: OnboardingQuestion; sectionTitle: string; sectionIndex: number; totalSections: number };

const STORAGE_KEY = "onboarding_draft";

function loadDraft(): { current: number; answers: Record<number, AnswerValue> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { current: 0, answers: {} };
}

function saveDraft(current: number, answers: Record<number, AnswerValue>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ current, answers }));
  } catch { /* ignore */ }
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function OnboardingFlow({ onComplete }: Props) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Restore draft on first load
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    api.onboarding.questions(token)
      .then(({ sections, unassigned_questions }) => {
        const built: Step[] = [];
        const totalSections = sections.length;

        sections.forEach((section, sIdx) => {
          const activeQs = section.questions.filter((q) => q.is_active !== false);
          if (activeQs.length === 0) return;
          built.push({ kind: "intro", section });
          activeQs.forEach((q) => {
            built.push({ kind: "question", question: q, sectionTitle: section.title, sectionIndex: sIdx + 1, totalSections });
          });
        });

        unassigned_questions.filter((q) => q.is_active !== false).forEach((q) => {
          built.push({ kind: "question", question: q, sectionTitle: "", sectionIndex: 0, totalSections });
        });

        setSteps(built);

        // Restore saved progress after steps are known
        const draft = loadDraft();
        if (draft.current > 0 || Object.keys(draft.answers).length > 0) {
          // Clamp current to valid range
          setCurrent(Math.min(draft.current, built.length - 1));
          setAnswers(draft.answers);
        }
        setDraftRestored(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Persist progress whenever current or answers change (after restore)
  useEffect(() => {
    if (!draftRestored) return;
    saveDraft(current, answers);
  }, [current, answers, draftRestored]);

  const step = steps[current];
  const totalSteps = steps.length;

  const navigate = useCallback((dir: "forward" | "back") => {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => (dir === "forward" ? c + 1 : c - 1));
      setAnimating(false);
    }, 220);
  }, []);

  const canNext = () => {
    if (!step) return false;
    if (step.kind === "intro") return true;
    const q = step.question;
    if (!q.is_required) return true;
    const a = answers[q.id];
    if (a === undefined || a === null || a === "") return false;
    if (Array.isArray(a) && a.length === 0) return false;
    return true;
  };

  const allQuestions = steps
    .filter((s): s is Extract<Step, { kind: "question" }> => s.kind === "question")
    .map((s) => s.question);

  const handleSubmit = async () => {
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      await api.onboarding.submit(
        token,
        allQuestions.map((q) => ({ question_id: q.id, answer: answers[q.id] ?? "" }))
      );
      clearDraft();
      onComplete();
    } catch {
      setError("Gönderim başarısız. Lütfen tekrar deneyin.");
      setSubmitting(false);
    }
  };

  const setAnswer = (val: AnswerValue) => {
    if (!step || step.kind !== "question") return;
    setAnswers((prev) => ({ ...prev, [step.question.id]: val }));
  };

  // Progress: count how many question-steps done
  const questionStepsBefore = steps.slice(0, current + 1).filter((s) => s.kind === "question").length;
  const totalQuestionSteps = steps.filter((s) => s.kind === "question").length;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
      </div>
    );
  }

  if (totalSteps === 0) return null;

  const isLast = current === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {step?.kind === "question" && step.sectionTitle ? step.sectionTitle : "Hoş Geldiniz"}
        </div>
        {totalQuestionSteps > 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {Math.min(questionStepsBefore, totalQuestionSteps)} / {totalQuestionSteps}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: totalQuestionSteps > 0 ? `${(questionStepsBefore / totalQuestionSteps) * 100}%` : "0%" }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
        <div
          className={`w-full max-w-xl transition-all duration-200 ${
            animating
              ? direction === "forward" ? "translate-x-6 opacity-0" : "-translate-x-6 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          {/* Section intro */}
          {step?.kind === "intro" && (
            <div className="space-y-4 text-center">
              {steps.filter((s) => s.kind === "intro").length > 1 && (
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                  Bölüm {step.section.sort_order + 1}
                </p>
              )}
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {step.section.title}
              </h2>
              {step.section.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{step.section.description}</p>
              )}
              <p className="text-sm text-slate-400">
                {step.section.questions.filter((q) => q.is_active !== false).length} soru
              </p>
            </div>
          )}

          {/* Question */}
          {step?.kind === "question" && (() => {
            const question = step.question;
            const answer = answers[question.id];
            return (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                    {step.sectionTitle || "Soru"}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-50">
                    {question.text}
                    {question.is_required && <span className="ml-1 text-red-500">*</span>}
                  </h2>
                </div>

                {question.question_type === "text" && (
                  <textarea
                    rows={4}
                    value={(answer as string) ?? ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Cevabınızı yazın..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                )}

                {question.question_type === "choice" && (
                  <div className="space-y-3">
                    {question.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer(opt)}
                        className={`w-full rounded-2xl border-2 px-5 py-4 text-left text-sm font-medium transition-all ${
                          answer === opt
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {question.question_type === "multi" && (
                  <div className="space-y-3">
                    {question.options.map((opt) => {
                      const selected = Array.isArray(answer) && answer.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const prev = Array.isArray(answer) ? [...answer] : [];
                            setAnswer(selected ? prev.filter((v) => v !== opt) : [...prev, opt]);
                          }}
                          className={`flex w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left text-sm font-medium transition-all ${
                            selected
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${selected ? "border-blue-500 bg-blue-500" : "border-slate-300 dark:border-slate-600"}`}>
                            {selected && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {question.question_type === "scale" && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(n)}
                        className={`h-12 w-12 rounded-xl border-2 text-sm font-bold transition-all ${
                          answer === n
                            ? "border-blue-500 bg-blue-500 text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-5 dark:border-slate-800">
        <button
          type="button"
          onClick={() => navigate("back")}
          disabled={current === 0}
          className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Geri
        </button>

        {!isLast ? (
          <button
            type="button"
            onClick={() => navigate("forward")}
            disabled={!canNext()}
            className="rounded-full bg-blue-500 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-40"
          >
            {step?.kind === "intro" ? "Başla" : "İleri"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canNext() || submitting}
            className="rounded-full bg-emerald-500 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-40"
          >
            {submitting ? "Gönderiliyor…" : "Tamamla"}
          </button>
        )}
      </div>
    </div>
  );
}
