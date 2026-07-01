import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p
            className="mb-2 text-[11px] font-semibold uppercase"
            style={{ color: "#86868B", letterSpacing: "0.1em" }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className="text-[28px] font-semibold sm:text-[32px]"
          style={{ color: "#1D1D1F", letterSpacing: "-0.04em", lineHeight: 1.1 }}
        >
          {title}
        </h2>
        <p
          className="mt-2 max-w-2xl text-[15px] leading-relaxed"
          style={{ color: "#6E6E73" }}
        >
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
