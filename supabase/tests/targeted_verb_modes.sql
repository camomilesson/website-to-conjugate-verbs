-- All five migrations applied; disposable users only, rolled back afterwards.
begin;
insert into auth.users(id,email) values ('60000000-0000-4000-8000-000000000001','targeted@example.invalid');
set local role authenticated;
set local request.jwt.claims='{"sub":"60000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$
declare selection text; cfg jsonb; run_id uuid; generation uuid; reply jsonb;
begin
  generation := public.get_learning_generation();
  foreach selection in array array['least-practiced','most-mistakes'] loop
    cfg := jsonb_build_object('resolved',
      '{"mode":"typing","accentPolicy":"strict","length":1,"verbIds":["hablar"],"categories":["indicative.present"],"persons":["yo"]}'::jsonb,
      'selections',jsonb_build_object('verbSet',selection,'tenseSet','basic','personSet','all'));
    run_id := public.start_practice(cfg,'catalogue-1','practice-1',1,generation);
    reply := public.submit_practice_answer(run_id,gen_random_uuid(),1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
    if reply ->> 'complete' <> 'true' then raise exception 'Targeted run failed to complete'; end if;
    if (select configuration #>> '{selections,verbSet}' from public.practice_history where id=run_id) <> selection then
      raise exception 'History lost targeted selection';
    end if;
  end loop;
  cfg := jsonb_set(cfg,'{selections,verbSet}','"invalid-mode"');
  begin
    perform public.start_practice(cfg,'catalogue-1','practice-1',1,generation);
    raise exception 'Invalid verb selection accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;
reset role;
do $$ begin
  if has_function_privilege('authenticated','private.start_practice(jsonb,text,text,integer)','EXECUTE') then
    raise exception 'Private start helper exposed';
  end if;
end $$;
rollback;
