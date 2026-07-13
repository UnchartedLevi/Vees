import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="section-panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
        {eyebrow && (
          <p
            className="mb-2 text-[11px] font-bold uppercase"
            style={{ color: "var(--vees-violet-2)", letterSpacing: 0 }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className="text-[26px] font-semibold sm:text-[30px]"
          style={{ color: "var(--vees-text)", letterSpacing: 0, lineHeight: 1.1 }}
        >
          {title}
        </h2>
        <p
          className="mt-2 max-w-2xl text-[15px] leading-relaxed"
          style={{ color: "var(--vees-muted)" }}
        >
          {description}
        </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
