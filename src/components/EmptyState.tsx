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
        style={{ background: "rgba(159, 131, 255, 0.12)", color: "var(--vees-violet-2)" }}
      >
        <Icon size={22} />
      </span>
      <p
        className="mt-4 text-[17px] font-semibold"
        style={{ color: "var(--vees-text)", letterSpacing: 0 }}
      >
        {title}
      </p>
      <p
        className="mt-2 max-w-sm text-[14px] leading-relaxed"
        style={{ color: "var(--vees-muted)" }}
      >
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
