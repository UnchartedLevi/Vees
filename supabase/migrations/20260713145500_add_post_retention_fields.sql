alter table public.posts add column if not exists duration_seconds integer;
alter table public.posts add column if not exists retention_rate numeric;

notify pgrst, 'reload schema';
