import { ArrowUpRight, CalendarCheck, CheckCircle2, Eye, Heart, Layers3, Lightbulb, Link2, PencilLine, Radio, Send, Sparkles, TrendingUp } from "lucide-react";
import type { AppDataProps } from "../App";
import type { SocialPlatform } from "../types";
import { engagementTotal, formatNumber } from "../utils/analytics";
import { accountForPlatform, orderedPlatforms, platformLabel } from "../utils/channels";
import {
  generateRecommendations, getAverageEngagementRate, getBestContentType,
  getBestPlatform, getBestPostingDay, getScheduledPostsThisWeek, getTopPosts, getTotalEngagement,
} from "../utils/recommendations";
import StatCard from "./StatCard";
import PageHeader from "./PageHeader";
import EmptyState from "./EmptyState";
import SocialPlatformIcon from "./SocialPlatformIcon";

export default function Dashboard({ posts, scheduledPosts, ideas, workspace, socialAccounts, onNavigate, onConnect, onCreatePost }: AppDataProps) {
  const topPosts = getTopPosts(posts);
  const recommendations = generateRecommendations(posts, scheduledPosts, ideas);
  const recentPosts = [...posts].sort((a, b) => a.datePosted.localeCompare(b.datePosted)).slice(-7);
  const maxEngagement = Math.max(...recentPosts.map(engagementTotal), 1);
  const engagementTrend = recentPosts.map((post) => ({
    label: post.datePosted.slice(5),
    value: Math.max((engagementTotal(post) / maxEngagement) * 100, 8),
  }));
  const platformTotals = [...new Set(posts.map((p) => p.platform))]
    .map((platform) => ({
      platform,
      rate: getAverageEngagementRate(posts.filter((p) => p.platform === platform)),
    }))
    .sort((a, b) => b.rate - a.rate);
  const connected = socialAccounts.filter((account) => account.connectionStatus === "connected");
  const availablePlatforms = orderedPlatforms(socialAccounts).filter((platform) => !accountForPlatform(socialAccounts, platform));
  const platformPostCount = (platform: SocialPlatform) => posts.filter((post) => post.platform === platform).length;
  const platformScheduledCount = (platform: SocialPlatform) => scheduledPosts.filter((post) => post.platform === platform).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace overview"
        title={`Good morning, ${workspace.brandName}`}
        description="A clear view of what is working, what is scheduled, and where to focus next."
        action={
          <button className="button-secondary" onClick={() => onNavigate?.("Calendar")}>
            <CalendarCheck size={15} />
            View calendar
          </button>
        }
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Connected accounts</h2>
            <p className="section-copy">Active channels appear first across analytics, calendar, and planning.</p>
          </div>
          <button className="button-secondary" onClick={onConnect}>
            <Link2 size={15} />
            Manage
          </button>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {connected.length ? connected.map((account) => (
            <article key={account.id} className="rounded-[16px] border border-emerald-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                    <SocialPlatformIcon platform={account.platform} size="sm" />
                    {platformLabel(account.platform)}
                  </p>
                  <h3 className="mt-2 truncate text-[17px] font-semibold text-slate-950">{account.accountName}</h3>
                  <p className="mt-1 truncate text-sm text-slate-500">{account.accountHandle}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 size={12} />
                  Connected
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-lg font-semibold text-slate-950">{platformPostCount(account.platform)}</p>
                  <p className="text-xs text-slate-500">tracked posts</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-lg font-semibold text-slate-950">{platformScheduledCount(account.platform)}</p>
                  <p className="text-xs text-slate-500">scheduled</p>
                </div>
              </div>
              <button
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => onCreatePost?.(account.platform)}
              >
                <PencilLine size={15} />
                Create new post
              </button>
            </article>
          )) : (
            <article className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-card lg:col-span-3">
              <h3 className="text-sm font-semibold text-slate-950">No connected channels yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Connect YouTube or Instagram to make channel-specific analytics and planning available.</p>
              <button className="button-primary mt-4" onClick={onConnect}>Connect social account</button>
            </article>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Available channels</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {availablePlatforms.map((platform) => (
            <button
              key={platform}
              className="rounded-[14px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              onClick={onConnect}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <SocialPlatformIcon platform={platform} size="md" />
                {platformLabel(platform)}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{platform === "TikTok" ? "Not ready yet" : "Connect or simulate"}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Stats grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total posts" value={String(posts.length)} helper="Published content" icon={Send} />
        <StatCard label="Total reach" value={formatNumber(posts.reduce((sum, p) => sum + p.reach, 0))} helper="Across tracked channels" icon={Eye} />
        <StatCard label="Total engagement" value={formatNumber(getTotalEngagement(posts))} helper="Across tracked posts" icon={Heart} />
        <StatCard label="Average rate" value={`${getAverageEngagementRate(posts).toFixed(1)}%`} helper="Engagement by reach" icon={TrendingUp} />
        <StatCard label="Best platform" value={getBestPlatform(posts)} helper="Highest average rate" icon={Radio} />
        <StatCard label="Best content type" value={getBestContentType(posts)} helper="Based on engagement" icon={Layers3} />
        <StatCard label="Best posting day" value={getBestPostingDay(posts)} helper="Strongest average result" icon={TrendingUp} />
        <StatCard label="Scheduled this week" value={String(getScheduledPostsThisWeek(scheduledPosts).length)} helper="Keep the queue moving" icon={CalendarCheck} />
      </div>

      {/* Charts row */}
      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">

        {/* Engagement trend */}
        <section className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="section-title">Engagement trend</h2>
              <p className="section-copy">Recent content performance across your active channels.</p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: "rgba(52,199,89,0.1)", color: "#1A7A40", letterSpacing: "0.04em" }}
            >
              Live
            </span>
          </div>

          <div className="mt-8 flex h-44 items-end gap-1.5 sm:gap-2">
            {engagementTrend.map((item) => (
              <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="relative flex flex-1 items-end rounded-lg" style={{ background: "#F5F5F7" }}>
                  <div
                    className="w-full rounded-lg transition-all duration-500"
                    style={{
                      height: `${item.value}%`,
                      background: "linear-gradient(180deg, #0071E3 0%, #005BB5 100%)",
                    }}
                  />
                </div>
                <span
                  className="text-center text-[9px] sm:text-[10px]"
                  style={{ color: "#86868B" }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Platform health */}
        <section className="card p-6">
          <h2 className="section-title">Platform health</h2>
          <p className="section-copy">Average engagement rate by channel.</p>
          <div className="mt-6 space-y-4">
            {platformTotals.map(({ platform, rate }, i) => (
              <div key={platform}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="inline-flex items-center gap-2 font-medium" style={{ color: "#1D1D1F" }}>
                    <SocialPlatformIcon platform={platform} size="sm" />
                    {platformLabel(platform)}
                  </span>
                  <span style={{ color: "#86868B" }}>{rate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F5F5F7" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(rate * 8, 100)}%`,
                      background: i === 0
                        ? "#0071E3"
                        : i === 1
                        ? "#34C759"
                        : "#86868B",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom row */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">

        {/* Top posts */}
        {topPosts.length ? (
          <section className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div>
                <h2 className="section-title">Top-performing posts</h2>
                <p className="section-copy">Your strongest content by total engagement.</p>
              </div>
              <button
                onClick={() => onNavigate?.("Analytics")}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 cursor-pointer"
                style={{ color: "#6E6E73" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F7"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <ArrowUpRight size={16} />
              </button>
            </div>

            {topPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors duration-150 cursor-default"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.02)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium" style={{ color: "#1D1D1F" }}>
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-[12px]" style={{ color: "#86868B" }}>
                    <span className="inline-flex items-center gap-1.5">
                      <SocialPlatformIcon platform={post.platform} size="sm" />
                      {platformLabel(post.platform)} · {post.contentType}
                    </span>
                  </p>
                </div>
                <p className="text-[15px] font-semibold" style={{ color: "#1D1D1F" }}>
                  {formatNumber(engagementTotal(post))}
                </p>
              </div>
            ))}
          </section>
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="No performance leaders yet"
            description="Track a published post to identify your strongest content."
          />
        )}

        {/* Smart recommendations */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: "#0071E3" }} />
            <h2 className="section-title">Smart recommendations</h2>
          </div>
          <p className="section-copy">Rule-based next steps from your current content data.</p>

          <div className="mt-5 space-y-3">
            {recommendations.map((item) => (
              <div
                key={item.id}
                className="rounded-[14px] p-4"
                style={{ background: "#F5F5F7", border: "1px solid rgba(0,0,0,0.05)" }}
              >
                <p className="text-[14px] font-medium" style={{ color: "#1D1D1F" }}>
                  {item.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "#86868B" }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
