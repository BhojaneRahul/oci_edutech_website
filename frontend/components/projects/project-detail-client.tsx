"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileArchive,
  FileText,
  Lock,
  LogIn,
  Wrench
} from "lucide-react";
import { Project } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";

export function ProjectDetailClient({ project }: { project: Project }) {
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const images = useMemo(() => project.images, [project.images]);
  const hasAccess = Boolean(user);

  const prevImage = () => setActiveImage((current) => (current === 0 ? images.length - 1 : current - 1));
  const nextImage = () => setActiveImage((current) => (current === images.length - 1 ? 0 : current + 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          {project.category}
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:text-slate-300">
          {project.level}
        </span>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-950">
            {images.length ? (
              <Image
                src={images[activeImage]}
                alt={project.title}
                fill
                sizes="(max-width: 1280px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-amber-50 text-center dark:from-slate-950 dark:via-slate-900 dark:to-amber-500/10">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Project preview</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Images were not uploaded for this project yet.</p>
                </div>
              </div>
            )}

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white dark:bg-slate-950/90 dark:text-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white dark:bg-slate-950/90 dark:text-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto px-5 py-5">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-20 w-24 shrink-0 overflow-hidden rounded-2xl border transition ${
                    index === activeImage
                      ? "border-amber-500 ring-2 ring-amber-100 dark:ring-amber-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${project.title} preview ${index + 1}`}
                    width={96}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Project details</p>
          <h1 className="mt-3 text-[1.95rem] font-semibold tracking-tight text-slate-950 dark:text-white md:text-[2.2rem]">{project.title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{project.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-950">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Wrench className="h-4 w-4 text-amber-500" />
                Technologies
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.technologies.length ? (
                  project.technologies.map((technology) => (
                    <span
                      key={technology}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      {technology}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">Technologies will appear here.</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Secure downloads</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Login is required to download the full project ZIP and report PDF.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <DownloadLink
              enabled={hasAccess && Boolean(project.fileUrl)}
              href={project.fileUrl ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/project/download/${project._id}` : ""}
              icon={<FileArchive className="h-4 w-4" />}
              label="Download Project"
            />
            <DownloadLink
              enabled={hasAccess && Boolean(project.reportUrl)}
              href={project.reportUrl ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/project/report/${project._id}` : ""}
              icon={<FileText className="h-4 w-4" />}
              label="Download Report"
            />
          </div>

          {!hasAccess ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <p className="flex items-center gap-2 font-medium">
                <Lock className="h-4 w-4" />
                Login required
              </p>
              <p className="mt-2">Please login first to download project files securely.</p>
              <Link
                href="/auth"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-amber-500 dark:text-slate-950"
              >
                <LogIn className="h-4 w-4" />
                Login / Signup
              </Link>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function DownloadLink({
  enabled,
  href,
  icon,
  label
}: {
  enabled: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-600"
      >
        <span className="flex items-center gap-3">
          {icon}
          {label}
        </span>
        <Lock className="h-4 w-4" />
      </button>
    );
  }

  return (
    <a
      href={href}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-semibold text-slate-900 transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10"
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      <Download className="h-4 w-4 text-amber-500" />
    </a>
  );
}
