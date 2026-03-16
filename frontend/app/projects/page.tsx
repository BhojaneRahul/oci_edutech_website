import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SectionHeading } from "@/components/sections/section-heading";
import { serverApi } from "@/lib/server-api";

export default async function ProjectsPage() {
  const projects = await serverApi.getProjects().catch(() => []);

  return (
    <DashboardShell>
      <SectionHeading
        eyebrow="Projects"
        title="Academic project references"
        description="Browse ready-to-explore project ideas and downloadable references for your stream."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {projects.map((project) => (
          <div key={project._id} className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{project.description}</p>
            <a
              href={project.downloadLink}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white"
            >
              Open Project
            </a>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
