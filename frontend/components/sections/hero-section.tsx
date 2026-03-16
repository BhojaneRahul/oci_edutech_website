import Link from "next/link";
import { Download, GraduationCap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-hero-mesh p-8 shadow-soft dark:bg-hero-mesh-dark md:p-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,140,0,0.16),transparent_30%)]" />
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-slate-900/80 dark:text-amber-300">
          <GraduationCap className="h-4 w-4" />
          Welcome to OCI - EduTech
        </div>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-900 dark:text-white md:text-6xl">
          Your hub for degree notes and study materials.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
          Access organized course notes, PUC resources, model question papers, mock tests, and project references in one modern learning dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/degree" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white dark:bg-amber-500">
            Explore Degrees
          </Link>
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            Download App
          </a>
        </div>
      </div>
    </section>
  );
}
