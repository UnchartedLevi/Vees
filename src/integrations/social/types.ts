import type { SocialAccount, SocialPlatform } from "../../types";
export interface SocialConnector { platform: SocialPlatform|string; connect(...args: any[]):Promise<SocialAccount>; disconnect(workspaceId:string,accountId:string):Promise<void>; syncAccount(account:SocialAccount):Promise<void>; syncPosts(account:SocialAccount):Promise<void>; syncAnalytics(account:SocialAccount):Promise<void>; }
