-- NailCare – lược đồ CSDL theo Database Design v1.1 (13 bảng, 3 kiểu liệt kê)
-- Chạy trên Supabase (PostgreSQL 15+). Múi giờ nghiệp vụ: Asia/Ho_Chi_Minh.

create schema if not exists private;

-- ---------------------------------------------------------------- kiểu liệt kê
create type public.user_role as enum ('user', 'admin');
create type public.booking_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected');
create type public.booking_source as enum ('online', 'store');

-- ---------------------------------------------------------------- tài khoản
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   varchar(100) not null check (char_length(btrim(full_name)) between 1 and 100),
  phone       varchar(10)  not null unique check (phone ~ '^0[0-9]{9}$'),
  email       varchar(255) not null unique,
  role        public.user_role not null default 'user',
  is_locked   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- dịch vụ
create table public.service_categories (
  id          bigint generated always as identity primary key,
  name        varchar(100) not null unique,
  sort_order  smallint not null default 0,
  is_active   boolean not null default true
);

create table public.services (
  id               bigint generated always as identity primary key,
  category_id      bigint not null references public.service_categories (id) on delete restrict,
  name             varchar(150) not null,
  description      text,
  duration_minutes smallint not null check (duration_minutes between 15 and 240 and duration_minutes % 15 = 0),
  price            integer not null check (price > 0 and price % 1000 = 0),
  image_url        text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.service_price_history (
  id          bigint generated always as identity primary key,
  service_id  bigint not null references public.services (id) on delete restrict,
  old_price   integer not null,
  new_price   integer not null check (new_price > 0),
  changed_by  uuid not null references public.profiles (id) on delete restrict,
  changed_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- mẫu nail
create table public.design_categories (
  id    bigint generated always as identity primary key,
  name  varchar(100) not null unique
);

create table public.nail_designs (
  id               bigint generated always as identity primary key,
  category_id      bigint not null references public.design_categories (id) on delete restrict,
  name             varchar(150) not null,
  description      text,
  image_url        text not null,
  reference_price  integer check (reference_price >= 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.design_services (
  design_id   bigint not null references public.nail_designs (id) on delete cascade,
  service_id  bigint not null references public.services (id) on delete restrict,
  primary key (design_id, service_id)
);

-- ---------------------------------------------------------------- lịch hẹn
create table public.bookings (
  id              bigint generated always as identity primary key,
  code            varchar(15) not null unique check (code ~ '^NC-[0-9]{8}-[0-9]{3}$'),
  user_id         uuid references public.profiles (id) on delete restrict,
  customer_name   varchar(100) not null check (char_length(btrim(customer_name)) > 0),
  customer_phone  varchar(10)  not null check (customer_phone ~ '^0[0-9]{9}$'),
  source          public.booking_source not null default 'online',
  design_id       bigint references public.nail_designs (id) on delete restrict,
  start_at        timestamptz not null,
  end_at          timestamptz not null,
  total_price     integer not null check (total_price >= 0),
  status          public.booking_status not null default 'pending',
  note            varchar(500),
  reason          varchar(300),
  handled_by      uuid references public.profiles (id) on delete restrict,
  created_by      uuid not null references public.profiles (id) on delete restrict,
  user_seen_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- BR02: khung giờ theo bước 15/30 phút, kết thúc sau khi bắt đầu
  constraint bookings_step_chk check (extract(second from start_at) = 0 and extract(minute from start_at)::int % 15 = 0),
  constraint bookings_time_chk check (end_at > start_at),
  -- BR08: từ chối / hủy phải có lý do
  constraint bookings_reason_chk check (status not in ('rejected', 'cancelled') or char_length(btrim(coalesce(reason, ''))) > 0),
  -- BR13: lịch khách tự đặt phải gắn tài khoản
  constraint bookings_source_chk check (source = 'store' or user_id is not null)
);

create table public.booking_services (
  booking_id        bigint not null references public.bookings (id) on delete cascade,
  service_id        bigint not null references public.services (id) on delete restrict,
  service_name      varchar(150) not null,
  price             integer not null,
  duration_minutes  smallint not null,
  primary key (booking_id, service_id)
);

create table public.booking_status_logs (
  id           bigint generated always as identity primary key,
  booking_id   bigint not null references public.bookings (id) on delete cascade,
  from_status  public.booking_status,
  to_status    public.booking_status not null,
  changed_by   uuid not null references public.profiles (id) on delete restrict,
  reason       varchar(300),
  changed_at   timestamptz not null default now()
);

create table public.booking_reschedules (
  id            bigint generated always as identity primary key,
  booking_id    bigint not null references public.bookings (id) on delete cascade,
  old_start_at  timestamptz not null,
  old_end_at    timestamptz not null,
  new_start_at  timestamptz not null,
  new_end_at    timestamptz not null check (new_end_at > new_start_at),
  changed_by    uuid not null references public.profiles (id) on delete restrict,
  changed_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- cửa hàng, chặn lịch
create table public.blocked_slots (
  id          bigint generated always as identity primary key,
  start_date  date not null,
  end_date    date not null,
  start_time  time,
  end_time    time,
  reason      varchar(300) not null check (char_length(btrim(reason)) > 0),
  created_by  uuid not null references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  constraint blocked_dates_chk check (end_date >= start_date),
  constraint blocked_times_chk check (
    (start_time is null and end_time is null) or
    (start_time is not null and end_time is not null and end_time > start_time))
);

create table public.store_settings (
  id                 smallint primary key default 1 check (id = 1),
  store_name         varchar(150) not null,
  address            varchar(255) not null,
  phone              varchar(10)  not null check (phone ~ '^0[0-9]{9}$'),
  open_time          time not null default '09:00',
  close_time         time not null default '21:00',
  slot_minutes       smallint not null default 30 check (slot_minutes in (15, 30, 60)),
  capacity_per_slot  smallint not null default 3 check (capacity_per_slot between 1 and 20),
  closed_weekdays    smallint[] default '{}',
  banner_url         text,
  intro              text,
  updated_by         uuid references public.profiles (id) on delete set null,
  updated_at         timestamptz not null default now(),
  constraint store_hours_chk check (open_time < close_time)
);

-- ---------------------------------------------------------------- chỉ mục
create index bookings_start_idx         on public.bookings (start_at);
create index bookings_status_start_idx  on public.bookings (status, start_at);
create index bookings_user_status_idx   on public.bookings (user_id, status);
create index services_category_idx      on public.services (category_id, is_active);
create index designs_category_idx       on public.nail_designs (category_id, is_active);
create index booking_services_svc_idx   on public.booking_services (service_id);
create index blocked_slots_dates_idx    on public.blocked_slots (start_date, end_date);
create index status_logs_booking_idx    on public.booking_status_logs (booking_id);
create index reschedules_booking_idx    on public.booking_reschedules (booking_id);
