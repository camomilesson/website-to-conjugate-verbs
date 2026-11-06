-- Disposable project only. Apply both migrations, then run this entire script.
-- Tests are transactional; no fixtures, aggregates or history survive rollback.
begin;
insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','learning-a@example.invalid'),
 ('10000000-0000-4000-8000-000000000002','learning-b@example.invalid');
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$
declare r uuid; abandoned uuid; s uuid := gen_random_uuid(); f uuid := gen_random_uuid(); ack jsonb;
  cfg jsonb := '{"resolved":{"mode":"typing","accentPolicy":"strict","verbIds":["hablar","comer"],"categories":["indicative.present"],"persons":["yo"],"length":2},"selections":{"verbSet":"select","tenseSet":"select","personSet":"select"},"defaults":{"mode":"typing","length":20,"accentPolicy":"strict","verbSet":"all","tenseSet":"basic","personSet":"all"}}';
begin
  r := public.start_practice(cfg,'catalogue-1','practice-1',2);
  perform set_config('test.learning_run',r::text,true);
  ack := public.submit_practice_answer(r,s,1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
  if ack ->> 'complete' <> 'false' then raise exception 'Premature completion'; end if;
  ack := public.submit_practice_answer(r,s,1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
  if ack ->> 'duplicate' <> 'true' then raise exception 'Retry not deduplicated'; end if;
  begin
    perform public.submit_practice_answer(r,s,1,'hablar','indicative.present','yo',false,'wrong','["hablo"]');
    raise exception 'Changed retry accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.submit_practice_answer(r,gen_random_uuid(),1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
    raise exception 'Repeated ordinal accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.submit_practice_answer(r,gen_random_uuid(),2,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
    raise exception 'Repeated question accepted';
  exception when unique_violation then null; end;
  ack := public.submit_practice_answer(r,f,2,'comer','indicative.present','yo',false,'wrong','["como"]');
  if ack ->> 'complete' <> 'true' then raise exception 'Final answer not complete'; end if;
  perform public.submit_practice_answer(r,f,2,'comer','indicative.present','yo',false,'wrong','["como"]');
  if (select count(*) from public.practice_history) <> 1 then raise exception 'History duplicate/missing'; end if;
  if (select correct from public.practice_history where id=r) <> 1 or
     (select answered from public.practice_history where id=r) <> 2 or
     (select example_mistake ->> 'text' from public.practice_history where id=r) <> 'wrong'
    then raise exception 'Incorrect final history'; end if;
  if (select sum(answered) from public.accuracy_counts) <> 2 or
     (select sum(correct) from public.accuracy_counts) <> 1 then raise exception 'Incorrect counts after retries'; end if;
  abandoned := public.start_practice(cfg,'catalogue-1','practice-1',2);
  perform public.submit_practice_answer(abandoned,gen_random_uuid(),1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
  if (select count(*) from public.practice_history) <> 1 then raise exception 'Abandoned test entered history'; end if;
  cfg := jsonb_set(cfg,'{resolved,accentPolicy}','"relaxed"');
  r := public.start_practice(cfg,'catalogue-1','practice-1',1);
  perform public.submit_practice_answer(r,gen_random_uuid(),1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
  cfg := jsonb_set(cfg,'{resolved,mode}','"choice"');
  r := public.start_practice(cfg,'catalogue-1','practice-1',1);
  perform public.submit_practice_answer(r,gen_random_uuid(),1,'hablar','indicative.present','yo',false,'hablas','["hablo"]');
  if (select count(distinct accent_policy) from public.accuracy_counts) <> 3 then raise exception 'Mode/policy buckets merged'; end if;
  if (select sum(answered) from public.accuracy_counts) <> 5 or
     (select sum(correct) from public.accuracy_counts) <> 3 then raise exception 'Known sequence counts failed'; end if;
  begin
    update public.accuracy_counts set correct=answered;
    raise exception 'Direct counter mutation allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.answer_receipts;
    raise exception 'Receipt exposure allowed';
  exception when insufficient_privilege then null; end;
end $$;
-- Another identity sees no data and cannot submit to an existing run.
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
do $$ begin
  if (select count(*) from public.accuracy_counts) <> 0 or
     (select count(*) from public.practice_history) <> 0 then raise exception 'Cross-user read allowed'; end if;
  begin
    perform public.submit_practice_answer(current_setting('test.learning_run')::uuid,gen_random_uuid(),1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
    raise exception 'Cross-user RPC allowed';
  exception when invalid_parameter_value then null; end;
end $$;
reset role;
-- Force a history failure to prove receipt/counter/final insert atomicity.
create function public.learning_test_fail_history() returns trigger language plpgsql as $$
begin raise exception 'Injected final history failure' using errcode='23514'; end $$;
create trigger learning_test_fail_history before insert on public.practice_history for each row execute function public.learning_test_fail_history();
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$
declare r uuid; sid uuid := gen_random_uuid(); before_count bigint;
 cfg jsonb := '{"resolved":{"mode":"typing","accentPolicy":"strict","verbIds":["hablar"],"categories":["indicative.present"],"persons":["yo"],"length":1},"selections":{"verbSet":"select","tenseSet":"select","personSet":"select"}}';
begin
  r := public.start_practice(cfg,'catalogue-1','practice-1',1);
  perform set_config('test.atomic_run',r::text,true);
  perform set_config('test.atomic_submission',sid::text,true);
  select sum(answered) into before_count from public.accuracy_counts;
  begin
    perform public.submit_practice_answer(r,sid,1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
    raise exception 'Injected failure not raised';
  exception when check_violation then null; end;
  if (select sum(answered) from public.accuracy_counts) <> before_count then raise exception 'Partial final write survived'; end if;
end $$;
reset role;
drop trigger learning_test_fail_history on public.practice_history;
drop function public.learning_test_fail_history();
set local role authenticated;
do $$ begin
  -- Same ID succeeds after the injected failure, proving no orphan receipt survived.
  perform public.submit_practice_answer(current_setting('test.atomic_run')::uuid,current_setting('test.atomic_submission')::uuid,1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
end $$;
reset role;
update public.practice_runs set expires_at=now() - interval '1 second' where id=current_setting('test.atomic_run')::uuid;
set local role authenticated;
do $$ begin
  begin
    perform public.submit_practice_answer(current_setting('test.atomic_run')::uuid,current_setting('test.atomic_submission')::uuid,1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
    raise exception 'Expired retry accepted';
  exception when invalid_parameter_value then null; end;
end $$;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  begin
    perform * from public.accuracy_counts;
    raise exception 'Anonymous counts allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.start_practice('{}','catalogue-1','practice-1',1);
    raise exception 'Anonymous tracking allowed';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
