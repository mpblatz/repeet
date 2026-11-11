-- Run once in the Supabase SQL editor.
-- Speeds up the app's single "problems + embedded attempts" load and per-user filters.

create index if not exists problems_user_id_status_idx on public.problems (user_id, status);
create index if not exists attempts_problem_id_attempted_at_idx on public.attempts (problem_id, attempted_at);

-- If your RLS policies call auth.uid() directly, e.g.
--   using (user_id = auth.uid())
-- rewrite them as
--   using (user_id = (select auth.uid()))
-- so Postgres evaluates it once per query instead of once per row.
-- Check current policies with:
--   select tablename, policyname, qual, with_check from pg_policies where schemaname = 'public';
