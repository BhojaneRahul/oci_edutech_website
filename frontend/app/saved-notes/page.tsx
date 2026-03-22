import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SavedNotesPageClient } from "@/components/account/saved-notes-page-client";

export default function SavedNotesPage() {
  return (
    <DashboardShell>
      <SavedNotesPageClient />
    </DashboardShell>
  );
}
