begin;
create table public.progress_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 settings jsonb not null,
 updated_at timestamptz not null default now(),
 constraint progress_settings_shape check (
  jsonb_typeof(settings)='object' and settings @> '{"schemaVersion":1}'::jsonb
  and coalesce(settings->>'mode','') in ('all','typing','choice','strict','relaxed')
  and coalesce(settings->>'view','') in ('basic','advanced','all','select')
  and coalesce(settings->>'sort','') in ('name','name-desc','accuracy','accuracy-asc','attempts','attempts-asc')
  and jsonb_typeof(settings->'custom')='array'
  and octet_length(settings::text)<=4096
 )
);
-- Validate custom IDs in a trigger: SQL CHECK constraints cannot contain subqueries.
create function public.validate_progress_preferences() returns trigger language plpgsql set search_path='' as $$
begin
 if jsonb_typeof(new.settings->'custom') is distinct from 'array' then raise exception 'Invalid Progress columns.' using errcode='23514';end if;
 if jsonb_array_length(new.settings->'custom')>16 or exists(select 1 from jsonb_array_elements_text(new.settings->'custom') id where id is null or id not in ('indicative.present', 'indicative.preterite', 'indicative.imperfect', 'indicative.future', 'indicative.conditional', 'indicative.present-perfect', 'indicative.pluperfect', 'indicative.future-perfect', 'indicative.conditional-perfect', 'subjunctive.present', 'subjunctive.imperfect', 'subjunctive.present-perfect', 'subjunctive.pluperfect', 'imperative.affirmative', 'imperative.negative', 'progressive.present')) then
  raise exception 'Invalid Progress columns.' using errcode='23514';
 end if;
 return new;
end $$;
revoke all on function public.validate_progress_preferences() from public,anon,authenticated;
create trigger validate_progress_preferences before insert or update on public.progress_preferences for each row execute function public.validate_progress_preferences();
create trigger touch_progress_preferences before update on public.progress_preferences for each row execute function public.touch_user_preferences();
alter table public.progress_preferences enable row level security;
revoke all on public.progress_preferences from public,anon,authenticated;
grant select,insert,update on public.progress_preferences to authenticated;
create policy "Read own Progress preferences" on public.progress_preferences for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own Progress preferences" on public.progress_preferences for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own Progress preferences" on public.progress_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
commit;
