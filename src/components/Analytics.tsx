import { useMemo, useState } from "react";
import { ArrowDownUp, Plus, Trash2 } from "lucide-react";
import type { AppDataProps } from "../App";
import { contentTypes } from "../data/options";
import type { ContentType, SocialAccount, SocialPlatform } from "../types";
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

export default function Analytics({ posts, setPosts, campaigns, socialAccounts, onConnect }: AppDataProps) {
  const connectedAccounts = socialAccounts.filter((account) => account.connectionStatus === "connected");
  const [accountFilter, setAccountFilter] = useState("All");
  const [format, setFormat] = useState("All");
  const [descending, setDescending] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(createBlank);
  const channelOrder = orderedPlatforms(socialAccounts);

  const filtered = useMemo(() => {
    const selectedAccount = connectedAccounts.find((account) => account.id === accountFilter);
    const basePosts = selectedAccount ? postsForAccount(posts, selectedAccount) : posts;
    return basePosts
      .filter((post) => format === "All" || post.contentType === format)
      .sort((a, b) => descending ? engagementRate(b) - engagementRate(a) : engagementRate(a) - engagementRate(b));
  }, [accountFilter, connectedAccounts, descending, format, posts]);

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
          <button className="button-secondary sm:ml-auto" onClick={() => setDescending(!descending)}>
            <ArrowDownUp size={15} /> Rate: {descending ? "high to low" : "low to high"}
          </button>
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
                  <tr key={post.id} className="text-slate-600">
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
                    <td className="px-5 py-4"><button aria-label={`Delete ${post.title}`} onClick={() => setPosts((current) => current.filter((item) => item.id !== post.id))} className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></td>
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
    </div>
  );
}
