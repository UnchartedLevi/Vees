import type { LucideIcon } from "lucide-react";
import SpotlightCard from "./SpotlightCard";

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}

export default function StatCard({ label, value, helper, icon: Icon }: StatCardProps) {
  return (
    <SpotlightCard
      className="card card-hover p-5 cursor-default"
      spotlightColor="rgba(159, 131, 255, 0.13)"
    >
      <div className="mb-4 flex items-start justify-between">
        <p
          className="text-[13px] font-medium"
          style={{ color: "var(--vees-muted)", letterSpacing: 0 }}
        >
          {label}
        </p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[10px]"
          style={{ background: "rgba(159, 131, 255, 0.12)", color: "var(--vees-violet-2)" }}
        >
          <Icon size={15} />
        </span>
      </div>
      <p
        className="text-[26px] font-semibold leading-none"
        style={{ color: "var(--vees-text)", letterSpacing: 0 }}
      >
        {value}
      </p>
      <p
        className="mt-1.5 text-[12px]"
        style={{ color: "var(--vees-muted)" }}
      >
        {helper}
      </p>
    </SpotlightCard>
  );
}
