"use client";

import { MessageSquareQuote, Star, Store } from "lucide-react";

const reviewHighlights = [
  "Share what helped you most in notes, mock tests, or saved PDFs.",
  "Tell us what should improve so we can make the app feel smoother and faster.",
  "Rate the mobile app directly on Play Store and help more students trust it."
];

export function ReviewsSection() {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <MessageSquareQuote className="h-4 w-4" />
            Reviews and Feedback
          </div>
          <h2 className="mt-4 text-[1.18rem] font-semibold tracking-tight text-slate-950 sm:text-[1.35rem] dark:text-white">
            Rate the app, send feedback, and help us improve the OCI - EduTech experience.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Instead of static testimonials, we want real feedback from learners using the app every day. Share your
            review, rate the mobile experience on Play Store, and help us improve notes, community features, and study
            support with practical feedback.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:max-w-[540px]">
          {reviewHighlights.map((item) => (
            <div
              key={item}
              className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href="https://play.google.com/store/apps/details?id=com.oci.studyresources&showAllReviews=true"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
        >
          <Star className="h-4 w-4" />
          Rate on Play Store
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.oci.studyresources&showAllReviews=true"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-amber-300"
        >
          <Store className="h-4 w-4" />
          Open review page
        </a>
      </div>
    </section>
  );
}
