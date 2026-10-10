-- NailCare – trigger, hàm kiểm tra quyền và phân quyền theo dòng dữ liệu (RLS)

-- ---------------------------------------------------------------- hàm kiểm tra quyền
-- SECURITY DEFINER để đọc profiles mà không vướng RLS của chính bảng profiles
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role = 'admin' and not p.is_locked);
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and not p.is_locked);
$$;

-- ---------------------------------------------------------------- trigger
create or replace function private.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch  before update on public.profiles  for each row execute function private.touch_updated_at();
create trigger services_touch  before update on public.services  for each row execute function private.touch_updated_at();
create trigger bookings_touch  before update on public.bookings  for each row execute function private.touch_updated_at();
create trigger settings_touch  before update on public.store_settings for each row execute function private.touch_updated_at();

-- Tạo hồ sơ khi Supabase Auth tạo tài khoản (dữ liệu lấy từ options.data của signUp)
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          new.raw_user_meta_data ->> 'phone',
          new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Giữ email trong profiles khớp với Supabase Auth
create or replace function private.handle_user_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.handle_user_email();

-- FR11: ghi lịch sử giá mỗi lần quản trị viên đổi giá
create or replace function private.log_price_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.price is distinct from old.price and auth.uid() is not null then
    insert into public.service_price_history (service_id, old_price, new_price, changed_by)
    values (new.id, old.price, new.price, auth.uid());
  end if;
  return new;
end $$;

create trigger services_price_log
  after update of price on public.services
  for each row execute function private.log_price_change();

-- BR07: mỗi lần tạo lịch hoặc đổi trạng thái đều ghi booking_status_logs
create or replace function private.log_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_logs (booking_id, from_status, to_status, changed_by, reason)
    values (new.id, null, new.status, coalesce(auth.uid(), new.created_by), null);
  elsif new.status is distinct from old.status then
    insert into public.booking_status_logs (booking_id, from_status, to_status, changed_by, reason)
    values (new.id, old.status, new.status, coalesce(auth.uid(), new.created_by), new.reason);
  end if;
  return new;
end $$;

create trigger bookings_status_log
  after insert or update of status on public.bookings
  for each row execute function private.log_booking_status();

-- ---------------------------------------------------------------- quyền trên bảng
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

-- Lịch hẹn và nhật ký chỉ được ghi qua hàm SQL (SECURITY DEFINER)
revoke insert, update, delete on public.bookings, public.booking_services, public.booking_status_logs,
  public.booking_reschedules, public.service_price_history from anon, authenticated;
-- profiles: chỉ được sửa họ tên và SĐT; role, is_locked chỉ đổi qua set_admin_role, set_user_locked
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.profiles               enable row level security;
alter table public.service_categories     enable row level security;
alter table public.services               enable row level security;
alter table public.service_price_history  enable row level security;
alter table public.design_categories      enable row level security;
alter table public.nail_designs           enable row level security;
alter table public.design_services        enable row level security;
alter table public.bookings               enable row level security;
alter table public.booking_services       enable row level security;
alter table public.booking_status_logs    enable row level security;
alter table public.booking_reschedules    enable row level security;
alter table public.blocked_slots          enable row level security;
alter table public.store_settings         enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using ((id = auth.uid() and public.is_active_user()) or public.is_admin())
  with check ((id = auth.uid() and public.is_active_user()) or public.is_admin());

-- danh mục, dịch vụ, mẫu nail: công khai bản ghi đang hoạt động; quản trị viên toàn quyền
create policy service_categories_read on public.service_categories for select to anon, authenticated
  using (is_active or public.is_admin());
create policy service_categories_admin on public.service_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy services_read on public.services for select to anon, authenticated
  using (is_active or public.is_admin());
create policy services_admin on public.services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy design_categories_read on public.design_categories for select to anon, authenticated
  using (true);
create policy design_categories_admin on public.design_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy nail_designs_read on public.nail_designs for select to anon, authenticated
  using (is_active or public.is_admin());
create policy nail_designs_admin on public.nail_designs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy design_services_read on public.design_services for select to anon, authenticated
  using (exists (select 1 from public.nail_designs d where d.id = design_id and (d.is_active or public.is_admin())));
create policy design_services_admin on public.design_services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy price_history_admin on public.service_price_history for select to authenticated
  using (public.is_admin());

-- lịch hẹn: người dùng chỉ xem lịch của mình; quản trị viên xem tất cả
create policy bookings_read on public.bookings for select to authenticated
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());

create policy booking_services_read on public.booking_services for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id
                 and ((b.user_id = auth.uid() and public.is_active_user()) or public.is_admin())));

create policy status_logs_read on public.booking_status_logs for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id
                 and ((b.user_id = auth.uid() and public.is_active_user()) or public.is_admin())));

create policy reschedules_read on public.booking_reschedules for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id
                 and ((b.user_id = auth.uid() and public.is_active_user()) or public.is_admin())));

-- chặn lịch: chỉ quản trị viên (get_free_slots đọc thay người dùng)
create policy blocked_slots_admin on public.blocked_slots for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- cấu hình cửa hàng: ai cũng đọc được, quản trị viên sửa
create policy store_settings_read on public.store_settings for select to anon, authenticated
  using (true);
create policy store_settings_admin on public.store_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
