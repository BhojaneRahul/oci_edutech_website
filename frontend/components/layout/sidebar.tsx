"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronRight,
  ScrollText,
  MessagesSquare,
  FolderKanban,
  Globe,
  GraduationCap,
  House,
  ListChecks,
  Settings2,
  ShieldAlert,
  ShieldQuestion,
  Sparkles,
  Trash2,
  X,
  Send,
  Youtube
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { NotificationResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "../providers/auth-provider";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/puc", label: "PUC", icon: BookOpen },
  { href: "/degree", label: "Degree", icon: GraduationCap },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/mock-tests", label: "Mock Tests", icon: ListChecks },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/syllabus-to-notes", label: "Syllabus Upload", icon: ScrollText }
];

const socialLinks = [
  { href: "https://www.youtube.com/@ocistudyresources", label: "YouTube", icon: Youtube },
  { href: "https://www.ourcreativeinfo.in/", label: "Website", icon: Globe },
  { href: "https://t.me/oci_studio", label: "Telegram", icon: Send }
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get<NotificationResponse>("/notifications");
      return response.data;
    },
    enabled: Boolean(user)
  });

  const communityUnreadCount =
    pathname.startsWith("/community")
      ? 0
      : data?.notifications.filter((notification) => notification.type === "community_message" && !notification.isRead).length ?? 0;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 transition lg:hidden",
          open || settingsOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => {
          onClose();
          setSettingsOpen(false);
        }}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(84vw,19rem)] flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:h-screen lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex min-h-20 items-start gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-5">
          <Link href="/" onClick={onClose} className="flex min-w-0 flex-1 items-start gap-3 pr-1">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl shadow-lg shadow-amber-500/15">
              <Image src="/oci-edutech.png" alt="OCI logo" fill sizes="48px" className="object-cover" />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="truncate text-[1.05rem] font-semibold leading-5 text-slate-900 dark:text-white">OCI - EduTech</p>
              <p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">Study resources</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 shrink-0 rounded-2xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4 sm:px-4">
            <div className="space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{item.label}</span>
                      {item.href === "/community" && communityUnreadCount ? (
                        <span
                          className={cn(
                            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            active ? "bg-white/20 text-white" : "bg-amber-500 text-white"
                          )}
                        >
                          {communityUnreadCount > 99 ? "99+" : communityUnreadCount}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
              <div className="space-y-2">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 mt-auto border-t border-slate-200 bg-white/95 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-4">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <span className="flex items-center gap-3">
                <Settings2 className="h-5 w-5" />
                Settings
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <p className="mt-2 px-4 text-[11px] font-medium text-slate-400">v1.0.0</p>
          </div>
        </div>
      </aside>

      <SettingsPanel
        open={settingsOpen}
        notificationsOn={notificationsOn}
        onToggleNotifications={() => setNotificationsOn((value) => !value)}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}

function SettingsPanel({
  open,
  notificationsOn,
  onToggleNotifications,
  onClose
}: {
  open: boolean;
  notificationsOn: boolean;
  onToggleNotifications: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-[60] w-full max-w-md border-l border-slate-200 bg-white shadow-2xl transition-transform dark:border-slate-800 dark:bg-slate-950",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Settings</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">App controls, support, and policy links</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 dark:border-slate-800 dark:text-slate-300"
          aria-label="Close settings"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-[calc(100vh-88px)] overflow-y-auto px-5 py-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Notification Settings</p>
              <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                Only upload alerts for notes, model question papers, and newly added study files.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleNotifications}
              className={cn(
                "relative inline-flex h-7 w-12 items-center rounded-full transition",
                notificationsOn ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
              )}
              aria-label="Toggle notifications"
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white transition",
                  notificationsOn ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {notificationsOn ? "Turn On" : "Turn Off"}
          </p>
        </div>

        <div className="mt-6 space-y-2">
          <SettingsLink
            icon={ShieldQuestion}
            title="FAQ"
            description="Quick answers to common student questions."
            href="/faq"
          />
          <SettingsLink
            icon={ShieldAlert}
            title="Disclaimer"
            description="Platform usage and content responsibility."
            href="/legal-disclaimer"
          />
          <SettingsLink
            icon={Sparkles}
            title="How XP and Streak Work"
            description="Understand app engagement features and progress logic."
            href="/xp-streak"
          />
          <SettingsLink
            icon={ShieldAlert}
            title="Privacy Policy"
            description="How OCI - EduTech handles user information."
            href="/privacy-policy"
          />
          <SettingsLink
            icon={Globe}
            title="Help & Support"
            description="Reach support or share feedback with the team."
            href="/contact"
          />
        </div>

        <button
          type="button"
          className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10"
        >
          <Trash2 className="h-5 w-5" />
          Delete Account
        </button>
      </div>
    </div>
  );
}

function SettingsLink({
  icon: Icon,
  title,
  description,
  href
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-800 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/5"
    >
      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </Link>
  );
}
