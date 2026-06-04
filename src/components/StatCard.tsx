import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}

export default function StatCard({ label, value, helper, icon: Icon }: StatCardProps) {
  return (
    <div className="card card-hover p-5">
      <div className="mb-5 flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="rounded-xl bg-slate-50 p-2 text-slate-500"><Icon size={17} /></span>
      </div>
      <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-1.5 text-xs text-slate-400">{helper}</p>
    </div>
  );
}
