import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SyllabusGeneratorClient } from "@/components/syllabus/syllabus-generator-client";

export default function SyllabusToNotesPage() {
  return (
    <DashboardShell>
      <SyllabusGeneratorClient />
    </DashboardShell>
  );
}
