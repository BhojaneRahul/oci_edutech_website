"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FileText, FolderKanban, ListChecks } from "lucide-react";
import { Document, MockTest, Project } from "@/lib/types";
import { SectionHeading } from "./section-heading";

type CategoryKey = "notes" | "model_qp" | "projects" | "mock_tests";

const categoryLabels: Record<CategoryKey, string> = {
  notes: "Notes",
  model_qp: "Model QPs",
  projects: "Projects",
  mock_tests: "Mock Tests"
};

export function RecentContentSection({
  documents,
  projects,
  mockTests
}: {
  documents: Document[];
  projects: Project[];
  mockTests: MockTest[];
}) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("notes");
  const shelfRef = useRef<HTMLDivElement | null>(null);

  const grouped = useMemo(
    () => ({
      notes: documents.filter((document) => document.type === "notes").slice(0, 5),
      model_qp: documents.filter((document) => document.type === "model_qp").slice(0, 5),
      projects: projects.slice(0, 5),
      mock_tests: mockTests.slice(0, 5)
    }),
    [documents, projects, mockTests]
  );

  const items = grouped[activeCategory];
  const showDesktopArrows = items.length > 3;

  const scrollShelf = (direction: "left" | "right") => {
    if (!shelfRef.current) return;
    const amount = Math.max(280, Math.round(shelfRef.current.clientWidth * 0.72));
    shelfRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth"
    });
  };

  return (
    <section className="space-y-6 sm:space-y-7">
      <SectionHeading
        eyebrow="Recent"
        title="Recently added study resources"
        description="Quickly browse the latest notes, model question papers, projects, and mock tests uploaded to OCI - EduTech."
      />

      <div className="relative">
        <div className="clean-scroll -mx-1 flex overflow-x-auto px-1 pb-1 md:justify-center">
          <div className="flex min-w-max gap-2 rounded-[22px] bg-white/85 p-1.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/85 dark:ring-slate-800">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key as CategoryKey)}
                className={`rounded-[16px] px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition sm:px-5 ${
                  activeCategory === key
                    ? "bg-slate-950 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950"
                    : "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.length ? (
          <>
            {showDesktopArrows ? (
              <div className="hidden items-center justify-end gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => scrollShelf("left")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-500/30 dark:hover:text-amber-300"
                  aria-label="Scroll left"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollShelf("right")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-500/30 dark:hover:text-amber-300"
                  aria-label="Scroll right"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div ref={shelfRef} className="clean-scroll -mx-1 overflow-x-auto px-1">
              <div className="flex min-w-max gap-4">
                {items.map((item) => (
                  <div key={`${activeCategory}-${item._id}`} className="w-[260px] shrink-0 sm:w-[300px] xl:w-[330px]">
                    <RecentCard category={activeCategory} item={item} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            No recent items available in this category yet.
          </div>
        )}
      </div>
    </section>
  );
}

function RecentCard({
  category,
  item
}: {
  category: CategoryKey;
  item: Document | Project | MockTest;
}) {
  const isDocument = "fileUrl" in item;
  const isProject = "technologies" in item;
  const createdAt = "createdAt" in item ? item.createdAt : null;
  const createdDate = createdAt ? new Date(createdAt) : null;
  const isNew =
    createdDate instanceof Date &&
    !Number.isNaN(createdDate.getTime()) &&
    Date.now() - createdDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
  const href = isDocument
    ? `/viewer?documentId=${item._id}&url=${encodeURIComponent(item.fileUrl)}&title=${encodeURIComponent(item.title)}&type=${item.type}`
    : isProject
      ? `/projects/${item._id}`
      : `/mock-tests/${item._id}`;
  const Icon = isDocument ? FileText : isProject ? FolderKanban : ListChecks;

  return (
    <Link
      href={href}
      className={`group relative flex h-full min-h-[250px] flex-col overflow-hidden rounded-[24px] border bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] transition hover:-translate-y-1 hover:shadow-[0_22px_48px_-28px_rgba(15,23,42,0.34)] sm:min-h-[280px] sm:p-5 dark:bg-slate-900 ${
        isNew
          ? "border-amber-200 hover:border-amber-300 dark:border-amber-500/20 dark:hover:border-amber-500/35"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-28 ${
          isNew
            ? "bg-gradient-to-b from-amber-100/85 via-amber-50/45 to-transparent dark:from-amber-500/12 dark:via-amber-500/6 dark:to-transparent"
            : "bg-gradient-to-b from-slate-50/90 via-white/30 to-transparent dark:from-slate-800/45 dark:via-slate-900/10 dark:to-transparent"
        }`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-sm sm:h-12 sm:w-12 dark:from-amber-500/15 dark:to-amber-500/5 dark:text-amber-300">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex items-center gap-2">
          {isNew ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 sm:px-3 sm:text-[11px] dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              New
            </span>
          ) : null}
          <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:px-3 sm:text-[11px] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {categoryLabels[category]}
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex-1 space-y-2.5 sm:mt-5 sm:space-y-3">
        <h3 className="line-clamp-2 text-[1rem] font-semibold leading-7 text-slate-950 sm:text-[1.15rem] sm:leading-8 dark:text-white">
          {item.title}
        </h3>

        <p className="text-xs leading-6 text-slate-500 sm:text-sm sm:leading-7 dark:text-slate-400">
          {isDocument
            ? `${item.subject} • ${item.stream}`
            : isProject
              ? `${item.category} • ${item.level}`
              : `${item.subject} • ${item.stream} • ${item.totalQuestions} questions`}
        </p>

        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[11px] dark:bg-slate-800 dark:text-slate-300">
          {isDocument ? "PDF resource" : isProject ? "Project reference" : "Timed mock test"}
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 sm:text-xs sm:tracking-[0.18em] dark:text-slate-500">
          Open resource
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition group-hover:border-amber-300 group-hover:bg-amber-100 sm:px-4 sm:text-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:group-hover:bg-amber-500/15">
          View
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1 sm:h-4 sm:w-4" />
        </div>
      </div>
    </Link>
  );
}
