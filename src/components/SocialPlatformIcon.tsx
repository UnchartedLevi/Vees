import type { SocialPlatform } from "../types";
import { platformLabel } from "../utils/channels";

const iconPath: Partial<Record<SocialPlatform, string>> = {
  Instagram: "/social-icons/instagram.png",
  TikTok: "/social-icons/tiktok.png",
  "YouTube Shorts": "/social-icons/youtube.png",
  LinkedIn: "/social-icons/linkedin.png",
  X: "/social-icons/x.png",
  Facebook: "/social-icons/facebook.png",
};

type Props = {
  platform: SocialPlatform;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export default function SocialPlatformIcon({ platform, size = "md", className = "" }: Props) {
  const src = iconPath[platform];
  if (src) {
    return <img src={src} alt="" className={`${sizeClass[size]} shrink-0 object-contain ${className}`} />;
  }

  return (
    <span className={`${sizeClass[size]} flex shrink-0 items-center justify-center rounded bg-slate-100 text-[9px] font-bold text-slate-500 ${className}`}>
      {platformLabel(platform).slice(0, 2)}
    </span>
  );
}
