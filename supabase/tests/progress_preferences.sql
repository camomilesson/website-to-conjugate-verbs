-- Disposable project, all four migrations applied. Run entire transaction.
begin;
insert into auth.users(id,email) values
 ('50000000-0000-4000-8000-000000000001','view-a@example.invalid'),
 ('50000000-0000-4000-8000-000000000002','view-b@example.invalid');
set local role authenticated;
set local request.jwt.claims='{"sub":"50000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$
declare gen uuid;
begin
 insert into public.progress_preferences(user_id,settings) values(auth.uid(),'{"schemaVersion":1,"mode":"strict","view":"advanced","custom":[],"sort":"attempts"}');
 -- Progress-only save does not require or create practice defaults.
 if (select count(*) from public.user_preferences)<>0 then raise exception 'Display save changed practice settings';end if;
 gen:=public.get_learning_generation();perform public.reset_learning_data(gen_random_uuid(),gen);
 if (select settings->>'sort' from public.progress_preferences)<>'attempts' then raise exception 'Learning reset erased display choices';end if;
 begin insert into public.progress_preferences(user_id,settings) values('50000000-0000-4000-8000-000000000002','{"schemaVersion":1,"mode":"all","view":"basic","custom":[],"sort":"name"}');raise exception 'Foreign insert accepted';exception when insufficient_privilege then null;end;
 begin update public.progress_preferences set settings='{"schemaVersion":1,"mode":"all","view":"select","custom":["unknown"],"sort":"name"}';raise exception 'Invalid column accepted';exception when check_violation then null;end;
 begin update public.progress_preferences set settings='{"schemaVersion":1,"mode":"all","view":"select","custom":[null],"sort":"name"}';raise exception 'Null column accepted';exception when check_violation then null;end;
end $$;
set local request.jwt.claims='{"sub":"50000000-0000-4000-8000-000000000002","role":"authenticated"}';
do $$ begin
 if (select count(*) from public.progress_preferences)<>0 then raise exception 'Cross-user read allowed';end if;
 update public.progress_preferences set settings='{}' where user_id='50000000-0000-4000-8000-000000000001';
 if found then raise exception 'Foreign update accepted';end if;
 insert into public.progress_preferences(user_id,settings) values(auth.uid(),'{"schemaVersion":1,"mode":"choice","view":"all","custom":[],"sort":"name-desc"}');
end $$;
set local role anon;
do $$ begin begin perform * from public.progress_preferences;raise exception 'Anonymous read allowed';exception when insufficient_privilege then null;end;end $$;
reset role;
delete from auth.users where id='50000000-0000-4000-8000-000000000001';
do $$ begin
 if exists(select 1 from public.progress_preferences where user_id='50000000-0000-4000-8000-000000000001') then raise exception 'Deletion missed display preferences';end if;
 if (select count(*) from public.progress_preferences where user_id='50000000-0000-4000-8000-000000000002')<>1 then raise exception 'Deletion touched another user';end if;
end $$;
rollback;
