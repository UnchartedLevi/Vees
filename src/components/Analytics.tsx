import { useMemo, useState } from "react";
import { BarChart3, Bookmark, ExternalLink, Eye, Heart, MessageCircle, Plus, Share2, Sparkles, Trash2, TrendingUp } from "lucide-react";
import type { AppDataProps } from "../App";
import { contentTypes } from "../data/options";
import type { ContentType, Post, SocialAccount, SocialPlatform } from "../types";
import { engagementRate, formatNumber, insightForPost } from "../utils/analytics";
import { orderedPlatforms, platformLabel } from "../utils/channels";
import { toDateKey } from "../utils/dates";
import Badge from "./Badge";
import Modal from "./Modal";
import PageHeader from "./PageHeader";
import SocialPlatformIcon from "./SocialPlatformIcon";

const createBlank = () => ({
  title: "",
  platform: "Instagram" as SocialPlatform,
  contentType: "Reel" as ContentType,
  datePosted: toDateKey(new Date()),
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  reach: 0,
  impressions: 0,
  campaignId: "",
  contentGoal: "Build trust",
});

const postsForAccount = (posts: AppDataProps["posts"], account: SocialAccount) => {
  const directMatches = posts.filter((post) => post.socialAccountId === account.id);
  return directMatches.length ? directMatches : posts.filter((post) => !post.socialAccountId && post.platform === account.platform);
};

type SortMode = "rate_desc" | "rate_asc" | "newest" | "oldest";

const sortLabels: Record<SortMode, string> = {
  rate_desc: "Rate: high to low",
  rate_asc: "Rate: low to high",
  newest: "Newest to oldest",
  oldest: "Oldest to newest",
};

const metricTotal = (post: Post) => post.likes + post.comments + post.shares + post.saves;

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return "N/A";
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;
  return minutes ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
};

const averageWatchSeconds = (post: Post) => {
  if (!post.durationSeconds || post.retentionRate == null) return undefined;
  return post.durationSeconds * (post.retentionRate / 100);
};

const metricBars = (post: Post) => [
  { label: "Views", value: post.impressions || post.reach, color: "bg-blue-500", icon: Eye },
  { label: "Likes", value: post.likes, color: "bg-rose-500", icon: Heart },
  { label: "Comments", value: post.comments, color: "bg-amber-500", icon: MessageCircle },
  { label: "Shares", value: post.shares, color: "bg-emerald-500", icon: Share2 },
  { label: "Saves", value: post.saves, color: "bg-slate-700", icon: Bookmark },
];

export default function Analytics({ posts, setPosts, campaigns, socialAccounts, onConnect }: AppDataProps) {
  const connectedAccounts = socialAccounts.filter((account) => account.connectionStatus === "connected");
  const [accountFilter, setAccountFilter] = useState("All");
  const [format, setFormat] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("rate_desc");
  const [open, setOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [form, setForm] = useState(createBlank);
  const channelOrder = orderedPlatforms(socialAccounts);

  const filtered = useMemo(() => {
    const selectedAccount = connectedAccounts.find((account) => account.id === accountFilter);
    const basePosts = selectedAccount ? postsForAccount(posts, selectedAccount) : posts;
    return basePosts
      .filter((post) => format === "All" || post.contentType === format)
      .sort((a, b) => {
        if (sortMode === "newest") return b.datePosted.localeCompare(a.datePosted);
        if (sortMode === "oldest") return a.datePosted.localeCompare(b.datePosted);
        return sortMode === "rate_desc" ? engagementRate(b) - engagementRate(a) : engagementRate(a) - engagementRate(b);
      });
  }, [accountFilter, connectedAccounts, format, posts, sortMode]);

  const updateNumber = (key: keyof ReturnType<typeof createBlank>, value: string) => setForm({ ...form, [key]: Number(value) });
  const add = () => {
    if (!form.title.trim()) return;
    setPosts((current) => [...current, { ...form, id: crypto.randomUUID(), campaignId: form.campaignId || undefined }]);
    setForm(createBlank());
    setOpen(false);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Performance library"
        title="Post analytics"
        description="Choose a connected account first, then review that account's posts and metrics."
        action={<button className="button-primary" onClick={() => setOpen(true)}><Plus size={16} /> Track post</button>}
      />

      <section className="card p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setAccountFilter("All")}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition ${accountFilter === "All" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
          >
            All accounts
          </button>
          {connectedAccounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setAccountFilter(account.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left text-sm transition ${accountFilter === account.id ? "border-slate-950 bg-slate-950 text-white" : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <SocialPlatformIcon platform={account.platform} size="sm" />
                {account.accountName}
              </span>
              <span className={`block text-[11px] ${accountFilter === account.id ? "text-white/70" : "text-emerald-700"}`}>
                {platformLabel(account.platform)} - {account.accountHandle}
              </span>
            </button>
          ))}
          {channelOrder.filter((platform) => !connectedAccounts.some((account) => account.platform === platform)).map((platform) => (
            <button
              key={platform}
              onClick={onConnect}
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 font-semibold">
                <SocialPlatformIcon platform={platform} size="sm" />
                {platformLabel(platform)}
              </span>
              <span className="block text-[11px] text-slate-400">Not connected</span>
            </button>
          ))}
        </div>
      </section>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row">
          <select aria-label="Filter analytics by connected account" className="input sm:w-64" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option value="All">All accounts</option>
            {connectedAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {platformLabel(account.platform)} - {account.accountName}
              </option>
            ))}
          </select>
          <select aria-label="Filter analytics by content type" className="input sm:w-44" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option>All</option>
            {contentTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Sort analytics" className="input sm:ml-auto sm:w-52" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            {(Object.keys(sortLabels) as SortMode[]).map((value) => <option key={value} value={value}>{sortLabels[value]}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-50/70 text-[11px] uppercase tracking-[0.1em] text-slate-400">
              <tr>{["Post", "Account", "Posted", "Likes", "Comments", "Shares", "Saves", "Reach", "Impressions", "Rate", "Insight", ""].map((item, index) => <th key={`${item}-${index}`} className="px-5 py-3.5 font-semibold">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length ? filtered.map((post) => {
                const account = socialAccounts.find((item) => item.id === post.socialAccountId);
                return (
                  <tr key={post.id} className="cursor-pointer text-slate-600 transition hover:bg-slate-50" onClick={() => setSelectedPost(post)}>
                    <td className="max-w-56 px-5 py-4"><p className="truncate font-semibold text-slate-700">{post.title}</p><p className="mt-1 text-xs text-slate-400">{post.contentType}</p></td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2">
                        <SocialPlatformIcon platform={post.platform} size="sm" />
                        {account ? account.accountName : platformLabel(post.platform)}
                      </span>
                      {account && <p className="mt-1 text-xs text-slate-400">{account.accountHandle}</p>}
                    </td>
                    <td className="px-5 py-4 text-xs">{post.datePosted}</td>
                    {[post.likes, post.comments, post.shares, post.saves, post.reach, post.impressions].map((value, index) => <td key={index} className="px-5 py-4">{formatNumber(value)}</td>)}
                    <td className="px-5 py-4 font-semibold text-slate-900">{engagementRate(post).toFixed(1)}%</td>
                    <td className="px-5 py-4"><Badge>{insightForPost(post)}</Badge></td>
                    <td className="px-5 py-4"><button aria-label={`Delete ${post.title}`} onClick={(event) => { event.stopPropagation(); setPosts((current) => current.filter((item) => item.id !== post.id)); }} className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></td>
                  </tr>
                );
              }) : <tr><td colSpan={12} className="px-5 py-12 text-center text-sm text-slate-400">No tracked posts match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title="Track a published post" onClose={() => setOpen(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">Post title</span><input className="input" placeholder="Use the published headline or a clear working title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label><span className="label">Platform</span><select className="input" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as SocialPlatform })}>{orderedPlatforms(socialAccounts).map((item) => <option key={item} value={item}>{platformLabel(item)}</option>)}</select></label>
            <label><span className="label">Content type</span><select className="input" value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })}>{contentTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="label">Date posted</span><input type="date" className="input" value={form.datePosted} onChange={(e) => setForm({ ...form, datePosted: e.target.value })} /></label>
            <label><span className="label">Campaign</span><select className="input" value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value })}><option value="">No campaign</option>{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            {(["likes", "comments", "shares", "saves", "reach", "impressions"] as const).map((key) => <label key={key}><span className="label">{key}</span><input type="number" min="0" className="input" value={form[key]} onChange={(e) => updateNumber(key, e.target.value)} /></label>)}
            <label className="sm:col-span-2"><span className="label">Content goal</span><input className="input" placeholder="e.g. Increase awareness or drive inquiries" value={form.contentGoal} onChange={(e) => setForm({ ...form, contentGoal: e.target.value })} /></label>
            <p className="sm:col-span-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs font-medium text-slate-500">Calculated engagement rate: <span className="font-bold text-slate-900">{form.reach ? (((form.likes + form.comments + form.shares + form.saves) / form.reach) * 100).toFixed(1) : "0.0"}%</span></p>
            <button className="button-primary sm:col-span-2" onClick={add}>Save performance</button>
          </div>
        </Modal>
      )}

      {selectedPost && (
        <Modal title="Video performance" size="xl" onClose={() => setSelectedPost(null)}>
          <PostPerformanceDetail
            post={selectedPost}
            account={socialAccounts.find((item) => item.id === selectedPost.socialAccountId)}
          />
        </Modal>
      )}
    </div>
  );
}

function PostPerformanceDetail({ post, account }: { post: Post; account?: SocialAccount }) {
  const bars = metricBars(post);
  const maxValue = Math.max(...bars.map((item) => item.value), 1);
  const totalEngagement = metricTotal(post);
  const rate = engagementRate(post);
  const avgWatch = averageWatchSeconds(post);
  const summary = [
    { label: "Views", value: post.impressions || post.reach, helper: "Video exposure", icon: Eye, tone: "text-blue-700 bg-blue-50 border-blue-100" },
    { label: "Engagement", value: totalEngagement, helper: "Likes, comments, shares, saves", icon: Heart, tone: "text-rose-700 bg-rose-50 border-rose-100" },
    { label: "Rate", value: `${rate.toFixed(1)}%`, helper: "Engagement by reach", icon: TrendingUp, tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
    {
      label: "Avg. watch",
      value: formatDuration(avgWatch),
      helper: post.retentionRate != null ? `${post.retentionRate.toFixed(1)}% retention${post.durationSeconds ? ` of ${formatDuration(post.durationSeconds)}` : ""}` : "Requires platform retention data",
      icon: Bookmark,
      tone: "text-violet-700 bg-violet-50 border-violet-100",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-white/60">
              <SocialPlatformIcon platform={post.platform} size="sm" />
              {account ? account.accountName : platformLabel(post.platform)} / {post.contentType}
            </p>
            <h3 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight tracking-tight">{post.title}</h3>
            <p className="mt-3 text-sm text-white/60">Posted {post.datePosted}</p>
            {post.externalUrl ? (
              <a
                href={post.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
              >
                Open original post
                <ExternalLink size={14} />
              </a>
            ) : (
              <p className="mt-5 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-sm text-white/60">
                Original post link is not available for this synced item yet.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-white/50">Performance signal</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold"><Sparkles size={15} /> {insightForPost(post)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase">{item.label}</p>
                <Icon size={17} />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{typeof item.value === "number" ? formatNumber(item.value) : item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <BarChart3 size={17} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-950">Metric breakdown</h3>
          </div>
          <div className="mt-5 space-y-4">
            {bars.map((item, index) => {
              const Icon = item.icon;
              const width = Math.max((item.value / maxValue) * 100, item.value ? 10 : 3);
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-700"><Icon size={15} /> {item.label}</span>
                    <span className="font-semibold text-slate-950">{formatNumber(item.value)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`analytics-bar h-full rounded-full ${item.color}`}
                      style={{ width: `${width}%`, animationDelay: `${index * 80}ms` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-950">Engagement mix</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {bars.slice(1).map((item) => {
              const pct = totalEngagement ? Math.round((item.value / totalEngagement) * 100) : 0;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{pct}%</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500">
            Use this view to compare attention signals. Views show exposure, while saves and shares usually indicate stronger audience intent.
          </p>
        </div>
      </section>
    </div>
  );
}
