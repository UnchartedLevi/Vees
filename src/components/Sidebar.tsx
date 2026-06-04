import { BarChart3, CalendarDays, FileText, Flag, LayoutDashboard, Lightbulb, LogOut, MessageCircle, Plug, Settings, Sparkles, X } from "lucide-react";

export type Page = "Dashboard" | "Calendar" | "Analytics" | "Content Ideas" | "Campaigns" | "Reports" | "Assistant" | "Settings";
interface Props { page: Page; brandName: string; scheduledCount: number; onNavigate: (page: Page) => void; onConnect:()=>void;onLogout:()=>void; open: boolean; onClose: () => void; }
const links = [
  ["Dashboard", LayoutDashboard], ["Calendar", CalendarDays], ["Analytics", BarChart3], ["Content Ideas", Lightbulb],
  ["Campaigns", Flag], ["Reports", FileText], ["Assistant", MessageCircle], ["Settings", Settings],
] as const;

export default function Sidebar({ page, brandName, scheduledCount, onNavigate,onConnect,onLogout, open, onClose }: Props) {
  return <>
    {open && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" onClick={onClose} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/70 bg-white px-4 py-5 shadow-xl shadow-slate-200/20 transition-transform lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-slate-900 p-2 text-white"><Sparkles size={17} /></span><div><p className="text-sm font-semibold">Vees</p><p className="max-w-36 truncate text-xs text-slate-400">{brandName}</p></div></div>
        <button aria-label="Close menu" className="p-1 text-slate-400 lg:hidden" onClick={onClose}><X size={18} /></button>
      </div>
      <nav className="space-y-1">{links.map(([label, Icon]) => <button key={label} onClick={() => { onNavigate(label); onClose(); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${page === label ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon size={17} />{label}</button>)}</nav>
      <div className="mt-auto space-y-3"><button onClick={() => { onConnect(); onClose(); }} className="button-secondary w-full"><Plug size={15}/> Connect account</button><div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Publishing pulse</p><p className="mt-2 text-sm font-semibold text-slate-700">{scheduledCount} posts scheduled</p><p className="mt-1 text-xs leading-5 text-slate-400">A focused week leaves room to learn from your audience.</p></div><button onClick={() => { onLogout(); onClose(); }} className="flex w-full items-center gap-2 px-2 text-xs font-semibold text-slate-400 hover:text-slate-900"><LogOut size={14}/> Log out</button></div>
    </aside>
  </>;
}
