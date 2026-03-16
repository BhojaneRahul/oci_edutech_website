"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SearchResults } from "@/lib/types";

export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", trimmedQuery],
    queryFn: async () => {
      const response = await api.get<SearchResults>(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      return response.data;
    },
    enabled: trimmedQuery.length > 1
  });

  const hasResults = useMemo(
    () => Boolean(data?.degrees.length || data?.subjects.length || data?.documents.length),
    [data]
  );

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
        <div className="fixed inset-0 z-[70] bg-white/95 p-4 backdrop-blur dark:bg-slate-950/95">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes, QPs, subjects, degrees..."
                className="w-full bg-transparent text-sm outline-none"
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

          <div className="mt-5 space-y-4 overflow-y-auto pb-20">
            {isFetching ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                Searching...
              </div>
            ) : null}

            {trimmedQuery.length > 1 && !hasResults && !isFetching ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                No results found.
              </div>
            ) : null}

            {data?.documents.length ? (
              <ResultBlock title="Documents">
                {data.documents.map((document) => (
                  <Link
                    key={document._id}
                    href={`/viewer?documentId=${document._id}&url=${encodeURIComponent(document.fileUrl)}&title=${encodeURIComponent(document.title)}&type=${document.type}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900"
                  >
                    <p className="text-sm font-semibold">{document.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {document.subject} • {document.stream}
                    </p>
                  </Link>
                ))}
              </ResultBlock>
            ) : null}

            {data?.subjects.length ? (
              <ResultBlock title="Subjects">
                {data.subjects.map((subject) => (
                  <div key={subject._id} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <p className="text-sm font-semibold">{subject.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {subject.group || subject.category} • {subject.semester || "General"}
                    </p>
                  </div>
                ))}
              </ResultBlock>
            ) : null}

            {data?.degrees.length ? (
              <ResultBlock title="Degrees">
                {data.degrees.map((degree) => (
                  <Link
                    key={degree._id}
                    href={`/degree/${degree._id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900"
                  >
                    <p className="text-sm font-semibold">{degree.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{degree.description}</p>
                  </Link>
                ))}
              </ResultBlock>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
