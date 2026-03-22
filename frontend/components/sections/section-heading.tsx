export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">{eyebrow}</p>
      <h2 className="mt-3 text-[1.8rem] font-semibold tracking-tight md:text-[2rem]">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

