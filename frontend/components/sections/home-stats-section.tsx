"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, PlayCircle, Users } from "lucide-react";
import { api } from "@/lib/api";

type SiteStatsResponse = {
  success: true;
  visits: number;
  documentCount: number;
  userCount: number;
  mockTestCount: number;
  projectCount: number;
  appInstalls: string;
  youtubeMembers: string;
};

const sessionKey = "oci-home-visit-tracked";

export function HomeStatsSection() {
  const { data, refetch } = useQuery({
    queryKey: ["site-stats"],
    queryFn: async () => {
      const response = await api.get<SiteStatsResponse>("/site/stats");
      return response.data;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    api.post<SiteStatsResponse>("/site/visit").finally(() => {
      window.sessionStorage.setItem(sessionKey, "true");
      refetch();
    });
  }, [refetch]);

  const metrics = [
    {
      label: "Website visits",
      helper: "Learners reaching OCI - EduTech",
      value: data?.visits ?? 0,
      icon: Users,
      accent: "from-sky-500/15 to-cyan-500/5 text-sky-600"
    },
    {
      label: "PDF Resources",
      helper: "Notes and model question papers",
      value: data?.documentCount ?? 0,
      icon: BookOpen,
      accent: "from-amber-500/15 to-yellow-500/5 text-amber-600"
    },
    {
      label: "App Installs",
      helper: "Play Store learner installs",
      value: data?.appInstalls ?? "0",
      icon: Download,
      accent: "from-emerald-500/15 to-teal-500/5 text-emerald-600"
    },
    {
      label: "YouTube Members",
      helper: "Community growing on YouTube",
      value: data?.youtubeMembers ?? "0",
      icon: PlayCircle,
      accent: "from-rose-500/15 to-orange-500/5 text-rose-600"
    }
  ];

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white/95 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 sm:p-5 lg:p-6">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-500">Platform Snapshot</p>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-[15px]">
          Live platform highlights for visits, PDF resources, Play Store installs, and the growing YouTube learning community.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, helper, value, icon: Icon, accent }) => (
        <article
          key={label}
          className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900"
        >
          <div className={`flex items-center justify-between gap-4 border-b border-white/40 bg-gradient-to-r ${accent} px-6 py-5 dark:border-slate-800/60`}>
            <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/60 ${accent} dark:bg-slate-900/60`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-right text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2rem]">
              {value}
            </p>
          </div>
          <div className="flex min-h-[124px] flex-col justify-between px-6 py-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">{label}</p>
              <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">{helper}</p>
            </div>
          </div>
        </article>
      ))}
      </div>
    </section>
  );
}
