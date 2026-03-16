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
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
