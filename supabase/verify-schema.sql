select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'workspaces',
    'workspace_members',
    'social_accounts',
    'posts',
    'content_ideas',
    'campaigns',
    'reports',
    'chat_messages',
    'analytics_snapshots',
    'demo_seed_runs'
  )
order by table_name;

notify pgrst, 'reload schema';
