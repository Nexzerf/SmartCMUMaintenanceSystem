-- Smart CMU Maintenance Request System — initial schema
-- Works on Supabase Postgres and on plain Postgres 15+ (and PGlite for local dev).

-- gen_random_uuid() is built into Postgres 13+, no extension needed.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('reporter', 'technician', 'admin')),
  full_name text not null default '',
  user_type text check (user_type in ('student', 'staff')),
  faculty text,
  phone text,
  profile_completed boolean not null default false,
  pdpa_accepted_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id serial primary key,
  name_th text not null,
  icon text not null default 'Wrench',
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists technician_skills (
  technician_id uuid not null references users(id) on delete cascade,
  category_id int not null references categories(id) on delete cascade,
  primary key (technician_id, category_id)
);

create table if not exists campuses (
  id serial primary key,
  name_th text not null
);

create table if not exists buildings (
  id serial primary key,
  campus_id int not null references campuses(id) on delete cascade,
  name_th text not null
);

create table if not exists rooms (
  id serial primary key,
  building_id int not null references buildings(id) on delete cascade,
  floor int not null,
  name_th text not null
);

create table if not exists request_code_counters (
  yymm text primary key,
  last_value int not null
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  reporter_id uuid not null references users(id),
  category_id int not null references categories(id),
  room_id int not null references rooms(id),
  landmark text,
  description text not null,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'urgent')),
  status text not null default 'pending' check (status in (
    'pending', 'accepted', 'assigned', 'in_progress', 'waiting_parts', 'need_info',
    'completed', 'closed', 'cancelled', 'rejected', 'reopened'
  )),
  status_before_info text,
  assigned_technician_id uuid references users(id),
  merged_into_id uuid references requests(id),
  reject_reason text,
  reopen_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  closed_at timestamptz
);

create index if not exists requests_reporter_idx on requests(reporter_id);
create index if not exists requests_technician_idx on requests(assigned_technician_id);
create index if not exists requests_status_idx on requests(status);
create index if not exists requests_room_category_idx on requests(room_id, category_id);
create index if not exists requests_created_idx on requests(created_at);

create table if not exists request_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  url text not null,
  kind text not null check (kind in ('before', 'after')),
  created_at timestamptz not null default now()
);

create table if not exists request_followers (
  request_id uuid not null references requests(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create table if not exists status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid references users(id),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists status_history_request_idx on status_history(request_id, created_at);

create table if not exists repair_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  cause text not null,
  parts_used text,
  technician_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists info_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  asked_by uuid references users(id),
  question text not null,
  answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ratings (
  request_id uuid primary key references requests(id) on delete cascade,
  score int not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  request_id uuid references requests(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc);

-- The app talks to Postgres from the server only (service connection).
-- Lock the tables away from Supabase's public anon/authenticated API roles.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'alter table users enable row level security';
    execute 'alter table categories enable row level security';
    execute 'alter table technician_skills enable row level security';
    execute 'alter table campuses enable row level security';
    execute 'alter table buildings enable row level security';
    execute 'alter table rooms enable row level security';
    execute 'alter table request_code_counters enable row level security';
    execute 'alter table requests enable row level security';
    execute 'alter table request_images enable row level security';
    execute 'alter table request_followers enable row level security';
    execute 'alter table status_history enable row level security';
    execute 'alter table repair_notes enable row level security';
    execute 'alter table info_requests enable row level security';
    execute 'alter table ratings enable row level security';
    execute 'alter table notifications enable row level security';
  end if;
end $$;
