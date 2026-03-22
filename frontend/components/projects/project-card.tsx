"use client";

import Link from "next/link";
import { ArrowRight, FileArchive, FileText, Layers3, Wrench } from "lucide-react";
import { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project._id}`}
      className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            {project.category}
          </span>
          <h3 className="mt-4 line-clamp-2 text-xl font-semibold text-slate-950 dark:text-white">{project.title}</h3>
        </div>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Layers3 className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{project.description}</p>

      <div className="mt-6 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
          <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
            <Wrench className="h-4 w-4 text-amber-500" />
            Level
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{project.level}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
          <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
            <FileArchive className="h-4 w-4 text-amber-500" />
            Files
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {project.fileUrl ? "ZIP included" : "No ZIP"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
          <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
            <FileText className="h-4 w-4 text-amber-500" />
            Report
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {project.reportUrl ? "PDF included" : "No PDF"}
          </p>
        </div>
      </div>

      {project.technologies.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {project.technologies.slice(0, 4).map((technology) => (
            <span
              key={technology}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              {technology}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-6">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-300">
          Open project
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
