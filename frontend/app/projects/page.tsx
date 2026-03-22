import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProjectCard } from "@/components/projects/project-card";
import { SectionHeading } from "@/components/sections/section-heading";
import { serverApi } from "@/lib/server-api";

export default async function ProjectsPage() {
  const projects = await serverApi.getProjects().catch(() => []);

  return (
    <DashboardShell>
      <SectionHeading
        eyebrow="Projects"
        title="Academic project references"
        description="Browse structured academic projects, preview screenshots, and open each project for secure ZIP and report downloads."
      />
      {projects.length ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">No projects uploaded yet</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            Admin uploads will appear here automatically. Once a project is added, students can open the detail page and
            securely download the ZIP and report after login.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
