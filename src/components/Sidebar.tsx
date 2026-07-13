import {
  BarChart3, CalendarDays, FileText, Flag, LayoutDashboard,
  Lightbulb, LogOut, MessageCircle, Plug, Settings, X,
  type LucideIcon,
} from "lucide-react";

export type Page = "Dashboard" | "Connect" | "Calendar" | "Analytics" | "Content Ideas" | "Campaigns" | "Reports" | "Assistant" | "Settings";

interface Props {
  page: Page;
  brandName: string;
  scheduledCount: number;
  onNavigate: (page: Page) => void;
  onConnect: () => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

const links: [Page, LucideIcon][] = [
  ["Dashboard", LayoutDashboard],
  ["Connect", Plug],
  ["Calendar", CalendarDays],
  ["Analytics", BarChart3],
  ["Content Ideas", Lightbulb],
  ["Campaigns", Flag],
  ["Reports", FileText],
  ["Assistant", MessageCircle],
  ["Settings", Settings],
];

export default function Sidebar({ page, brandName, scheduledCount, onNavigate, onConnect, onLogout, open, onClose }: Props) {
  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-white/90 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRight: "1px solid var(--vees-line)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pb-5 pt-6">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[12px]"
              style={{ boxShadow: "0 10px 22px rgba(48,47,87,0.18)" }}
            >
              <img src="/vees-icon.svg" alt="" className="h-full w-full" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--vees-text)", letterSpacing: 0 }}>
                Vees
              </p>
              <p className="max-w-[140px] truncate text-[11px]" style={{ color: "var(--vees-muted)" }}>
                {brandName}
              </p>
            </div>
          </div>
          <button
            aria-label="Close menu"
            className="flex h-7 w-7 items-center justify-center rounded-full transition lg:hidden"
            style={{ background: "rgba(48,47,87,0.08)", color: "var(--vees-muted)" }}
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {links.map(([label, Icon]) => {
            const active = page === label;
            const primary = label === "Dashboard" || label === "Connect";
            return (
              <button
                key={label}
                onClick={() => { onNavigate(label); onClose(); }}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer"
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: active ? 600 : 400,
                  backgroundColor: active ? "rgba(159, 131, 255, 0.16)" : primary ? "rgba(48,47,87,0.04)" : "transparent",
                  color: active ? "var(--vees-violet-2)" : primary ? "var(--vees-text)" : "var(--vees-muted)",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(48,47,87,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = primary ? "rgba(48,47,87,0.04)" : "transparent";
                }}
              >
                <Icon size={17} style={{ color: active ? "var(--vees-violet-2)" : primary ? "var(--vees-text)" : "var(--vees-muted)" }} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-6 pt-4 space-y-3" style={{ borderTop: "1px solid var(--vees-line)" }}>
          {/* Publishing pulse */}
          <div className="rounded-[14px] p-3.5" style={{ background: "linear-gradient(135deg, rgba(159,131,255,0.12), rgba(246,166,213,0.10))", border: "1px solid rgba(159,131,255,0.18)" }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--vees-muted)", letterSpacing: 0 }}>
              Publishing pulse
            </p>
            <p className="mt-1.5 text-[15px] font-semibold tracking-tight" style={{ color: "var(--vees-text)", letterSpacing: 0 }}>
              {scheduledCount} posts scheduled
            </p>
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--vees-muted)" }}>
              A focused week leaves room to learn from your audience.
            </p>
          </div>

          <button
            onClick={() => { onLogout(); onClose(); }}
            className="flex w-full items-center gap-2 px-2 py-1 transition-colors duration-150 cursor-pointer"
            style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--vees-muted)", borderRadius: "8px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--vees-text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--vees-muted)"; }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
