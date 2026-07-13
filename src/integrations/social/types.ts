import type { SocialAccount, SocialPlatform } from "../../types";
export type SyncResult = { syncedPosts?: number };
export interface SocialConnector { platform: SocialPlatform|string; connect(...args: any[]):Promise<SocialAccount>; disconnect(workspaceId:string,accountId:string):Promise<void>; syncAccount(account:SocialAccount):Promise<SyncResult|void>; syncPosts(account:SocialAccount):Promise<SyncResult|void>; syncAnalytics(account:SocialAccount):Promise<SyncResult|void>; }
