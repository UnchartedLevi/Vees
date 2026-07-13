import type { ReactNode } from "react";

const colors: Record<string, { bg: string; color: string }> = {
  High:       { bg: "rgba(255,59,48,0.08)",   color: "#C00" },
  Active:     { bg: "rgba(52,199,89,0.1)",    color: "#1A7A40" },
  Published:  { bg: "rgba(52,199,89,0.1)",    color: "#1A7A40" },
  Scheduled:  { bg: "rgba(159,131,255,0.13)", color: "#6B48F2" },
  Approved:   { bg: "rgba(159,131,255,0.13)", color: "#6B48F2" },
  Failed:     { bg: "rgba(255,59,48,0.08)",   color: "#C00" },
  "In Review":{ bg: "rgba(255,149,0,0.1)",    color: "#A05A00" },
  Medium:     { bg: "rgba(255,149,0,0.1)",    color: "#A05A00" },
  Draft:      { bg: "rgba(48,47,87,0.06)",    color: "#76728B" },
  Ready:      { bg: "rgba(159,131,255,0.13)", color: "#6B48F2" },
  Completed:  { bg: "rgba(48,47,87,0.06)",    color: "#76728B" },
  Weekly:     { bg: "rgba(159,131,255,0.13)", color: "#6B48F2" },
  Monthly:    { bg: "rgba(159,131,255,0.13)", color: "#6B48F2" },
  Campaign:   { bg: "rgba(255,149,0,0.1)",    color: "#A05A00" },
  Low:        { bg: "rgba(48,47,87,0.06)",    color: "#76728B" },
  Paused:     { bg: "rgba(48,47,87,0.06)",    color: "#76728B" },
  Planning:   { bg: "rgba(159,131,255,0.13)", color: "#6B48F2" },
  Idea:       { bg: "rgba(48,47,87,0.06)",    color: "#76728B" },
};

export default function Badge({ children }: { children: ReactNode }) {
  const label = String(children);
  const style = colors[label] ?? { bg: "rgba(48,47,87,0.06)", color: "#76728B" };

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
      style={{
        background: style.bg,
        color: style.color,
        letterSpacing: 0,
      }}
    >
      {children}
    </span>
  );
}
