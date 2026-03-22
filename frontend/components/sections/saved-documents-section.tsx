"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SavedDocument } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { SavedDocumentCard } from "../documents/saved-document-card";
import { SectionHeading } from "./section-heading";

export function SavedDocumentsSection() {
  const { user, loading } = useAuth();
  const { data: savedDocuments = [] } = useQuery({
    queryKey: ["saved-documents-home"],
    queryFn: async () => {
      const response = await api.get<SavedDocument[]>("/auth/saved-documents");
      return response.data;
    },
    enabled: Boolean(user)
  });

  if (loading || !user || !savedDocuments.length) {
    return null;
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Saved"
        title="Saved notes and model QPs"
        description="Quickly jump back into the PDFs you bookmarked across OCI - EduTech."
      />
      <div className="clean-scroll -mx-1 overflow-x-auto px-1">
        <div className="flex min-w-max gap-4 sm:gap-5">
          {savedDocuments.slice(0, 6).map((entry) => (
            <SavedDocumentCard key={entry.id} entry={entry} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
