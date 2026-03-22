import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, Calculator, FlaskConical, Laptop2 } from "lucide-react";
import { Degree } from "@/lib/types";

const iconMap = {
  Laptop2,
  Calculator,
  FlaskConical,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap: BookOpen
} as const;

export function DegreeCard({ degree }: { degree: Degree }) {
  const Icon = iconMap[degree.icon as keyof typeof iconMap] ?? BookOpen;

  return (
    <div className="group rounded-[28px] border border-white/50 bg-white p-6 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-semibold">{degree.name}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{degree.description}</p>
      <Link
        href={`/degree/${degree._id}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition group-hover:gap-3"
      >
        Explore
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

