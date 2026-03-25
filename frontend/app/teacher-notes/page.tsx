import { TeacherNotesPageClient } from "@/components/teacher-notes/teacher-notes-page-client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { serverApi } from "@/lib/server-api";

export default async function TeacherNotesPage() {
  const teacherNotes = await serverApi.getTeacherNotes().catch(() => []);

  return (
    <DashboardShell>
      <TeacherNotesPageClient initialNotes={teacherNotes} />
    </DashboardShell>
  );
}
