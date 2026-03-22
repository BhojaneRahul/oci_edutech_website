"use client";

import { DegreeDetail, Document } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";
import { LoginGate } from "./login-gate";
import { MaterialTabs } from "./material-tabs";

export function ProtectedDegreeMaterials({ data }: { data: DegreeDetail }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">Loading...</div>;
  }

  if (!user) {
    return <LoginGate />;
  }

  return <MaterialTabs notes={data.notes.notes as Document[]} modelQps={data.notes.modelQps as Document[]} />;
}

export function ProtectedPucMaterials({ documents }: { documents: Document[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">Loading...</div>;
  }

  if (!user) {
    return <LoginGate />;
  }

  return (
    <MaterialTabs
      notes={documents.filter((document) => document.type === "notes")}
      modelQps={documents.filter((document) => document.type === "model_qp")}
    />
  );
}
