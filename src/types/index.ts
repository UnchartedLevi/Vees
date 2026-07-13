export type SocialPlatform = "Instagram" | "TikTok" | "LinkedIn" | "X" | "Facebook" | "YouTube Shorts";
export type ImportMode = "existing_posts" | "from_today" | "future_only";
export type ContentType = "Reel" | "Carousel" | "Image" | "Text" | "Story" | "Video";
export type ScheduleStatus = "Idea" | "Draft" | "In Review" | "Approved" | "Scheduled" | "Published" | "Failed";
export type IdeaStatus = "Backlog" | "Ready" | "Scheduled" | "Archived";
export type Priority = "High" | "Medium" | "Low";
export type CampaignStatus = "Planning" | "Active" | "Completed" | "Paused";
export type ReportType = "Weekly" | "Monthly" | "Campaign";

export type PlanTier = "free" | "pro" | "agency";

export interface Workspace {
  id: string;
  brandName: string;
  industry: string;
  targetAudience: string;
  mainPlatforms: SocialPlatform[];
  contentGoals: string[];
  toneOfVoice: string;
  planTier?: PlanTier;
}
export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: SocialPlatform;
  accountName: string;
  accountHandle: string;
  connectionStatus: string;
  importMode: ImportMode;
  lastSyncedAt?: string;
  scopes?: string[];
  providerMeta?: {
    thumbnailUrl?: string | null;
    uploadsPlaylistId?: string | null;
    accountType?: string | null;
  };
}
export interface AnalyticsSnapshot { id: string; workspaceId: string; socialAccountId: string; platform: SocialPlatform; snapshotDate: string; followers: number; totalPosts: number; totalReach: number; totalImpressions: number; totalEngagement: number; averageEngagementRate: number; }

export interface Post {
  id: string;
  socialAccountId?: string;
  title: string;
  platform: SocialPlatform;
  contentType: ContentType;
  datePosted: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  campaignId?: string;
  contentGoal: string;
  mediaUrl?: string;
  externalPostId?: string;
  externalUrl?: string;
  postingTime?: string;
  isShort?: boolean;
  retentionRate?: number;
}

export interface ScheduledPost {
  id: string;
  title: string;
  platform: SocialPlatform;
  contentType: ContentType;
  scheduledDate: string;
  status: ScheduleStatus;
  campaignId?: string;
  contentGoal: string;
  notes?: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  platform: SocialPlatform;
  format: ContentType;
  goal: string;
  priority: Priority;
  status: IdeaStatus;
  notes: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  platforms: SocialPlatform[];
  attachedPostIds: string[];
  status: CampaignStatus;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  dateRange: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  topPostId?: string;
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  averageEngagementRate: number;
  topPost: string;
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  type: "performance" | "planning" | "growth";
}
