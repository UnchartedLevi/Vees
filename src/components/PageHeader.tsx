import type { ReactNode } from "react";

interface Props { eyebrow?: string; title: string; description: string; action?: ReactNode; }
export default function PageHeader({ eyebrow, title, description, action }: Props) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>{eyebrow && <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>}<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[28px]">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p></div>
    {action}
  </div>;
}
