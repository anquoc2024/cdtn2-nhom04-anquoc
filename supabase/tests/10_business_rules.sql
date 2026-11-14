\set QUIET on
\pset tuples_only on
\pset format unaligned
create schema tst; grant usage on schema tst to anon, authenticated;
create function tst.try(q text) returns text language plpgsql as $$
declare r text; begin execute q into r; return coalesce(left(r, 300), 'ok'); exception when others then return 'ERR: ' || sqlerrm; end $$;
grant execute on function tst.try(text) to anon, authenticated;
create table tst.ids (k text primary key, v text); grant select on tst.ids to anon, authenticated;
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a', 'admin@test.vn', '{"full_name":"Chủ tiệm","phone":"0900000001"}'),
 ('00000000-0000-0000-0000-00000000000b', 'an@test.vn',    '{"full_name":"Nguyễn An","phone":"0900000002"}'),
 ('00000000-0000-0000-0000-00000000000c', 'binh@test.vn',  '{"full_name":"Trần Bình","phone":"0900000003"}');
update profiles set role = 'admin' where email = 'admin@test.vn';
select 'profiles', count(*) from profiles;
-- ngày thử: ngày mai và ngày kia theo giờ VN
insert into tst.ids values ('d1', ((now() at time zone 'Asia/Ho_Chi_Minh')::date + 1)::text),
                           ('d2', ((now() at time zone 'Asia/Ho_Chi_Minh')::date + 2)::text),
                           ('d40', ((now() at time zone 'Asia/Ho_Chi_Minh')::date + 40)::text);
create function tst.at(d text, t text) returns text language sql as $$ select ((select v from tst.ids where k=d)::date + t::time) at time zone 'Asia/Ho_Chi_Minh' $$;
grant execute on function tst.at(text,text) to anon, authenticated;

\echo '--- 1. khách vãng lai'
set role anon;
select '1a services visible', count(*) from services;
select '1b bookings visible', count(*) from bookings;
select '1c free slots d1 (2 svc)', tst.try($q$ select jsonb_array_length(get_free_slots((select v from tst.ids where k='d1')::date, array[1,8]) -> 'slots')::text $q$);
select '1d create as anon', tst.try($q$ select create_booking(array[1], null, tst.at('d1','10:00')::timestamptz)::text $q$);
select '1e slots 40 days ahead', tst.try($q$ select get_free_slots((select v from tst.ids where k='d40')::date, array[1])::text $q$);
reset role;

\echo '--- 2. người dùng An đặt lịch'
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select '2a An books d1 10:00', tst.try($q$ select create_booking(array[1,8], 3, tst.at('d1','10:00')::timestamptz, 'màu hồng')::text $q$);
select '2b An books d1 10:15 (off-step)', tst.try($q$ select create_booking(array[1], null, tst.at('d1','10:15')::timestamptz)::text $q$);
select '2c An books d1 20:30 (ends after close)', tst.try($q$ select create_booking(array[4], null, tst.at('d1','20:30')::timestamptz)::text $q$);
select '2d An books d2 09:00', tst.try($q$ select (create_booking(array[2], null, tst.at('d2','09:00')::timestamptz))->>'code' $q$);
select '2e An 3rd booking', tst.try($q$ select create_booking(array[1], null, tst.at('d2','15:00')::timestamptz)::text $q$);
select '2f An sees own bookings', count(*) from bookings;
select '2g An direct update', tst.try($q$ update bookings set status='completed' returning id::text $q$);
select '2h An makes self admin', tst.try($q$ update profiles set role='admin' where id=auth.uid() returning role::text $q$);
select '2i An edits own name', tst.try($q$ update profiles set full_name='Nguyễn Văn An' where id=auth.uid() returning full_name $q$);
select '2j An calls admin fn', tst.try($q$ select change_booking_status(1,'confirmed')::text $q$);
select '2k An reads blocked_slots', count(*) from blocked_slots;
select '2l An stats', tst.try($q$ select get_stats(current_date, current_date)::text $q$);
reset role;

\echo '--- 3. sức chứa (capacity 3)'
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select '3a Bình d1 10:30', tst.try($q$ select (create_booking(array[8], null, tst.at('d1','10:30')::timestamptz))->>'code' $q$);
select '3b Bình cannot see An', count(*) from bookings where user_id <> auth.uid();
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select '3c admin walk-in d1 10:00', tst.try($q$ select (admin_create_booking(null,'Khách lẻ','0912345678',array[8],null,tst.at('d1','10:00')::timestamptz,'gọi điện'))->>'status' $q$);
select '3d slot 10:30 remaining before full', tst.try($q$ select (select s->>'remaining' from jsonb_array_elements(get_free_slots((select v from tst.ids where k='d1')::date, array[8])->'slots') s where s->>'start'='10:30') $q$);
select '3e admin fills 10:30', tst.try($q$ select (admin_create_booking(null,'Khách 2','0912345679',array[8],null,tst.at('d1','10:30')::timestamptz))->>'code' $q$);
select '3f 4th at 10:30 -> full', tst.try($q$ select admin_create_booking(null,'Khách 3','0912345670',array[8],null,tst.at('d1','10:30')::timestamptz)::text $q$);
select '3g 10:30 listed?', tst.try($q$ select count(*)::text from jsonb_array_elements(get_free_slots((select v from tst.ids where k='d1')::date, array[8])->'slots') s where s->>'start'='10:30' $q$);
select '3h codes d1', string_agg(code, ',' order by code) from bookings where (start_at at time zone 'Asia/Ho_Chi_Minh')::date = (select v from tst.ids where k='d1')::date;
reset role;

\echo '--- 4. trạng thái, hủy, dời lịch'
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select '4a confirm #1', tst.try($q$ select change_booking_status(1,'confirmed')->>'status' $q$);
select '4b confirmed->completed', tst.try($q$ select change_booking_status(1,'completed')::text $q$);
select '4c reject #2 no reason', tst.try($q$ select change_booking_status(2,'rejected')::text $q$);
select '4d reject #2 with reason', tst.try($q$ select change_booking_status(2,'rejected','Tiệm nghỉ đột xuất')->>'status' $q$);
select '4e rejected->confirmed', tst.try($q$ select change_booking_status(2,'confirmed')::text $q$);
select '4f reschedule #1 to d2 14:00', tst.try($q$ select reschedule_booking(1, tst.at('d2','14:00')::timestamptz)->>'code' $q$);
select '4g reschedule rejected #2', tst.try($q$ select reschedule_booking(2, tst.at('d2','14:00')::timestamptz)::text $q$);
-- BUG-02: 4h cần giờ hẹn ngay sau giờ hiện tại; nếu chạy ngoài 08:00 – 20:00 thì giờ đó nằm ngoài giờ mở cửa.
-- Mở rộng tạm giờ mở cửa 00:00 – 23:59 cho riêng bước 4h, sau đó trả lại giờ cũ, để kết quả không phụ thuộc giờ chạy.
reset role;
insert into tst.ids select 'open', open_time::text from store_settings where id = 1;
insert into tst.ids select 'close', close_time::text from store_settings where id = 1;
update store_settings set open_time = '00:00', close_time = '23:59' where id = 1;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select '4h admin booking for An soon', tst.try($q$ select (admin_create_booking('00000000-0000-0000-0000-00000000000b',null,null,array[8],null,
   (date_trunc('hour', now() at time zone 'Asia/Ho_Chi_Minh') + interval '1 hour') at time zone 'Asia/Ho_Chi_Minh'))->>'id' $q$);
reset role;
update store_settings set open_time = (select v from tst.ids where k = 'open')::time,
                          close_time = (select v from tst.ids where k = 'close')::time where id = 1;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select '4i An unseen badge count', count(*) from bookings where user_seen_at is null and status <> 'pending';
select '4j An cancels soon booking', tst.try($q$ select cancel_my_booking((select max(id) from bookings where user_id=auth.uid()), 'bận')::text $q$);
select '4k An cancels #1 no reason', tst.try($q$ select cancel_my_booking(1, '  ')::text $q$);
select '4l An cancels #1', tst.try($q$ select cancel_my_booking(1, 'Bận việc')->>'status' $q$);
select '4m An cancels Bình booking', tst.try($q$ select cancel_my_booking((select id from bookings where customer_name='Trần Bình' limit 1), 'x')::text $q$);
select '4n mark seen', tst.try($q$ select mark_booking_seen(2)::text $q$);
select '4o logs for #1', string_agg(coalesce(from_status::text,'-')||'>'||to_status, ' ' order by id) from booking_status_logs where booking_id=1;
select '4p reschedules visible', count(*) from booking_reschedules;
reset role;

\echo '--- 5. chặn lịch, ngày nghỉ'
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select '5a block d2 afternoon', tst.try($q$ insert into blocked_slots(start_date,end_date,start_time,end_time,reason,created_by) values ((select v from tst.ids where k='d2')::date,(select v from tst.ids where k='d2')::date,'13:00','17:00','Tập huấn',auth.uid()) returning id::text $q$);
select '5b slots d2 13-17', tst.try($q$ select count(*)::text from jsonb_array_elements(get_free_slots((select v from tst.ids where k='d2')::date, array[1])->'slots') s where (s->>'start')::time >= '12:30' and (s->>'start')::time < '17:00' $q$);
select '5c walk-in in block', tst.try($q$ select admin_create_booking(null,'K','0912345678',array[1],null,tst.at('d2','14:00')::timestamptz)::text $q$);
select '5d set weekday closed', tst.try($q$ update store_settings set closed_weekdays = array[extract(dow from (select v from tst.ids where k='d1')::date)::smallint] returning closed_weekdays::text $q$);
select '5e slots d1 closed', tst.try($q$ select jsonb_array_length(get_free_slots((select v from tst.ids where k='d1')::date, array[1])->'slots')::text $q$);
select '5f reset weekday', tst.try($q$ update store_settings set closed_weekdays='{}' returning 'ok' $q$);
reset role;

\echo '--- 6. quản trị: quyền, khóa, giá, thống kê'
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select '6a self demote', tst.try($q$ select set_admin_role(auth.uid(), false)::text $q$);
select '6b lock Bình', tst.try($q$ select set_user_locked('00000000-0000-0000-0000-00000000000c', true)::text $q$);
select '6c price change', tst.try($q$ update services set price = 170000 where id = 1 returning price::text $q$);
select '6d price history', (select count(*) from service_price_history);
select '6e bad price', tst.try($q$ update services set price = 170500 where id = 1 returning price::text $q$);
select '6f delete used service', tst.try($q$ delete from services where id = 8 returning id::text $q$);
select '6g stats', tst.try($q$ select get_stats((select v from tst.ids where k='d1')::date, (select v from tst.ids where k='d2')::date)::text $q$);
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select '6h locked Bình books', tst.try($q$ select create_booking(array[1], null, tst.at('d2','09:00')::timestamptz)::text $q$);
select '6i locked Bình sees bookings', count(*) from bookings;
reset role;
