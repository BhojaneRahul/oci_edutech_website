import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export function LoginGate() {
  return (
    <div className="rounded-[30px] border border-dashed border-amber-300 bg-amber-50 p-8 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white">
        <LockKeyhole className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-semibold">Please login to access study materials.</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Sign in to open notes, model question papers, and the embedded PDF viewer.
      </p>
      <Link href="/auth" className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500">
        Login / Signup
      </Link>
    </div>
  );
}
