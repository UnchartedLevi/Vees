drop index if exists public.posts_workspace_platform_external_key;

create unique index if not exists posts_workspace_platform_external_key
  on public.posts(workspace_id, platform, external_post_id);
