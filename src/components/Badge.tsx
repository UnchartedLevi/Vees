import type { ReactNode } from "react";

const colors: Record<string, { bg: string; color: string }> = {
  High:       { bg: "rgba(255,59,48,0.08)",   color: "#C00" },
  Active:     { bg: "rgba(52,199,89,0.1)",    color: "#1A7A40" },
  Published:  { bg: "rgba(52,199,89,0.1)",    color: "#1A7A40" },
  Scheduled:  { bg: "rgba(0,113,227,0.08)",   color: "#0055B3" },
  Approved:   { bg: "rgba(88,86,214,0.08)",   color: "#4840C9" },
  Failed:     { bg: "rgba(255,59,48,0.08)",   color: "#C00" },
  "In Review":{ bg: "rgba(255,149,0,0.1)",    color: "#A05A00" },
  Medium:     { bg: "rgba(255,149,0,0.1)",    color: "#A05A00" },
  Draft:      { bg: "rgba(0,0,0,0.05)",       color: "#6E6E73" },
  Ready:      { bg: "rgba(88,86,214,0.08)",   color: "#4840C9" },
  Completed:  { bg: "rgba(0,0,0,0.05)",       color: "#6E6E73" },
  Weekly:     { bg: "rgba(0,113,227,0.08)",   color: "#0055B3" },
  Monthly:    { bg: "rgba(88,86,214,0.08)",   color: "#4840C9" },
  Campaign:   { bg: "rgba(255,149,0,0.1)",    color: "#A05A00" },
  Low:        { bg: "rgba(0,0,0,0.05)",       color: "#6E6E73" },
  Paused:     { bg: "rgba(0,0,0,0.05)",       color: "#6E6E73" },
  Planning:   { bg: "rgba(0,113,227,0.08)",   color: "#0055B3" },
  Idea:       { bg: "rgba(0,0,0,0.05)",       color: "#6E6E73" },
};

export default function Badge({ children }: { children: ReactNode }) {
  const label = String(children);
  const style = colors[label] ?? { bg: "rgba(0,0,0,0.05)", color: "#6E6E73" };

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
      style={{
        background: style.bg,
        color: style.color,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}
