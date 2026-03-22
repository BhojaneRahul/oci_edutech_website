import { Quote } from "lucide-react";
import { SectionHeading } from "./section-heading";

const testimonials = [
  {
    name: "Shruthi B.",
    role: "BCA Student",
    quote: "OCI - EduTech helped me keep all my notes, mock tests, and model papers in one place. It feels much easier to revise before exams."
  },
  {
    name: "Rahul N.",
    role: "PUC Learner",
    quote: "The saved notes and quick PDF access are the best part. I can continue reading on web and mobile without losing my progress."
  },
  {
    name: "Aparna K.",
    role: "Degree Student",
    quote: "The organized streams, mock tests, and project references make this feel like a proper learning app rather than a simple file website."
  }
];

export function TestimonialsSection() {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <SectionHeading
        eyebrow="Testimonials"
        title="What learners say about OCI - EduTech"
        description="Real student feedback from learners using notes, mock tests, and saved resources across the platform."
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <Quote className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">“{testimonial.quote}”</p>
            <div className="mt-6">
              <p className="text-base font-semibold text-slate-950 dark:text-white">{testimonial.name}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
