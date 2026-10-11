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

-- ================================================================ quyền gọi hàm
revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_admin(), public.is_active_user() to anon, authenticated;
grant execute on function public.get_free_slots(date, bigint[], bigint) to anon, authenticated;
