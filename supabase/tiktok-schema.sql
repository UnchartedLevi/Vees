alter table public.social_accounts add column if not exists scopes text[];

create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  state_hash text not null unique,
  import_mode text default 'from_today',
  created_at timestamptz default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);

create unique index if not exists posts_workspace_platform_external_key
  on public.posts(workspace_id, platform, external_post_id)
  where external_post_id is not null;

create index if not exists oauth_states_workspace_id_idx on public.oauth_states(workspace_id);
create index if not exists oauth_states_expires_at_idx on public.oauth_states(expires_at);

alter table public.oauth_states enable row level security;

drop policy if exists "member oauth states" on public.oauth_states;
create policy "member oauth states"
  on public.oauth_states
  for all
  using(public.is_workspace_member(workspace_id) and user_id = auth.uid())
  with check(public.is_workspace_member(workspace_id) and user_id = auth.uid());

revoke select on public.social_accounts from anon, authenticated;
grant select(id,workspace_id,platform,account_name,account_handle,provider_account_id,connection_status,import_mode,token_expires_at,last_synced_at,created_at,updated_at,scopes) on public.social_accounts to authenticated;
revoke insert,update on public.social_accounts from anon, authenticated;
grant insert(workspace_id,platform,account_name,account_handle,provider_account_id,connection_status,import_mode,last_synced_at,scopes) on public.social_accounts to authenticated;
grant update(account_name,account_handle,provider_account_id,connection_status,import_mode,last_synced_at,scopes) on public.social_accounts to authenticated;

notify pgrst, 'reload schema';
