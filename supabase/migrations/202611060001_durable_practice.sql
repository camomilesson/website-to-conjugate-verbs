-- Step 9: run once after 202611050001_user_preferences.sql.
begin;
create table public.practice_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  configuration jsonb not null,
  dataset_version text not null,
  defaults_version text not null,
  mode text not null check (mode in ('typing','choice')),
  accent_policy text not null check (accent_policy in ('strict','relaxed','na')),
  expected integer not null check (expected between 1 and 9400),
  answered integer not null default 0,
  correct integer not null default 0,
  example_mistake jsonb,
  check (correct between 0 and answered and answered between 0 and expected),
  check ((mode = 'choice' and accent_policy = 'na') or
         (mode = 'typing' and accent_policy in ('strict','relaxed')))
);
-- No queue or answer text is stored here. Expired run metadata cannot resume a test.
create table public.answer_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null,
  run_id uuid not null references public.practice_runs(id) on delete cascade,
  ordinal integer not null,
  question_id text not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, submission_id),
  unique (run_id, ordinal),
  unique (run_id, question_id)
);
create table public.accuracy_counts (
  user_id uuid not null references auth.users(id) on delete cascade,
  verb_id text not null,
  category_id text not null,
  mode text not null check (mode in ('typing','choice')),
  accent_policy text not null check (accent_policy in ('strict','relaxed','na')),
  correct bigint not null check (correct >= 0),
  answered bigint not null check (answered > 0 and correct <= answered),
  primary key (user_id, verb_id, category_id, mode, accent_policy),
  check ((mode = 'choice' and accent_policy = 'na') or
         (mode = 'typing' and accent_policy in ('strict','relaxed')))
);
create table public.practice_history (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  configuration jsonb not null,
  dataset_version text not null,
  defaults_version text not null,
  mode text not null,
  accent_policy text not null,
  correct integer not null,
  answered integer not null check (answered > 0 and correct between 0 and answered),
  example_mistake jsonb
);
create index practice_history_owner_date on public.practice_history(user_id, completed_at desc, id);
create index practice_runs_owner_expiry on public.practice_runs(user_id, expires_at);
alter table public.practice_runs enable row level security;
alter table public.answer_receipts enable row level security;
alter table public.accuracy_counts enable row level security;
alter table public.practice_history enable row level security;
revoke all on public.practice_runs, public.answer_receipts, public.accuracy_counts, public.practice_history from public, anon, authenticated;
-- Counts/history are read-only via RLS. Writes and receipt reads are RPC-only.
grant select on public.accuracy_counts, public.practice_history to authenticated;
create policy "Read own counts" on public.accuracy_counts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own history" on public.practice_history for select to authenticated using ((select auth.uid()) = user_id);

create function public.start_practice(p_configuration jsonb, p_dataset_version text,
  p_defaults_version text, p_expected integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); run_id uuid; cfg jsonb := p_configuration -> 'resolved';
begin
  if caller is null then raise exception 'Sign in to track practice.' using errcode = '42501'; end if;
  if p_configuration is null or octet_length(p_configuration::text) > 32768
    or jsonb_typeof(cfg) is distinct from 'object'
    or coalesce(cfg ->> 'mode','') not in ('typing','choice')
    or coalesce(cfg ->> 'accentPolicy','') not in ('strict','relaxed')
    or coalesce(p_dataset_version,'') <> 'catalogue-1'
    or coalesce(p_defaults_version,'') <> 'practice-1'
    or p_expected is null or p_expected not between 1 and 9400
    or jsonb_typeof(p_configuration -> 'selections') is distinct from 'object'
    or coalesce(p_configuration #>> '{selections,verbSet}','') not in ('all','common','select')
    or coalesce(p_configuration #>> '{selections,tenseSet}','') not in ('all','basic','advanced','select')
    or coalesce(p_configuration #>> '{selections,personSet}','') not in ('all','select')
    or jsonb_typeof(cfg -> 'length') is distinct from 'number'
    or jsonb_typeof(cfg -> 'verbIds') is distinct from 'array'
    or jsonb_typeof(cfg -> 'categories') is distinct from 'array'
    or jsonb_typeof(cfg -> 'persons') is distinct from 'array'
  then raise exception 'Invalid practice configuration.' using errcode = '22023'; end if;
  if jsonb_array_length(cfg -> 'verbIds') not between 1 and 100
    or jsonb_array_length(cfg -> 'categories') not between 1 and 16
    or jsonb_array_length(cfg -> 'persons') not between 1 and 6
  then raise exception 'Invalid practice selections.' using errcode = '22023'; end if;
  if (cfg ->> 'length')::numeric < p_expected or (cfg ->> 'length')::numeric <> trunc((cfg ->> 'length')::numeric)
  then raise exception 'Invalid requested length.' using errcode = '22023'; end if;
  -- Opportunistic cleanup: retries expire at 24h; metadata/receipts kept at least 7 days.
  -- Unknown/expired run IDs always reject, so removal cannot permit double counting.
  delete from public.practice_runs where user_id = caller and expires_at < now() - interval '6 days';
  insert into public.practice_runs(user_id, configuration, dataset_version, defaults_version,
    mode, accent_policy, expected)
  values (caller, jsonb_build_object('resolved',cfg,'selections',p_configuration -> 'selections','defaults',
    '{"mode":"typing","length":20,"accentPolicy":"strict","verbSet":"all","tenseSet":"basic","personSet":"all"}'::jsonb), p_dataset_version, p_defaults_version, cfg ->> 'mode',
    case when cfg ->> 'mode' = 'choice' then 'na' else cfg ->> 'accentPolicy' end, p_expected)
  returning id into run_id;
  return run_id;
end $$;

create function public.submit_practice_answer(p_run_id uuid, p_submission_id uuid,
  p_ordinal integer, p_verb_id text, p_category_id text, p_person_id text,
  p_correct boolean, p_text text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); run public.practice_runs%rowtype;
  receipt public.answer_receipts%rowtype; payload_hash text; question_key text;
  mistake jsonb; person_key text;
begin
  if caller is null then raise exception 'Sign in to save answers.' using errcode = '42501'; end if;
  select * into run from public.practice_runs where id = p_run_id and user_id = caller for update;
  if not found then raise exception 'Practice is unavailable. Start a new practice.' using errcode = '22023'; end if;
  if run.expires_at <= now() then raise exception 'Practice expired after 24 hours. Start a new practice.' using errcode = '22023'; end if;
  if p_submission_id is null or p_ordinal is null or p_correct is null
    or p_verb_id is null or p_verb_id !~ '^[a-z]{2,32}$'
    or p_category_id is null or p_category_id not in ('indicative.present', 'indicative.preterite', 'indicative.imperfect', 'indicative.future', 'indicative.conditional', 'indicative.present-perfect', 'indicative.pluperfect', 'indicative.future-perfect', 'indicative.conditional-perfect', 'subjunctive.present', 'subjunctive.imperfect', 'subjunctive.present-perfect', 'subjunctive.pluperfect', 'imperative.affirmative', 'imperative.negative', 'progressive.present')
    or p_person_id is null or p_person_id not in ('yo','tu','el','nosotros','vosotros','ellos','usted','ustedes')
    or p_text is null or length(btrim(p_text)) = 0 or length(p_text) > 2000
    or jsonb_typeof(p_answers) is distinct from 'array'
  then raise exception 'Invalid answer submission.' using errcode = '22023'; end if;
  if jsonb_array_length(p_answers) not between 1 and 6
    or exists(select 1 from jsonb_array_elements(p_answers) a where jsonb_typeof(a) <> 'string' or length(a #>> '{}') not between 1 and 256)
  then raise exception 'Invalid accepted answers.' using errcode = '22023'; end if;
  person_key := case p_person_id when 'usted' then 'el' when 'ustedes' then 'ellos' else p_person_id end;
  if not (run.configuration -> 'resolved' -> 'verbIds' ? p_verb_id)
    or not (run.configuration -> 'resolved' -> 'categories' ? p_category_id)
    or not (run.configuration -> 'resolved' -> 'persons' ? person_key)
    or (p_category_id like 'imperative.%' and p_person_id not in ('tu','usted','nosotros','vosotros','ustedes'))
    or (p_category_id not like 'imperative.%' and p_person_id in ('usted','ustedes'))
  then raise exception 'Answer is outside the selected practice.' using errcode = '22023'; end if;
  question_key := p_verb_id || ':' || p_category_id || ':' || p_person_id;
  payload_hash := md5(jsonb_build_array(p_run_id,p_ordinal,question_key,p_correct,p_text,p_answers)::text);
  select * into receipt from public.answer_receipts where user_id = caller and submission_id = p_submission_id;
  if found then
    if receipt.run_id <> p_run_id or receipt.fingerprint <> payload_hash then
      raise exception 'Submission ID was reused with a different answer.' using errcode = '22023';
    end if;
    return jsonb_build_object('acknowledged',true,'duplicate',true,'complete',run.answered = run.expected);
  end if;
  if p_ordinal <> run.answered + 1 or run.answered >= run.expected then
    raise exception 'Answer sequence is invalid. Retry the original submission.' using errcode = '22023';
  end if;
  insert into public.answer_receipts(user_id,submission_id,run_id,ordinal,question_id,fingerprint)
    values(caller,p_submission_id,p_run_id,p_ordinal,question_key,payload_hash);
  insert into public.accuracy_counts(user_id,verb_id,category_id,mode,accent_policy,correct,answered)
    values(caller,p_verb_id,p_category_id,run.mode,run.accent_policy,case when p_correct then 1 else 0 end,1)
    on conflict (user_id,verb_id,category_id,mode,accent_policy) do update
    set correct = public.accuracy_counts.correct + excluded.correct,
        answered = public.accuracy_counts.answered + 1;
  mistake := run.example_mistake;
  if mistake is null and not p_correct then
    mistake := jsonb_build_object('verbId',p_verb_id,'category',p_category_id,'person',p_person_id,'text',p_text,'answers',p_answers);
  end if;
  update public.practice_runs set answered = answered + 1,
    correct = correct + case when p_correct then 1 else 0 end, example_mistake = mistake where id = run.id;
  if p_ordinal = run.expected then
    insert into public.practice_history(id,user_id,configuration,dataset_version,defaults_version,
      mode,accent_policy,correct,answered,example_mistake)
    values(run.id,caller,run.configuration,run.dataset_version,run.defaults_version,run.mode,
      run.accent_policy,run.correct + case when p_correct then 1 else 0 end,p_ordinal,mistake);
  end if;
  return jsonb_build_object('acknowledged',true,'duplicate',false,'complete',p_ordinal = run.expected);
end $$;
revoke all on function public.start_practice(jsonb,text,text,integer) from public, anon, authenticated;
revoke all on function public.submit_practice_answer(uuid,uuid,integer,text,text,text,boolean,text,jsonb) from public, anon, authenticated;
grant execute on function public.start_practice(jsonb,text,text,integer) to authenticated;
grant execute on function public.submit_practice_answer(uuid,uuid,integer,text,text,text,boolean,text,jsonb) to authenticated;
commit;
