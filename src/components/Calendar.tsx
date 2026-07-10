import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock3, Lightbulb } from "lucide-react";
import type { AppDataProps } from "../App";
import { contentTypes } from "../data/options";
import type { ContentType, Priority, ScheduleStatus, SocialPlatform } from "../types";
import { toDateKey } from "../utils/dates";
import { accountForPlatform, orderedPlatforms, platformLabel } from "../utils/channels";
import Badge from "./Badge";
import Modal from "./Modal";
import PageHeader from "./PageHeader";
import SocialPlatformIcon from "./SocialPlatformIcon";

const statuses: ScheduleStatus[] = ["Idea", "Draft", "In Review", "Approved", "Scheduled", "Published", "Failed"];

const monthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
const addMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const createBlank = (date = toDateKey(new Date()), platform: SocialPlatform = "YouTube Shorts") => ({
  title: "",
  platform,
  contentType: "Video" as ContentType,
  scheduledDate: date,
  status: "Draft" as ScheduleStatus,
  campaignId: "",
  contentGoal: "Build trust",
  notes: "",
  priority: "Medium" as Priority,
});

export default function Calendar({ scheduledPosts, setScheduledPosts, setIdeas, campaigns, socialAccounts }: AppDataProps) {
  const firstConnected = socialAccounts.find((account) => account.connectionStatus === "connected")?.platform ?? "YouTube Shorts";
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [form, setForm] = useState(() => createBlank(toDateKey(new Date()), firstConnected));
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"All" | SocialPlatform>("All");
  const [status, setStatus] = useState<"All" | ScheduleStatus>("All");
  const channelOrder = orderedPlatforms(socialAccounts);

  const days = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const last = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const cells: { key: string; date?: Date; dateKey?: string }[] = [];
    for (let i = 0; i < first.getDay(); i += 1) cells.push({ key: `blank-start-${i}` });
    for (let day = 1; day <= last.getDate(); day += 1) {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
      cells.push({ key: toDateKey(date), date, dateKey: toDateKey(date) });
    }
    while (cells.length % 7 !== 0) cells.push({ key: `blank-end-${cells.length}` });
    return cells;
  }, [visibleMonth]);

  const filteredPosts = useMemo(() => scheduledPosts
    .filter((post) => post.scheduledDate.startsWith(`${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}`))
    .filter((post) => platform === "All" || post.platform === platform)
    .filter((post) => status === "All" || post.status === status), [platform, scheduledPosts, status, visibleMonth]);

  const postsByDate = useMemo(() => filteredPosts.reduce<Record<string, typeof filteredPosts>>((groups, post) => {
    groups[post.scheduledDate] = [...(groups[post.scheduledDate] ?? []), post];
    return groups;
  }, {}), [filteredPosts]);

  const openForDay = (dateKey: string) => {
    setForm(createBlank(dateKey, firstConnected));
    setOpen(true);
  };

  const add = () => {
    if (!form.title.trim()) return;
    const ideaId = crypto.randomUUID();
    setScheduledPosts((current) => [...current, {
      id: crypto.randomUUID(),
      title: form.title,
      platform: form.platform,
      contentType: form.contentType,
      scheduledDate: form.scheduledDate,
      status: form.status,
      campaignId: form.campaignId || undefined,
      contentGoal: form.contentGoal,
      notes: form.notes,
    }]);
    setIdeas((current) => [...current, {
      id: ideaId,
      title: form.title,
      platform: form.platform,
      format: form.contentType,
      goal: form.contentGoal,
      priority: form.priority,
      status: form.status === "Idea" ? "Backlog" : "Scheduled",
      notes: form.notes || `Planned from calendar for ${form.scheduledDate}`,
    }]);
    setForm(createBlank(form.scheduledDate, form.platform));
    setOpen(false);
  };

  const updateStatus = (id: string, next: ScheduleStatus) => setScheduledPosts((current) => current.map((post) => post.id === id ? { ...post, status: next } : post));

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Publishing workflow"
        title="Content calendar"
        description="Plan by day, choose a platform, and save the plan into both your calendar and content ideas."
        action={<button className="button-primary" onClick={() => openForDay(toDateKey(new Date()))}><CalendarPlus size={16} /> Plan content</button>}
      />

      <section className="card p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex items-center gap-2">
            <button aria-label="Previous month" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" onClick={() => setVisibleMonth((current) => addMonths(current, -1))}><ChevronLeft size={16} /></button>
            <p className="min-w-44 text-center text-base font-semibold text-slate-950">{monthLabel(visibleMonth)}</p>
            <button aria-label="Next month" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}><ChevronRight size={16} /></button>
          </div>
          <div className="flex gap-2 overflow-x-auto xl:ml-auto">
            <button onClick={() => setPlatform("All")} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${platform === "All" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-500"}`}>All</button>
            {channelOrder.map((item) => {
              const account = accountForPlatform(socialAccounts, item);
              return <button key={item} onClick={() => setPlatform(item)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${platform === item ? "border-slate-950 bg-slate-950 text-white" : account ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`}><SocialPlatformIcon platform={item} size="sm" />{platformLabel(item)}</button>;
            })}
          </div>
          <select aria-label="Filter calendar by status" className="input xl:w-44" value={status} onChange={(e) => setStatus(e.target.value as "All" | ScheduleStatus)}>
            <option>All</option>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
          {dayNames.map((day) => <div key={day} className="px-2 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((cell) => {
            const dayPosts = cell.dateKey ? postsByDate[cell.dateKey] ?? [] : [];
            return (
              <button
                key={cell.key}
                disabled={!cell.dateKey}
                onClick={() => cell.dateKey && openForDay(cell.dateKey)}
                className={`min-h-32 border-b border-r border-slate-100 p-2 text-left align-top transition ${cell.dateKey ? "bg-white hover:bg-slate-50" : "bg-slate-50/50"}`}
              >
                {cell.dateKey && (
                  <>
                    <span className="text-xs font-semibold text-slate-500">{cell.date?.getDate()}</span>
                    <div className="mt-2 space-y-1.5">
                      {dayPosts.slice(0, 3).map((post) => (
                        <div key={post.id} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                          <p className="truncate text-[11px] font-semibold text-slate-800">{post.title}</p>
                          <p className="flex items-center gap-1 truncate text-[10px] text-slate-400"><SocialPlatformIcon platform={post.platform} size="sm" />{platformLabel(post.platform)} / {post.contentType}</p>
                        </div>
                      ))}
                      {dayPosts.length > 3 && <p className="text-[10px] font-semibold text-slate-400">+{dayPosts.length - 3} more</p>}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {filteredPosts.length > 0 && (
        <section className="grid gap-3 lg:grid-cols-2">
          {filteredPosts.map((post) => (
            <article key={post.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge>{post.status}</Badge>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400"><SocialPlatformIcon platform={post.platform} size="sm" />{platformLabel(post.platform)}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold leading-6 text-slate-800">{post.title}</h3>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{post.notes || post.contentGoal}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400"><span className="flex items-center gap-1.5"><Clock3 size={14} />{post.scheduledDate}</span><span>{post.contentType}</span></div>
              <select aria-label={`Update status for ${post.title}`} className="input mt-4 text-xs" value={post.status} onChange={(e) => updateStatus(post.id, e.target.value as ScheduleStatus)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
            </article>
          ))}
        </section>
      )}

      {open && (
        <Modal title={`Plan content for ${form.scheduledDate}`} onClose={() => setOpen(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">Title or working idea</span><input className="input" placeholder="e.g. How I plan a week of YouTube content" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><span className="helper">This will be saved to Content Ideas and added to the calendar.</span></label>
            <label><span className="label">Platform</span><select className="input" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as SocialPlatform })}>{channelOrder.map((item) => <option key={item} value={item}>{platformLabel(item)}</option>)}</select></label>
            <label><span className="label">Format</span><select className="input" value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })}>{contentTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="label">Publish date</span><input type="date" className="input" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></label>
            <label><span className="label">Workflow status</span><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ScheduleStatus })}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="label">Priority</span><select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}><option>High</option><option>Medium</option><option>Low</option></select></label>
            <label><span className="label">Campaign</span><select className="input" value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value })}><option value="">No campaign</option>{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="sm:col-span-2"><span className="label">Goal</span><input className="input" placeholder="e.g. Build trust or increase inquiries" value={form.contentGoal} onChange={(e) => setForm({ ...form, contentGoal: e.target.value })} /></label>
            <label className="sm:col-span-2"><span className="label">Notes</span><textarea className="input min-h-24" placeholder="Add hook, angle, outline, CTA, or reference links." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <button className="button-primary sm:col-span-2" onClick={add}><Lightbulb size={15} /> Save plan and idea</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
