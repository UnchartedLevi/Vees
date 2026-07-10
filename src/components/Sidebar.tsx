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
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-white/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRight: "1px solid rgba(0,0,0,0.07)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-white"
              style={{ background: "linear-gradient(145deg, #1D1D1F 0%, #3A3A3C 100%)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
                <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" fillOpacity="0.4"/>
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight" style={{ color: "#1D1D1F", letterSpacing: "-0.03em" }}>
                Vees
              </p>
              <p className="max-w-[140px] truncate text-[11px]" style={{ color: "#86868B" }}>
                {brandName}
              </p>
            </div>
          </div>
          <button
            aria-label="Close menu"
            className="flex h-7 w-7 items-center justify-center rounded-full transition lg:hidden"
            style={{ background: "rgba(0,0,0,0.05)", color: "#6E6E73" }}
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links.map(([label, Icon]) => {
            const active = page === label;
            return (
              <button
                key={label}
                onClick={() => { onNavigate(label); onClose(); }}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer"
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: active ? 600 : 400,
                  backgroundColor: active ? "rgba(0, 113, 227, 0.08)" : "transparent",
                  color: active ? "#0071E3" : "#6E6E73",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <Icon size={17} className={active ? "text-[#0071E3]" : "text-[#86868B]"} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-6 pt-4 space-y-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {/* Publishing pulse */}
          <div
            className="rounded-[14px] p-3.5"
            style={{ background: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#86868B" }}>
              Publishing pulse
            </p>
            <p className="mt-1.5 text-[15px] font-semibold tracking-tight" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              {scheduledCount} posts scheduled
            </p>
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "#86868B" }}>
              A focused week leaves room to learn from your audience.
            </p>
          </div>

          <button
            onClick={() => { onLogout(); onClose(); }}
            className="flex w-full items-center gap-2 px-2 py-1 transition-colors duration-150 cursor-pointer"
            style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#86868B", borderRadius: "8px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#1D1D1F"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#86868B"; }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
