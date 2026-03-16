import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function AboutPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-4xl font-semibold">About Us</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Welcome to OCI - Study Resources, dedicated to fostering a culture of learning, exploration, and growth. Our platform is designed to empower students, educators, and lifelong learners by providing a wealth of resources to support academic excellence and personal development.
          </p>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            We are excited to share creative learning resources with you. Our app provides comprehensive notes, question-and-answer sets for degree and PUC students, and interactive mock tests to help you practice and improve your skills. Additionally, we offer competitions and other learning activities to make studying engaging and effective.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              OCI Study Resources is dedicated to providing high-quality educational content for students. Our mission is to simplify learning and make resources easily accessible.
            </p>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Our Vision</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Our vision is to empower learners worldwide by providing easy access to educational resources, fostering knowledge, creativity, and academic excellence.
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold">What We Provide</h2>
          <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
            <li>Mock tests and practice quizzes</li>
            <li>Project guides and tutorials</li>
            <li>PDF study materials</li>
            <li>Support for learners from 2021 to 2026 and beyond</li>
          </ul>
          <p className="mt-5 text-slate-600 dark:text-slate-300">
            Our team is passionate about helping students succeed. We strive to deliver accurate, high-quality content that makes studying simpler and more enjoyable.
          </p>
          <p className="mt-5 text-slate-600 dark:text-slate-300">
            Support: support@ourcreativeinfo.in
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
