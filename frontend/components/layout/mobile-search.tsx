"use client";

import Link from "next/link";
import { FileText, FolderKanban, GraduationCap, ListChecks, Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SearchResults } from "@/lib/types";

type FilterKey = "all" | "notes" | "model_qp" | "projects" | "mocktests";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "notes", label: "Notes" },
  { key: "model_qp", label: "Model QPs" },
  { key: "projects", label: "Projects" },
  { key: "mocktests", label: "Mock Tests" }
];

export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const trimmedQuery = query.trim();
  const deferredQuery = useDeferredValue(trimmedQuery);

  const { data, isFetching, error } = useQuery({
    queryKey: ["mobile-search", deferredQuery],
    queryFn: async () => {
      const response = await api.get<SearchResults>(`/search?q=${encodeURIComponent(deferredQuery)}`);
      return response.data;
    },
    enabled: deferredQuery.length > 0,
    refetchOnWindowFocus: false
  });

  const filteredResults = useMemo(() => {
    if (!data) {
      return [];
    }

    const documents = data.documents
      .filter((document) => activeFilter === "all" || document.type === activeFilter)
      .map((document) => ({
        id: `document-${document._id}`,
        href: `/viewer?documentId=${document._id}&url=${encodeURIComponent(document.fileUrl)}&title=${encodeURIComponent(document.title)}&type=${document.type}`,
        title: document.title,
        meta: `${document.subject} • ${document.stream} • ${document.type === "model_qp" ? "Model QP" : "Notes"}`,
        icon: FileText
      }));

    const projects =
      activeFilter === "all" || activeFilter === "projects"
        ? data.projects.map((project) => ({
            id: `project-${project._id}`,
            href: `/projects/${project._id}`,
            title: project.title,
            meta: `${project.category} • ${project.level}`,
            icon: FolderKanban
          }))
        : [];

    const mockTests =
      activeFilter === "all" || activeFilter === "mocktests"
        ? data.mockTests.map((test) => ({
            id: `mock-${test._id}`,
            href: `/mock-tests/${test._id}`,
            title: test.title,
            meta: `${test.totalQuestions} questions • ${test.subject} • Mock Test`,
            icon: ListChecks
          }))
        : [];

    const degrees =
      activeFilter === "all"
        ? data.degrees.map((degree) => ({
            id: `degree-${degree._id}`,
            href: `/degree/${degree._id}`,
            title: degree.name,
            meta: "Degree stream",
            icon: GraduationCap
          }))
        : [];

    const subjects =
      activeFilter === "all"
        ? data.subjects.map((subject) => ({
            id: `subject-${subject._id}`,
            href: subject.category === "puc" ? "/puc" : "/degree",
            title: subject.name,
            meta: `${subject.category === "puc" ? "PUC" : "Degree"} • ${subject.semester || "Subject"}`,
            icon: GraduationCap
          }))
        : [];

    return [...documents, ...projects, ...mockTests, ...degrees, ...subjects];
  }, [activeFilter, data]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-white p-4 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 dark:border-slate-700 dark:bg-slate-950">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search PDFs, notes, model QPs, projects..."
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {trimmedQuery.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveFilter(filter.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        activeFilter === filter.key
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-3">
                {isFetching ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    Searching...
                  </div>
                ) : error ? (
                  <div className="rounded-2xl bg-rose-50 px-4 py-6 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                    Search is temporarily unavailable. Please try again.
                  </div>
                ) : filteredResults.length ? (
                  <div className="space-y-2">
                    {filteredResults.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <div className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    No matching results found.
                  </div>
                )}
              </div>

              {filteredResults.length ? (
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  Searching across PDFs, mock tests, and projects from OCI - EduTech.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
