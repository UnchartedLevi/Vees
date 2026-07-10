-- Run this after supabase/schema.sql (and tiktok-schema.sql, if already applied) to add
-- YouTube support plus plan-tier gating for channel analytics vs. basic Shorts tracking.

alter table public.workspaces add column if not exists plan_tier text not null default 'free';
alter table public.workspaces add constraint workspaces_plan_tier_check check (plan_tier in ('free','pro','agency')) not valid;
alter table public.workspaces validate constraint workspaces_plan_tier_check;

alter table public.social_accounts add column if not exists scopes text[];
alter table public.social_accounts add column if not exists provider_meta jsonb;

alter table public.posts add column if not exists is_short boolean default false;
alter table public.posts add column if not exists duration_seconds integer;
alter table public.posts add column if not exists retention_rate numeric;

alter table public.analytics_snapshots add column if not exists average_view_percentage numeric;

revoke select on public.social_accounts from anon, authenticated;
grant select(id,workspace_id,platform,account_name,account_handle,provider_account_id,connection_status,import_mode,token_expires_at,last_synced_at,created_at,updated_at,scopes,provider_meta) on public.social_accounts to authenticated;
revoke insert,update on public.social_accounts from anon, authenticated;
grant insert(workspace_id,platform,account_name,account_handle,provider_account_id,connection_status,import_mode,last_synced_at,scopes,provider_meta) on public.social_accounts to authenticated;
grant update(account_name,account_handle,provider_account_id,connection_status,import_mode,last_synced_at,scopes,provider_meta) on public.social_accounts to authenticated;

notify pgrst, 'reload schema';
