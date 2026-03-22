import Link from "next/link";
import { Download, GraduationCap, Sparkles } from "lucide-react";
import { AnimatedHeadline } from "./AnimatedHeadline";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-amber-100 bg-[#fffaf1] px-6 py-10 shadow-soft dark:border-amber-500/10 dark:bg-[#1a160c] md:px-10 md:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,195,0,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,140,0,0.16),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.08),transparent_36%)] md:bg-[radial-gradient(circle_at_top_right,rgba(255,195,0,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,140,0,0.14),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.04),transparent_34%)]" />
      <div className="absolute inset-0 animate-[pulse_8s_ease-in-out_infinite] bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.06),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,195,0,0.18),transparent_26%)] opacity-90 md:opacity-70" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.08em] text-amber-700 dark:border-amber-500/20 dark:bg-slate-900/80 dark:text-amber-300">
          <GraduationCap className="h-4 w-4" />
          Welcome to OCI - EduTech
        </div>

        <div className="mx-auto mt-6 max-w-3xl">
          <AnimatedHeadline />
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-[1.02rem] leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
          Access organized course notes, PUC resources, model question papers, mock tests, and project references in
          one modern learning dashboard.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/degree" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white dark:bg-amber-500">
            Explore Degrees
          </Link>
          <a
            href="https://play.google.com/store/apps/details?id=com.oci.studyresources"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            Download App
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <FeaturePill label="Smart notes" />
          <FeaturePill label="Model QPs" />
          <FeaturePill label="Mock tests" icon={Sparkles} />
        </div>
      </div>
    </section>
  );
}

function FeaturePill({
  label,
  icon: Icon
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
      {Icon ? <Icon className="h-4 w-4 text-amber-500" /> : <span className="h-2 w-2 rounded-full bg-amber-500" />}
      {label}
    </div>
  );
}
