create table boxboxbox.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  race_date date,
  start_time timestamptz,
  total_duration_minutes integer not null,
  race_length text,
  num_drivers integer not null,
  max_stint_time_minutes integer,
  total_swaps_target integer,
  access_code text unique not null,
  status text not null default 'pending',
  paused_at timestamptz,
  total_paused_seconds integer not null default 0,
  created_at timestamptz default now()
);

create table boxboxbox.drivers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references boxboxbox.events(id) on delete cascade,
  name text not null,
  sequence_order integer not null,
  created_at timestamptz default now()
);

create table boxboxbox.stints (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references boxboxbox.events(id) on delete cascade,
  driver_id uuid references boxboxbox.drivers(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  swap_number integer not null default 1
);

create index idx_events_access_code on boxboxbox.events(access_code);
create index idx_stints_event_id on boxboxbox.stints(event_id);
create index idx_drivers_event_id on boxboxbox.drivers(event_id);
