import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SectionHeading } from "@/components/sections/section-heading";

const groups = [
  { title: "1st PUC", description: "Access first-year PUC study materials and notes." },
  { title: "2nd PUC", description: "Browse second-year PUC materials and reference papers." }
];

export default function PucPage() {
  return (
    <DashboardShell>
      <SectionHeading
        eyebrow="PUC"
        title="PUC materials"
        description="Organized study material buckets for 1st PUC and 2nd PUC."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title} className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">{group.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
            <Link
              href={`/puc/${encodeURIComponent(group.title)}`}
              className="mt-5 inline-flex rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white"
            >
              Open Materials
            </Link>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
