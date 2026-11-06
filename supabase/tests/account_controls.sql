-- Disposable project only. Apply all three migrations, then run this entire file.
-- Fixtures and account deletion simulation are rolled back.
begin;
insert into auth.users(id,email) values
 ('40000000-0000-4000-8000-000000000001','controls-a@example.invalid'),
 ('40000000-0000-4000-8000-000000000002','controls-b@example.invalid');
insert into public.user_preferences(user_id,preferences) values
 ('40000000-0000-4000-8000-000000000001','{"schemaVersion":1,"preferences":{"length":"7"}}'),
 ('40000000-0000-4000-8000-000000000002','{"schemaVersion":1,"preferences":{"length":"9"}}');
set local role authenticated;
set local request.jwt.claims='{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$
declare generation uuid; fresh uuid; run uuid; late_run uuid; op uuid:=gen_random_uuid(); submission uuid:=gen_random_uuid();
 cfg jsonb:='{"resolved":{"mode":"typing","accentPolicy":"strict","verbIds":["hablar"],"categories":["indicative.present"],"persons":["yo"],"length":1},"selections":{"verbSet":"select","tenseSet":"select","personSet":"select"}}';
begin
 generation:=public.get_learning_generation();
 perform set_config('test.old_generation',generation::text,true);
 -- Legacy starts remain compatible until a reset occurs.
 run:=public.start_practice(cfg,'catalogue-1','practice-1',1);
 perform public.submit_practice_answer(run,submission,1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
 late_run:=public.start_practice(cfg,'catalogue-1','practice-1',1,generation);
 fresh:=public.reset_learning_data(op,generation);
 if fresh=generation then raise exception 'Generation did not advance';end if;
 if (select count(*) from public.accuracy_counts)<>0 or (select count(*) from public.practice_history)<>0 then raise exception 'Reset left learning data';end if;
 if (select preferences #>> '{preferences,length}' from public.user_preferences)<>'7' then raise exception 'Reset changed settings';end if;
 begin
  perform public.submit_practice_answer(run,submission,1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
  raise exception 'Stale retry restored data';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.submit_practice_answer(late_run,gen_random_uuid(),1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
  raise exception 'Pending answer restored data';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.start_practice(cfg,'catalogue-1','practice-1',1,generation);
  raise exception 'Stale start accepted';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.start_practice(cfg,'catalogue-1','practice-1',1);
  raise exception 'Generation-less start accepted after reset';
 exception when invalid_parameter_value then null;end;
 run:=public.start_practice(cfg,'catalogue-1','practice-1',1,fresh);
 perform public.submit_practice_answer(run,gen_random_uuid(),1,'hablar','indicative.present','yo',true,'hablo','["hablo"]');
 -- Lost reset reply: duplicate must acknowledge, not erase newly saved answers.
 if public.reset_learning_data(op,generation)<>fresh then raise exception 'Reset retry changed generation';end if;
 if (select sum(answered) from public.accuracy_counts)<>1 then raise exception 'Reset retry erased new work';end if;
 begin
  perform public.reset_learning_data(gen_random_uuid(),generation);
  raise exception 'Stale reset erased new work';
 exception when invalid_parameter_value then null;end;
 perform set_config('test.owner_run',run::text,true);
end $$;
set local request.jwt.claims='{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated"}';
do $$
declare generation uuid;cfg jsonb:='{"resolved":{"mode":"typing","accentPolicy":"strict","verbIds":["hablar"],"categories":["indicative.present"],"persons":["yo"],"length":1},"selections":{"verbSet":"select","tenseSet":"select","personSet":"select"}}';run uuid;
begin
 generation:=public.get_learning_generation();
 begin
  perform public.reset_learning_data(gen_random_uuid(),current_setting('test.old_generation')::uuid);
  raise exception 'Foreign generation allowed reset';
 exception when invalid_parameter_value then null;end;
 run:=public.start_practice(cfg,'catalogue-1','practice-1',1,generation);
 perform public.submit_practice_answer(run,gen_random_uuid(),1,'hablar','indicative.present','yo',false,'wrong','["hablo"]');
end $$;
reset role;
-- Models the FK cascades used by auth.admin.deleteUser; not a hosted GoTrue test.
delete from auth.users where id='40000000-0000-4000-8000-000000000001';
do $$
declare table_name text;remaining bigint;
begin
 foreach table_name in array array['user_preferences','accuracy_counts','practice_history','practice_runs','answer_receipts','learning_state'] loop
  execute format('select count(*) from public.%I where user_id=$1',table_name) into remaining using '40000000-0000-4000-8000-000000000001'::uuid;
  if remaining<>0 then raise exception 'Deletion missed %',table_name;end if;
 end loop;
 if (select count(*) from public.practice_history where user_id='40000000-0000-4000-8000-000000000002')<>1 then raise exception 'Other account history changed';end if;
 if (select count(*) from public.user_preferences where user_id='40000000-0000-4000-8000-000000000002')<>1 then raise exception 'Other account settings changed';end if;
end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$ begin
 begin perform public.get_learning_generation();raise exception 'Deleted JWT recreated state';exception when insufficient_privilege then null;end;
 begin perform private.lock_learning_state();raise exception 'Private helper exposed';exception when insufficient_privilege then null;end;
end $$;
set local role anon;
set local request.jwt.claims='{"role":"anon"}';
do $$ begin
 begin perform public.reset_learning_data(gen_random_uuid(),gen_random_uuid());raise exception 'Anonymous reset allowed';exception when insufficient_privilege then null;end;
end $$;
rollback;
