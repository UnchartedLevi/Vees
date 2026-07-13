alter table public.posts add column if not exists external_url text;

notify pgrst, 'reload schema';
