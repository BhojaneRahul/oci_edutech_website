"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layers3, Loader2, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { MockTest, MockTestAttempt, MockTestDetailResponse, MockTestQuestion, MockTestResult } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { BottomNavigation } from "./bottom-navigation";
import { QuestionCard } from "./question-card";
import { QuestionPalette } from "./question-palette";
import { ResultPage } from "./result-page";
import { RulesScreen } from "./rules-screen";
import { TestHeader } from "./test-header";

type StartResponse = {
  success: true;
  mockTest: MockTest;
  attempt: MockTestAttempt;
};

type AnswerResponse = {
  success: true;
  answer: {
    questionId: number;
    selectedOption: "A" | "B" | "C" | "D";
    isCorrect: boolean;
  };
  attempt: MockTestAttempt;
};

type SubmitResponse = {
  success: true;
  result: MockTestResult;
};

export function MockTestPageClient({
  initialMockTest,
  initialAttempt
}: {
  initialMockTest: MockTest;
  initialAttempt: MockTestAttempt | null;
}) {
  const { user, loading } = useAuth();
  const [mockTest] = useState(initialMockTest);
  const [attempt, setAttempt] = useState<MockTestAttempt | null>(initialAttempt);
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, (initialAttempt?.currentQuestion ?? 1) - 1));
  const [starting, setStarting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MockTestResult | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const exitHandledRef = useRef(false);

  const questions = mockTest.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answerMap = useMemo(
    () =>
      Object.fromEntries(
        (attempt?.answers ?? []).map((answer) => [Number(answer.questionId), answer.selectedOption])
      ) as Record<number, "A" | "B" | "C" | "D">,
    [attempt?.answers]
  );
  const answeredQuestionIds = useMemo(
    () => (attempt?.answers ?? []).map((answer) => Number(answer.questionId)),
    [attempt?.answers]
  );
  const unlockedUntil = Math.max(1, attempt?.currentQuestion ?? 1);
  const currentSelectedOption = currentQuestion ? answerMap[Number(currentQuestion._id)] : undefined;
  const allQuestionsAnswered = questions.length > 0 && answeredQuestionIds.length >= questions.length;
  const hasStarted = Boolean(attempt?.started && !attempt.completed && !attempt.exited);

  useEffect(() => {
    if (initialAttempt) {
      setCurrentIndex(Math.max(0, initialAttempt.currentQuestion - 1));
    }
  }, [initialAttempt]);

  const handleExitPenalty = useCallback(async () => {
    if (!attempt || result || exitHandledRef.current || attempt.completed || attempt.exited) {
      return;
    }

    exitHandledRef.current = true;

    const payload = JSON.stringify({ attemptId: attempt._id });
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/mocktests/exit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: payload,
        keepalive: true
      });
    } catch {
      // best-effort only
    }
  }, [attempt, result]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    const onBeforeUnload = () => {
      handleExitPenalty();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [handleExitPenalty, hasStarted]);

  const startTest = async () => {
    try {
      setStarting(true);
      setError(null);
      const response = await api.post<StartResponse>("/mocktests/start", {
        mockTestId: Number(mockTest._id)
      });
      setAttempt(response.data.attempt);
      setCurrentIndex(Math.max(0, response.data.attempt.currentQuestion - 1));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Unable to start this mock test.");
    } finally {
      setStarting(false);
    }
  };

  const saveAnswer = async (selectedOption: "A" | "B" | "C" | "D") => {
    if (!attempt || !currentQuestion) {
      return;
    }

    try {
      setSavingAnswer(true);
      setError(null);
      const response = await api.post<AnswerResponse>("/mocktests/answer", {
        attemptId: attempt._id,
        questionId: Number(currentQuestion._id),
        selectedOption
      });

      setAttempt(response.data.attempt);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Unable to save your answer.");
    } finally {
      setSavingAnswer(false);
    }
  };

  const submitTest = useCallback(async () => {
    if (!attempt || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      exitHandledRef.current = true;
      const response = await api.post<SubmitResponse>("/mocktests/submit", {
        attemptId: attempt._id
      });
      setResult(response.data.result);
      setAttempt((currentAttempt) =>
        currentAttempt
          ? {
              ...currentAttempt,
              completed: true,
              xpEarned: response.data.result.xpEarned
            }
          : currentAttempt
      );
    } catch (requestError: any) {
      exitHandledRef.current = false;
      setError(requestError?.response?.data?.message || "Unable to submit your test.");
    } finally {
      setSubmitting(false);
    }
  }, [attempt, submitting]);

  const openQuestionFromPalette = (index: number) => {
    if (index + 1 > unlockedUntil) {
      return;
    }

    setCurrentIndex(index);
    setShowPalette(false);
  };

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Loading test workspace...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[32px] border border-amber-200 bg-white p-8 shadow-soft dark:border-amber-500/20 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Login required to start the exam</h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Sign in first so we can save your answers, track your timer, and award XP when you complete the mock test.
            </p>
            <Link
              href="/auth"
              className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return <ResultPage mockTest={mockTest} result={result} />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {!hasStarted ? (
        <RulesScreen mockTest={mockTest} onStart={startTest} loading={starting} resume={Boolean(initialAttempt)} />
      ) : (
        <>
          <TestHeader
            mockTest={mockTest}
            currentQuestion={currentIndex + 1}
            totalQuestions={questions.length}
            startedAt={attempt?.startedAt}
            onExpire={submitTest}
            onSubmit={submitTest}
            submitting={submitting}
          />

          <div className="px-4 pt-28 pb-32 lg:px-6 lg:pr-[344px] xl:pr-[364px]">
            <div className="mx-auto max-w-[1600px]">
              {currentQuestion ? (
                <QuestionCard
                  question={currentQuestion}
                  selectedOption={currentSelectedOption}
                  onSelect={saveAnswer}
                  saving={savingAnswer}
                />
              ) : null}
            </div>
          </div>

          <aside className="fixed right-0 top-[153px] bottom-[85px] z-30 hidden w-[320px] border-l border-slate-200 bg-white/98 backdrop-blur xl:w-[340px] dark:border-slate-800 dark:bg-slate-950/98 lg:block">
            <QuestionPalette
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              unlockedUntil={unlockedUntil}
              answeredQuestionIds={answeredQuestionIds}
              questionIds={questions.map((question) => Number(question._id))}
              onSelect={openQuestionFromPalette}
              className="h-full overflow-y-auto"
            />
          </aside>

          <BottomNavigation
            canGoNext={Boolean(currentSelectedOption)}
            isLastQuestion={currentIndex >= questions.length - 1}
            helperText={
              allQuestionsAnswered
                ? "All questions answered. You can submit the test now."
                : "Answer the current question to unlock the next one."
            }
            onNext={() => setCurrentIndex((value) => Math.min(value + 1, questions.length - 1))}
            onSubmit={submitTest}
            onOpenPalette={() => setShowPalette(true)}
            submitDisabled={!allQuestionsAnswered || submitting}
            nextDisabled={savingAnswer}
          />

          {showPalette ? (
            <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setShowPalette(false)}>
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                <QuestionPalette
                  totalQuestions={questions.length}
                  currentIndex={currentIndex}
                  unlockedUntil={unlockedUntil}
                  answeredQuestionIds={answeredQuestionIds}
                  questionIds={questions.map((question) => Number(question._id))}
                  onSelect={openQuestionFromPalette}
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
