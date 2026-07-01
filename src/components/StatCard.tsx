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
      spotlightColor="rgba(0, 113, 227, 0.07)"
    >
      <div className="mb-4 flex items-start justify-between">
        <p
          className="text-[13px] font-medium"
          style={{ color: "#86868B", letterSpacing: "-0.01em" }}
        >
          {label}
        </p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[10px]"
          style={{ background: "#F5F5F7", color: "#6E6E73" }}
        >
          <Icon size={15} />
        </span>
      </div>
      <p
        className="text-[26px] font-semibold leading-none"
        style={{ color: "#1D1D1F", letterSpacing: "-0.04em" }}
      >
        {value}
      </p>
      <p
        className="mt-1.5 text-[12px]"
        style={{ color: "#86868B" }}
      >
        {helper}
      </p>
    </SpotlightCard>
  );
}
