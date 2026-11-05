begin;
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null,
  updated_at timestamptz not null default now(),
  constraint preferences_shape check (
    jsonb_typeof(preferences) = 'object'
    and preferences @> '{"schemaVersion":1}'::jsonb
    and coalesce(jsonb_typeof(preferences -> 'preferences'), '') = 'object'
    and octet_length(preferences::text) <= 32768
  )
);
alter table public.user_preferences enable row level security;
revoke all on public.user_preferences from anon, authenticated;
grant select, insert, update on public.user_preferences to authenticated;
create policy "Read own preferences" on public.user_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Insert own preferences" on public.user_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Update own preferences" on public.user_preferences for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create function public.touch_user_preferences() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger touch_user_preferences before update on public.user_preferences
  for each row execute function public.touch_user_preferences();
commit;
