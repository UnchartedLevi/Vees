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

create index if not exists oauth_states_workspace_id_idx on public.oauth_states(workspace_id);
create index if not exists oauth_states_expires_at_idx on public.oauth_states(expires_at);

alter table public.oauth_states enable row level security;

drop policy if exists "member oauth states" on public.oauth_states;
create policy "member oauth states"
  on public.oauth_states
  for all
  using(public.is_workspace_member(workspace_id) and user_id = auth.uid())
  with check(public.is_workspace_member(workspace_id) and user_id = auth.uid());

notify pgrst, 'reload schema';
