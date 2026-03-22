"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import {
  Bell,
  FileText,
  FolderKanban,
  ListChecks,
  MessageSquareMore,
  Trash2,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationResponse } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";

const baseUrl = (api.defaults.baseURL || "http://localhost:5000/api").replace(/\/api$/, "");

const getNotificationIcon = (type?: string) => {
  switch (type) {
    case "document_upload":
      return FileText;
    case "project_upload":
      return FolderKanban;
    case "mock_test_upload":
      return ListChecks;
    case "community_message":
      return MessageSquareMore;
    default:
      return Bell;
  }
};

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();

  const { data, isLoading } = useQuery<NotificationResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get<NotificationResponse>("/notifications");
      return response.data;
    },
    enabled: Boolean(user),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!user) return;

    const socket: Socket = io(baseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    const onNotification = (notification: NotificationItem) => {
      queryClient.setQueryData<NotificationResponse | undefined>(["notifications"], (current) => {
        const previous = current ?? { success: true as const, unreadCount: 0, notifications: [] };
        const filtered = previous.notifications.filter((item) => item.id !== notification.id);

        return {
          success: true,
          unreadCount: previous.unreadCount + (notification.isRead ? 0 : 1),
          notifications: [notification, ...filtered],
        };
      });

      if (
        notification.type !== "community_message" &&
        typeof window !== "undefined" &&
        document.visibilityState === "hidden" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          tag: `notification-${notification.id}`,
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
          if (notification.targetPath) {
            router.push(notification.targetPath);
          }
        };
      }
    };

    socket.on("notification:new", onNotification);

    return () => {
      socket.off("notification:new", onNotification);
      socket.disconnect();
    };
  }, [queryClient, router, user]);

  const notifications = data?.notifications ?? [];
  const visibleNotifications = notifications.filter((notification) => notification.type !== "community_message");
  const unreadCount = visibleNotifications.filter((notification) => !notification.isRead).length;

  const groupedSummary = useMemo(() => {
    const hasProjects = visibleNotifications.some((notification) => notification.type === "project_upload");
    const hasTests = visibleNotifications.some((notification) => notification.type === "mock_test_upload");
    const hasDocuments = visibleNotifications.some((notification) => notification.type === "document_upload");

    if (hasProjects && hasTests && hasDocuments) {
      return "Uploads, tests, projects, and learning updates";
    }
    if (hasProjects || hasTests) {
      return "Projects, tests, and document updates";
    }
    return "Uploads, tests, projects, and updates";
  }, [visibleNotifications]);

  const invalidateNotifications = async () => {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = async () => {
    await api.put("/notifications/read-all?excludeType=community_message");
    await invalidateNotifications();
  };

  const markOneRead = async (notificationId: number) => {
    await api.put(`/notifications/${notificationId}/read`);
    await invalidateNotifications();
  };

  const deleteNotification = async (notificationId: number) => {
    await api.delete(`/notifications/${notificationId}`);
    await invalidateNotifications();
  };

  const clearNotifications = async () => {
    await api.delete("/notifications/clear?excludeType=community_message");
    await invalidateNotifications();
  };

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markOneRead(notification.id);
    }
    setOpen(false);
    router.push(notification.targetPath || "/");
  };

  const handleBellClick = async () => {
    setOpen((current) => !current);

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore browser notification permission failures.
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleBellClick}
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:text-amber-300"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.45rem] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 pb-4 pt-5 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Notifications</h2>
                <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{groupedSummary}</p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white"
                aria-label="Close notifications panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <button
                type="button"
                onClick={markAllRead}
                disabled={!visibleNotifications.length}
                className="text-sm font-semibold text-amber-700 transition hover:text-amber-800 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-amber-300 dark:hover:text-amber-200 dark:disabled:text-slate-600"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={clearNotifications}
                disabled={!visibleNotifications.length}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-800 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:text-red-300 dark:disabled:text-slate-600"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                    />
                  ))}
                </div>
              ) : visibleNotifications.length ? (
                <div className="space-y-3">
                  {visibleNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "group relative overflow-hidden rounded-3xl border p-4 shadow-sm transition",
                          notification.isRead
                            ? "border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/70"
                            : "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10",
                        )}
                      >
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                            <Icon className="h-5 w-5" />
                          </div>

                          <button
                            type="button"
                            onClick={() => void openNotification(notification)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-slate-950 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                  {notification.message}
                                </p>
                              </div>

                              <span className="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteNotification(notification.id)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent text-slate-400 opacity-100 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                    <Bell className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">No notifications yet</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Uploads, tests, and project updates will appear here.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
