import { TeacherNotesPageClient } from "@/components/teacher-notes/teacher-notes-page-client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { serverApi } from "@/lib/server-api";

export default async function TeacherNotesPage() {
  const teacherNotes = await serverApi.getTeacherNotes().catch(() => []);

  return (
    <DashboardShell fullBleed contentClassName="pt-28 sm:pt-28 lg:pt-28">
      <TeacherNotesPageClient initialNotes={teacherNotes} />
    </DashboardShell>
  );
}
