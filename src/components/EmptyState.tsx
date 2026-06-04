import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props { icon: LucideIcon; title: string; description: string; action?: ReactNode; className?: string; }
export default function EmptyState({ icon: Icon, title, description, action, className = "" }: Props) {
  return <div className={`card flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}><span className="rounded-2xl bg-slate-50 p-3 text-slate-400"><Icon size={20} /></span><p className="mt-4 font-semibold tracking-tight text-slate-800">{title}</p><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
