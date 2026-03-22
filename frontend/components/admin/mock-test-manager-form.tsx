"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, CirclePlus, GripVertical, Trash2 } from "lucide-react";
import { MockTest, MockTestQuestion } from "@/lib/types";
import { FormSelect } from "../ui/form-select";
import { cn } from "@/lib/utils";

type QuestionDraft = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
};

type DegreeOption = {
  label: string;
  value: string;
};

const difficultyOptions = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" }
];

const streamOptions = [
  { label: "BCA", value: "BCA" },
  { label: "BBA", value: "BBA" },
  { label: "B.Com", value: "B.Com" },
  { label: "BSc", value: "BSc" },
  { label: "BA", value: "BA" },
  { label: "1st PUC", value: "1st PUC" },
  { label: "2nd PUC", value: "2nd PUC" }
];

const answerOptions = [
  { label: "Option A", value: "A" },
  { label: "Option B", value: "B" },
  { label: "Option C", value: "C" },
  { label: "Option D", value: "D" }
];

const createEmptyQuestion = (): QuestionDraft => ({
  id: crypto.randomUUID(),
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A"
});

const mapQuestions = (questions?: MockTestQuestion[]) =>
  questions?.length
    ? questions.map((question) => ({
        id: String(question._id),
        questionText: question.questionText,
        optionA: question.optionA ?? question.options.find((option) => option.key === "A")?.value ?? "",
        optionB: question.optionB ?? question.options.find((option) => option.key === "B")?.value ?? "",
        optionC: question.optionC ?? question.options.find((option) => option.key === "C")?.value ?? "",
        optionD: question.optionD ?? question.options.find((option) => option.key === "D")?.value ?? "",
        correctAnswer: (question.correctAnswer ?? "A") as "A" | "B" | "C" | "D"
      }))
    : [createEmptyQuestion()];

export function MockTestManagerForm({
  onSubmit,
  submitting,
  initialValues,
  degreeOptions,
  submitLabel = "Create Mock Test",
  errorMessage = ""
}: {
  onSubmit: (payload: {
    title: string;
    description: string;
    durationMinutes: number;
    difficulty: "easy" | "medium" | "hard";
    subject: string;
    degreeId: number;
    stream: string;
    isPublished: boolean;
    questions: Omit<QuestionDraft, "id">[];
  }) => Promise<void>;
  submitting: boolean;
  initialValues?: Partial<MockTest>;
  degreeOptions: DegreeOption[];
  submitLabel?: string;
  errorMessage?: string;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [subject, setSubject] = useState(initialValues?.subject ?? "");
  const [stream, setStream] = useState(initialValues?.stream ?? "BCA");
  const [degreeId, setDegreeId] = useState(String(initialValues?.degree?.id ?? initialValues?.degreeId ?? degreeOptions[0]?.value ?? ""));
  const [durationMinutes, setDurationMinutes] = useState(String(initialValues?.durationMinutes ?? 30));
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">((initialValues?.difficulty as "easy" | "medium" | "hard") ?? "medium");
  const [isPublished, setIsPublished] = useState(initialValues?.isPublished ?? true);
  const [questions, setQuestions] = useState<QuestionDraft[]>(mapQuestions(initialValues?.questions));
  const [activeQuestionId, setActiveQuestionId] = useState<string>(mapQuestions(initialValues?.questions)[0]?.id ?? "");

  useEffect(() => {
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
    setSubject(initialValues?.subject ?? "");
    setStream(initialValues?.stream ?? "BCA");
    setDegreeId(String(initialValues?.degree?.id ?? initialValues?.degreeId ?? degreeOptions[0]?.value ?? ""));
    setDurationMinutes(String(initialValues?.durationMinutes ?? 30));
    setDifficulty((initialValues?.difficulty as "easy" | "medium" | "hard") ?? "medium");
    setIsPublished(initialValues?.isPublished ?? true);
    const nextQuestions = mapQuestions(initialValues?.questions);
    setQuestions(nextQuestions);
    setActiveQuestionId(nextQuestions[0]?.id ?? "");
  }, [degreeOptions, initialValues]);

  const activeIndex = useMemo(
    () => Math.max(0, questions.findIndex((question) => question.id === activeQuestionId)),
    [activeQuestionId, questions]
  );

  const updateQuestion = (id: string, field: keyof QuestionDraft, value: string) => {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, [field]: value } : question))
    );
  };

  const addQuestion = () => {
    const nextQuestion = createEmptyQuestion();
    setQuestions((current) => [...current, nextQuestion]);
    setActiveQuestionId(nextQuestion.id);
  };

  const removeQuestion = (id: string) => {
    setQuestions((current) => {
      if (current.length === 1) {
        return current;
      }

      const nextQuestions = current.filter((question) => question.id !== id);
      if (activeQuestionId === id) {
        setActiveQuestionId(nextQuestions[Math.max(0, activeIndex - 1)]?.id ?? nextQuestions[0]?.id ?? "");
      }
      return nextQuestions;
    });
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Mock test editor</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
            {submitLabel === "Create Mock Test" ? "Create a sequential mock test" : "Edit mock test"}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Build the exam structure, add MCQ questions, and control whether the test is visible to learners.
          </p>
        </div>
        <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
          />
          Published
        </label>
      </div>

      <form
        className="mt-6 space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!degreeId) {
            return;
          }
          await onSubmit({
            title,
            description,
            durationMinutes: Number(durationMinutes),
            difficulty,
            subject,
            degreeId: Number(degreeId),
            stream,
            isPublished,
            questions: questions.map(({ id: _id, ...question }) => question)
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Test Title" value={title} onChange={setTitle} placeholder="BCA Fundamentals Mock Test" />
          <InputField label="Subject" value={subject} onChange={setSubject} placeholder="Programming in C" />
          <TextAreaField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Short summary of what this test covers."
            className="md:col-span-2"
          />
          <SelectField label="Degree" value={degreeId} onChange={setDegreeId} options={degreeOptions} />
          <SelectField label="Stream" value={stream} onChange={setStream} options={streamOptions} />
          <InputField label="Duration (minutes)" type="number" value={durationMinutes} onChange={setDurationMinutes} min={5} />
          <SelectField label="Difficulty" value={difficulty} onChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")} options={difficultyOptions} />
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Questions</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Keep the order clean. Learners will answer these in strict sequence.
              </p>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
            >
              <CirclePlus className="h-4 w-4" />
              Add Question
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setActiveQuestionId((current) => (current === question.id ? "" : question.id))}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      Question {index + 1}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {question.questionText || "Add the question prompt and four options."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeQuestion(question.id);
                      }}
                      disabled={questions.length === 1}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/20 dark:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition dark:border-slate-700 dark:text-slate-300",
                        activeQuestionId === question.id && "rotate-180 border-amber-300 text-amber-500"
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </div>
                </button>

                {activeQuestionId === question.id ? (
                  <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2 dark:border-slate-800">
                    <TextAreaField
                      label="Question Text"
                      value={question.questionText}
                      onChange={(value) => updateQuestion(question.id, "questionText", value)}
                      className="md:col-span-2"
                      placeholder="Enter the MCQ question"
                    />
                    <InputField label="Option A" value={question.optionA} onChange={(value) => updateQuestion(question.id, "optionA", value)} />
                    <InputField label="Option B" value={question.optionB} onChange={(value) => updateQuestion(question.id, "optionB", value)} />
                    <InputField label="Option C" value={question.optionC} onChange={(value) => updateQuestion(question.id, "optionC", value)} />
                    <InputField label="Option D" value={question.optionD} onChange={(value) => updateQuestion(question.id, "optionD", value)} />
                    <SelectField
                      label="Correct Answer"
                      value={question.correctAnswer}
                      onChange={(value) => updateQuestion(question.id, "correctAnswer", value)}
                      options={answerOptions}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  min
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  min?: number;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        required
        min={min}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <textarea
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <FormSelect required value={value} onChange={onChange} options={options} />
    </label>
  );
}
