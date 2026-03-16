"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NotificationResponse } from "@/lib/types";
import { useAuth } from "../providers/auth-provider";

export function NotificationMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get<NotificationResponse>("/notifications");
      return response.data;
    },
    enabled: Boolean(user)
  });

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  if (!user) return null;

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3 px-2 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Recent uploads</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Notes and model QPs from admin</p>
            </div>
            {unreadCount ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-amber-600"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto px-1">
            {data?.notifications.length ? (
              data.notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.documentId ? `/viewer?documentId=${notification.documentId}` : "/"}
                  onClick={() => setOpen(false)}
                  className={`block rounded-2xl px-4 py-3 transition ${
                    notification.isRead
                      ? "bg-slate-50 dark:bg-slate-900"
                      : "bg-amber-50 dark:bg-amber-500/10"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{notification.message}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                No recent upload notifications yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
