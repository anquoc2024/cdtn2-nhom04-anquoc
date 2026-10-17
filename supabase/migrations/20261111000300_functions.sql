-- NailCare – hàm SQL xử lý quy tắc nghiệp vụ (lớp Service phía máy chủ, gọi qua supabase.rpc)
-- Lỗi nghiệp vụ được báo bằng mã trong message (SLOT_FULL, CANNOT_CANCEL, …) – xem API Contract v1.1.

-- ================================================================ hàm nội bộ (schema private)
create or replace function private.tz() returns text language sql immutable as $$ select 'Asia/Ho_Chi_Minh' $$;

create or replace function private.settings()
returns public.store_settings language sql stable security definer set search_path = public as $$
  select * from public.store_settings where id = 1;
$$;

create or replace function private.require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_admin() then raise exception 'NOT_ALLOWED'; end if;
end $$;

-- Tổng thời lượng các dịch vụ đang hoạt động, làm tròn lên bội số slot_minutes (BR02)
create or replace function private.booking_minutes(p_service_ids bigint[])
returns integer language plpgsql stable security definer set search_path = public as $$
declare v_total int; v_count int; v_step int := (private.settings()).slot_minutes;
begin
  if p_service_ids is null or cardinality(p_service_ids) = 0 then raise exception 'VALIDATION_ERROR'; end if;
  select coalesce(sum(duration_minutes), 0), count(*) into v_total, v_count
    from public.services where id = any (p_service_ids) and is_active;
  if v_count <> cardinality(array(select distinct unnest(p_service_ids))) then raise exception 'VALIDATION_ERROR'; end if;
  return ceil(v_total::numeric / v_step)::int * v_step;
end $$;

-- Số chỗ còn trống ít nhất trong khoảng [p_start, p_end) (BR03, NFR04)
create or replace function private.slot_remaining(p_start timestamptz, p_end timestamptz, p_exclude bigint default null)
returns integer language sql stable security definer set search_path = public as $$
  with s as (select * from private.settings())
  select (select capacity_per_slot from s) - coalesce(max(used), 0)
  from (
    select (select count(*) from public.bookings b
             where b.status in ('pending', 'confirmed', 'in_progress')
               and b.start_at < u + make_interval(mins => (select slot_minutes from s))
               and b.end_at > u
               and (p_exclude is null or b.id <> p_exclude)) as used
    from generate_series(p_start, p_end - interval '1 minute',
                         make_interval(mins => (select slot_minutes from s))) as u
  ) x;
$$;

-- Ngày nghỉ hoặc khoảng bị chặn (BR12)
create or replace function private.slot_blocked(p_start timestamptz, p_end timestamptz)
returns boolean language sql stable security definer set search_path = public as $$
  with t as (
    select (p_start at time zone private.tz())::date as d,
           (p_start at time zone private.tz())::time as st,
           (p_end   at time zone private.tz())::time as et
  )
  select extract(dow from t.d)::smallint = any (coalesce((private.settings()).closed_weekdays, '{}'))
      or exists (select 1 from public.blocked_slots b
                  where t.d between b.start_date and b.end_date
                    and (b.start_time is null or (b.start_time < t.et and b.end_time > t.st)))
  from t;
$$;

-- Kiểm tra một khoảng giờ có đặt được không; báo lỗi theo mã (BR01–BR04, BR12)
create or replace function private.assert_slot(p_start timestamptz, p_end timestamptz,
                                               p_exclude bigint, p_check_lead boolean)
returns void language plpgsql stable security definer set search_path = public as $$
declare
  s public.store_settings := private.settings();
  v_day date := (p_start at time zone private.tz())::date;
  v_today date := (now() at time zone private.tz())::date;
begin
  if extract(minute from (p_start at time zone private.tz()))::int % s.slot_minutes <> 0
     or extract(second from p_start) <> 0 then
    raise exception 'VALIDATION_ERROR';
  end if;
  if (p_end at time zone private.tz())::date <> v_day
     or (p_start at time zone private.tz())::time < s.open_time
     or (p_end at time zone private.tz())::time > s.close_time
     or p_start < now() then
    raise exception 'OUT_OF_HOURS';
  end if;
  if p_check_lead and (p_start < now() + interval '1 hour' or v_day > v_today + 30) then
    raise exception 'OUT_OF_HOURS';                                    -- BR04
  end if;
  if private.slot_blocked(p_start, p_end) then raise exception 'SLOT_BLOCKED'; end if;
  if private.slot_remaining(p_start, p_end, p_exclude) <= 0 then raise exception 'SLOT_FULL'; end if;
end $$;

-- Khóa theo ngày hẹn để hai người đặt cùng lúc không vượt số chỗ (NFR04)
create or replace function private.lock_day(p_start timestamptz)
returns void language sql security definer set search_path = public as $$
  select pg_advisory_xact_lock(hashtext('nailcare-booking-' || ((p_start at time zone private.tz())::date)::text));
$$;

-- Mã lịch hẹn NC-YYYYMMDD-NNN theo ngày hẹn (BR.DL.1.5); gọi sau lock_day
create or replace function private.next_booking_code(p_start timestamptz)
returns text language plpgsql security definer set search_path = public as $$
declare v_prefix text := 'NC-' || to_char(p_start at time zone private.tz(), 'YYYYMMDD') || '-'; v_n int;
begin
  select coalesce(max(substr(code, 13, 3)::int), 0) + 1 into v_n from public.bookings where code like v_prefix || '%';
  return v_prefix || lpad(v_n::text, 3, '0');
end $$;

-- Chèn lịch hẹn và chi tiết dịch vụ (giá, tên tại thời điểm đặt – BR09)
create or replace function private.insert_booking(
  p_user_id uuid, p_name text, p_phone text, p_source public.booking_source, p_status public.booking_status,
  p_service_ids bigint[], p_design_id bigint, p_start timestamptz, p_end timestamptz, p_note text, p_actor uuid)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  if p_design_id is not null and not exists (select 1 from public.nail_designs where id = p_design_id and is_active) then
    raise exception 'VALIDATION_ERROR';
  end if;
  insert into public.bookings (code, user_id, customer_name, customer_phone, source, design_id,
                               start_at, end_at, total_price, status, note, created_by, handled_by)
  values (private.next_booking_code(p_start), p_user_id, btrim(p_name), p_phone, p_source, p_design_id,
          p_start, p_end,
          (select coalesce(sum(price), 0) from public.services where id = any (p_service_ids)),
          p_status, nullif(btrim(coalesce(p_note, '')), ''), p_actor,
          case when p_source = 'store' then p_actor end)
  returning * into b;

  insert into public.booking_services (booking_id, service_id, service_name, price, duration_minutes)
  select b.id, s.id, s.name, s.price, s.duration_minutes
  from public.services s where s.id = any (p_service_ids);
  return b;
end $$;

create or replace function private.booking_json(b public.bookings)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', b.id, 'code', b.code, 'status', b.status, 'source', b.source,
    'customerName', b.customer_name, 'startAt', b.start_at, 'endAt', b.end_at,
    'totalPrice', b.total_price, 'reason', b.reason,
    'services', coalesce((select jsonb_agg(jsonb_build_object('serviceId', bs.service_id, 'name', bs.service_name, 'price', bs.price))
                          from public.booking_services bs where bs.booking_id = b.id), '[]'::jsonb));
$$;

-- ================================================================ 1. get_free_slots (FR06, UC06)
create or replace function public.get_free_slots(p_date date, p_service_ids bigint[] default null,
                                                 p_exclude_booking_id bigint default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  s public.store_settings := private.settings();
  v_minutes int;
  v_today date := (now() at time zone private.tz())::date;
  v_admin boolean := public.is_admin();
  v_slots jsonb := '[]'::jsonb;
  v_start timestamptz; v_end timestamptz; v_left int; t time;
  v_lead interval := case when public.is_admin() then interval '0' else interval '1 hour' end;
begin
  if p_exclude_booking_id is not null then
    if not v_admin then raise exception 'NOT_ALLOWED'; end if;
    select extract(epoch from end_at - start_at)::int / 60 into v_minutes from public.bookings where id = p_exclude_booking_id;
    if v_minutes is null then raise exception 'NOT_FOUND'; end if;
  else
    v_minutes := private.booking_minutes(p_service_ids);
  end if;
  if p_date is null or p_date < v_today or (not v_admin and p_date > v_today + 30) then
    raise exception 'OUT_OF_HOURS';
  end if;

  t := s.open_time;
  while t + make_interval(mins => v_minutes) <= s.close_time and t + make_interval(mins => v_minutes) > t loop
    v_start := (p_date + t) at time zone private.tz();
    v_end := v_start + make_interval(mins => v_minutes);
    if v_start >= now() + v_lead
       and not private.slot_blocked(v_start, v_end) then
      v_left := private.slot_remaining(v_start, v_end, p_exclude_booking_id);
      if v_left > 0 then
        v_slots := v_slots || jsonb_build_object('start', to_char(t, 'HH24:MI'),
                                                 'end', to_char(t + make_interval(mins => v_minutes), 'HH24:MI'),
                                                 'startAt', v_start, 'remaining', v_left);
      end if;
    end if;
    t := t + make_interval(mins => s.slot_minutes);
  end loop;

  return jsonb_build_object('date', p_date, 'totalMinutes', v_minutes, 'slots', v_slots);
end $$;

-- ================================================================ 2. create_booking (FR05, FR18, UC05)
create or replace function public.create_booking(p_service_ids bigint[], p_design_id bigint,
                                                 p_start_at timestamptz, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me public.profiles;
  v_minutes int;
  v_end timestamptz;
  b public.bookings;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into me from public.profiles where id = auth.uid();
  if me.id is null or me.is_locked then raise exception 'ACCOUNT_LOCKED'; end if;
  if char_length(coalesce(p_note, '')) > 500 then raise exception 'VALIDATION_ERROR'; end if;

  v_minutes := private.booking_minutes(p_service_ids);
  v_end := p_start_at + make_interval(mins => v_minutes);

  perform private.lock_day(p_start_at);
  if (select count(*) from public.bookings
       where user_id = me.id and status in ('pending', 'confirmed') and end_at > now()) >= 2 then
    raise exception 'BOOKING_LIMIT';                                   -- BR05
  end if;
  perform private.assert_slot(p_start_at, v_end, null, true);

  b := private.insert_booking(me.id, me.full_name, me.phone, 'online', 'pending',
                              p_service_ids, p_design_id, p_start_at, v_end, p_note, me.id);
  return private.booking_json(b);
end $$;

-- ================================================================ 3. cancel_my_booking (FR08, UC08, BR06a)
create or replace function public.cancel_my_booking(p_booking_id bigint, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) = 0 then raise exception 'REASON_REQUIRED'; end if;
  select * into b from public.bookings where id = p_booking_id and user_id = auth.uid() for update;
  if b.id is null then raise exception 'NOT_FOUND'; end if;
  if b.status not in ('pending', 'confirmed') or b.start_at - now() < interval '2 hours' then
    raise exception 'CANNOT_CANCEL';
  end if;
  update public.bookings set status = 'cancelled', reason = left(btrim(p_reason), 300)
   where id = b.id returning * into b;
  return private.booking_json(b);
end $$;

-- ================================================================ quyền gọi hàm
revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_admin(), public.is_active_user() to anon, authenticated;
grant execute on function public.get_free_slots(date, bigint[], bigint) to anon, authenticated;
grant execute on function public.create_booking(bigint[], bigint, timestamptz, text),
                          public.cancel_my_booking(bigint, text) to authenticated;
