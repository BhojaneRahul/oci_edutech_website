"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Download, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 xl:px-8">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-10 px-6 py-8 md:px-8 xl:grid-cols-[1.2fr_0.7fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <Image src="/oci-roundel.svg" alt="OCI round logo" width={24} height={24} className="h-6 w-6 rounded-full" />
                OCI - EduTech
              </div>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                A modern study platform for notes, model papers, mock tests, and academic growth.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                Built for degree and PUC students who want fast access to reliable materials, cleaner reading experiences,
                and a more professional learning app across mobile and desktop.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="https://play.google.com/store/apps/details?id=com.oci.studyresources"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600"
                >
                  <Download className="h-4 w-4" />
                  Download App
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-amber-400/40 dark:hover:text-amber-300"
                >
                  Contact Support
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Explore</h3>
              <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Link href="/">Home</Link>
                <Link href="/degree">Degree</Link>
                <Link href="/puc">PUC</Link>
                <Link href="/mock-tests">Mock Tests</Link>
                <Link href="/projects">Projects</Link>
                <Link href="/about">About Us</Link>
                <Link href="/contact">Contact Us</Link>
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/legal-disclaimer">Legal Disclaimer</Link>
                <Link href="/faq">FAQ</Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Connect & Support</h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <a href="https://www.ourcreativeinfo.in/" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-600">
                  <ArrowUpRight className="h-4 w-4 text-amber-500" />
                  Official Website
                </a>
                <a href="https://www.youtube.com/@ocistudyresources" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-600">
                  <ArrowUpRight className="h-4 w-4 text-amber-500" />
                  YouTube Channel
                </a>
                <a href="https://t.me/oci_studio" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-600">
                  <ArrowUpRight className="h-4 w-4 text-amber-500" />
                  Telegram Join
                </a>
                <div className="pt-2 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-amber-500" />
                    <span>support@ourcreativeinfo.in</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-amber-500" />
                    <span>Always here to help with your studies</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-amber-500" />
                    <span>Serving learners from 2021 to 2026 and continuing forward.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 md:px-8">
            Copyright © OCI - EduTech. Designed for a cleaner, faster, and more professional education experience.
          </div>
        </div>
      </div>
    </footer>
  );
}
