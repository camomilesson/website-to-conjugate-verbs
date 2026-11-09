-- Apply once after 202611060003_progress_preferences.sql, before deploying saved targeted modes.
-- Existing runs, history and user preferences are preserved. Public owner/generation
-- wrappers remain unchanged; this private helper accepts two additional selection labels.
begin;
create or replace function private.start_practice(p_configuration jsonb, p_dataset_version text,
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
    or coalesce(p_configuration #>> '{selections,verbSet}','') not in ('all','common','select','least-practiced','most-mistakes')
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
revoke all on function private.start_practice(jsonb,text,text,integer) from public, anon, authenticated;
commit;
