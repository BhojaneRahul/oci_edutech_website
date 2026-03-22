"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export default function GoogleSuccessPage() {
  const router = useRouter();
  const { refreshUser, setAuthUser } = useAuth();

  useEffect(() => {
    let active = true;

    const completeGoogleLogin = async () => {
      try {
        const user = await refreshUser();

        if (!active) return;

        setAuthUser(user);

        if (user?.role === "admin") {
          router.replace("/admin");
          return;
        }

        router.replace("/account");
      } catch {
        if (!active) return;
        router.replace("/auth?error=google");
      }
    };

    completeGoogleLogin();

    return () => {
      active = false;
    };
  }, [refreshUser, router, setAuthUser]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Signing you in with Google</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
          We are finishing your account setup and syncing your profile photo.
        </p>
      </div>
    </div>
  );
}
