import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className = "" }: Props) {
  return (
    <div
      className={`card flex flex-col items-center justify-center px-8 py-16 text-center ${className}`}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-[18px]"
        style={{ background: "#F5F5F7", color: "#86868B" }}
      >
        <Icon size={22} />
      </span>
      <p
        className="mt-4 text-[17px] font-semibold"
        style={{ color: "#1D1D1F", letterSpacing: "-0.025em" }}
      >
        {title}
      </p>
      <p
        className="mt-2 max-w-sm text-[14px] leading-relaxed"
        style={{ color: "#6E6E73" }}
      >
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
