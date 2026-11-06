-- Step 12. Apply after the preferences and durable-practice migrations.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  generation uuid not null default gen_random_uuid(),
  last_reset_id uuid,
  legacy_allowed boolean not null default true
);
alter table public.learning_state enable row level security;
revoke all on public.learning_state from public, anon, authenticated;
insert into public.learning_state(user_id) select id from auth.users;
alter table public.practice_runs add column generation uuid;
update public.practice_runs r set generation=s.generation from public.learning_state s where s.user_id=r.user_id;
alter table public.practice_runs alter column generation set not null;

-- Retire the old write paths. Only the owner-checked wrappers below are exposed.
alter function public.start_practice(jsonb,text,text,integer) set schema private;
alter function public.submit_practice_answer(uuid,uuid,integer,text,text,text,boolean,text,jsonb) set schema private;
revoke all on function private.start_practice(jsonb,text,text,integer) from public, anon, authenticated;
revoke all on function private.submit_practice_answer(uuid,uuid,integer,text,text,text,boolean,text,jsonb) from public, anon, authenticated;
-- Existing start implementation inserts runs; a server-only default supplies
-- the generation while the caller's learning-state lock is held.
create function private.current_learning_generation() returns uuid
language sql stable security definer set search_path='' as $$
 select generation from public.learning_state where user_id=auth.uid()
$$;
revoke all on function private.current_learning_generation() from public, anon, authenticated;
alter table public.practice_runs alter column generation set default private.current_learning_generation();

create function private.lock_learning_state() returns public.learning_state
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); state public.learning_state%rowtype;
begin
  if caller is null or not exists(select 1 from auth.users where id=caller) then
    raise exception 'Account is unavailable. Sign in again.' using errcode='42501';
  end if;
  insert into public.learning_state(user_id) values(caller) on conflict(user_id) do nothing;
  select * into state from public.learning_state where user_id=caller for update;
  return state;
end $$;
revoke all on function private.lock_learning_state() from public, anon, authenticated;

create function public.get_learning_generation() returns uuid
language plpgsql security definer set search_path='' as $$
declare state public.learning_state%rowtype;
begin state:=private.lock_learning_state();return state.generation;end $$;

-- Existing deployed clients can start until their first reset. After reset,
-- generation-less pending starts fail closed instead of recreating cleared data.
create function public.start_practice(p_configuration jsonb,p_dataset_version text,
  p_defaults_version text,p_expected integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare state public.learning_state%rowtype;
begin
  state:=private.lock_learning_state();
  if not state.legacy_allowed then raise exception 'Refresh the app before starting a new practice.' using errcode='22023';end if;
  return private.start_practice(p_configuration,p_dataset_version,p_defaults_version,p_expected);
end $$;

-- New starts must include the generation acknowledged when setup was loaded.
create function public.start_practice(p_configuration jsonb,p_dataset_version text,
  p_defaults_version text,p_expected integer,p_generation uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare state public.learning_state%rowtype;
begin
  state:=private.lock_learning_state();
  if p_generation is distinct from state.generation then
    raise exception 'Learning data changed. Reload practice setup.' using errcode='22023';
  end if;
  return private.start_practice(p_configuration,p_dataset_version,p_defaults_version,p_expected);
end $$;

-- Keep this signature for in-flight step 11 clients; stale runs still reject.
create function public.submit_practice_answer(p_run_id uuid,p_submission_id uuid,
  p_ordinal integer,p_verb_id text,p_category_id text,p_person_id text,
  p_correct boolean,p_text text,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare state public.learning_state%rowtype; run_generation uuid;
begin
  state:=private.lock_learning_state();
  select generation into run_generation from public.practice_runs where id=p_run_id and user_id=auth.uid();
  if run_generation is distinct from state.generation then
    raise exception 'Practice is no longer active. Start a new practice.' using errcode='22023';
  end if;
  return private.submit_practice_answer(p_run_id,p_submission_id,p_ordinal,p_verb_id,p_category_id,p_person_id,p_correct,p_text,p_answers);
end $$;

create function public.reset_learning_data(p_operation_id uuid,p_generation uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare state public.learning_state%rowtype; next_generation uuid:=gen_random_uuid();
begin
  state:=private.lock_learning_state();
  if p_operation_id is null then raise exception 'Missing reset request ID.' using errcode='22023';end if;
  if state.last_reset_id=p_operation_id then return state.generation;end if;
  if p_generation is distinct from state.generation then
    raise exception 'Learning data already changed. Review and confirm reset again.' using errcode='22023';
  end if;
  delete from public.practice_runs where user_id=auth.uid(); -- cascades receipts
  delete from public.practice_history where user_id=auth.uid();
  delete from public.accuracy_counts where user_id=auth.uid();
  update public.learning_state set generation=next_generation,last_reset_id=p_operation_id,legacy_allowed=false where user_id=auth.uid();
  return next_generation;
end $$;
revoke all on function public.get_learning_generation() from public,anon,authenticated;
revoke all on function public.start_practice(jsonb,text,text,integer) from public,anon,authenticated;
revoke all on function public.start_practice(jsonb,text,text,integer,uuid) from public,anon,authenticated;
revoke all on function public.submit_practice_answer(uuid,uuid,integer,text,text,text,boolean,text,jsonb) from public,anon,authenticated;
revoke all on function public.reset_learning_data(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_learning_generation() to authenticated;
grant execute on function public.start_practice(jsonb,text,text,integer) to authenticated;
grant execute on function public.start_practice(jsonb,text,text,integer,uuid) to authenticated;
grant execute on function public.submit_practice_answer(uuid,uuid,integer,text,text,text,boolean,text,jsonb) to authenticated;
grant execute on function public.reset_learning_data(uuid,uuid) to authenticated;
commit;
