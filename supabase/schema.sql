-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Enums
create type app_role as enum ('admin','hr','team','client');
create type project_status as enum ('active','archived');
create type visibility as enum ('public','private');
create type task_priority as enum ('low','medium','high','urgent');
create type leave_type as enum ('casual','sick','annual','unpaid');
create type leave_status as enum ('pending','approved','rejected');
create type employment_status as enum ('active','inactive','terminated');
create type timesheet_status as enum ('draft','submitted','approved','rejected');

-- Utility role helpers
create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_hr() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr'
  );
$$;

create or replace function public.is_team() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'team'
  );
$$;

create or replace function public.is_client() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'client'
  );
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'team',
  full_name text,
  avatar_url text,
  email text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Read own profile or admin/hr read all" on public.profiles
  for select
  using (
    id = auth.uid() or public.is_admin() or public.is_hr()
  );

create policy "User can update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Only admins can update the role column
create or replace function public.prevent_non_admin_role_change() returns trigger language plpgsql as $$
begin
  if (new.role <> old.role and not public.is_admin()) then
    raise exception 'Only admin can change role';
  end if;
  return new;
end; $$;

create trigger trg_prevent_non_admin_role_change
  before update on public.profiles
  for each row execute function public.prevent_non_admin_role_change();

-- Projects
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  status project_status not null default 'active',
  visibility visibility not null default 'private',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create or replace function public.has_project_access(p_project_id uuid) returns boolean language sql stable as $$
  select exists (
    select 1 from public.projects pr
    left join public.project_members pm on pm.project_id = pr.id and pm.user_id = auth.uid()
    where pr.id = p_project_id and (pr.owner_id = auth.uid() or pm.user_id is not null or public.is_admin() or public.is_hr())
  );
$$;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy "Project readable by members or owner or admin/hr" on public.projects
  for select using (public.has_project_access(id) or visibility = 'public');

create policy "Project insert by authenticated" on public.projects
  for insert with check (auth.uid() is not null and owner_id = auth.uid());

create policy "Project update by owner or admin" on public.projects
  for update using (owner_id = auth.uid() or public.is_admin());

create policy "Project delete by owner or admin" on public.projects
  for delete using (owner_id = auth.uid() or public.is_admin());

create policy "Project members read/write by project access" on public.project_members
  for all using (public.has_project_access(project_id)) with check (public.has_project_access(project_id));

-- Kanban columns
create table if not exists public.kanban_columns (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position integer not null
);

alter table public.kanban_columns enable row level security;
create policy "Kanban columns by project access" on public.kanban_columns
  for all using (public.has_project_access(project_id)) with check (public.has_project_access(project_id));

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  column_id uuid references public.kanban_columns(id) on delete set null,
  title text not null,
  description text,
  priority task_priority not null default 'medium',
  due_date date,
  assignee uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
create policy "Tasks by project access" on public.tasks
  for all using (public.has_project_access(project_id)) with check (public.has_project_access(project_id));

-- Task comments
create table if not exists public.task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.task_comments enable row level security;
create policy "Task comments by project access" on public.task_comments
  for all using (
    public.has_project_access((select t.project_id from public.tasks t where t.id = task_id))
  ) with check (
    public.has_project_access((select t.project_id from public.tasks t where t.id = task_id))
  );

-- Attachments for tasks
create table if not exists public.task_attachments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_path text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.task_attachments enable row level security;
create policy "Task attachments by project access" on public.task_attachments
  for all using (
    public.has_project_access((select t.project_id from public.tasks t where t.id = task_id))
  ) with check (
    public.has_project_access((select t.project_id from public.tasks t where t.id = task_id))
  );

-- HR Module
create table if not exists public.employees (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  department text,
  designation text,
  phone text,
  manager_id uuid references public.profiles(id) on delete set null,
  join_date date,
  status employment_status not null default 'active'
);

alter table public.employees enable row level security;
create policy "Employees readable by hr/admin or self" on public.employees
  for select using (public.is_hr() or public.is_admin() or user_id = auth.uid());
create policy "Employees insert/update by hr/admin" on public.employees
  for insert with check (public.is_hr() or public.is_admin());
create policy "Employees update by hr/admin" on public.employees
  for update using (public.is_hr() or public.is_admin());

-- Attendance
create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  clock_in timestamptz not null,
  clock_out timestamptz,
  total_minutes integer generated always as (
    case when clock_out is null then null else extract(epoch from (clock_out - clock_in))::int / 60 end
  ) stored
);

alter table public.attendance enable row level security;
create policy "Attendance readable by hr/admin or self" on public.attendance
  for select using (public.is_hr() or public.is_admin() or user_id = auth.uid());
create policy "Attendance insert by self or hr/admin" on public.attendance
  for insert with check (auth.uid() = user_id or public.is_hr() or public.is_admin());
create policy "Attendance update by self (own row) or hr/admin" on public.attendance
  for update using (auth.uid() = user_id or public.is_hr() or public.is_admin());

-- Leaves
create table if not exists public.leaves (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type leave_type not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status leave_status not null default 'pending',
  approver_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.leaves enable row level security;
create policy "Leaves readable by hr/admin or self" on public.leaves
  for select using (public.is_hr() or public.is_admin() or user_id = auth.uid());
create policy "Leaves insert by self or hr/admin" on public.leaves
  for insert with check (auth.uid() = user_id or public.is_hr() or public.is_admin());
create policy "Leaves update by hr/admin or self before approval" on public.leaves
  for update using (public.is_hr() or public.is_admin() or (user_id = auth.uid() and status = 'pending'));

-- HR Documents
create table if not exists public.hr_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  expires_at date,
  created_at timestamptz not null default now()
);

alter table public.hr_documents enable row level security;
create policy "HR docs readable by hr/admin or owner" on public.hr_documents
  for select using (public.is_hr() or public.is_admin() or user_id = auth.uid());
create policy "HR docs write by hr/admin or owner" on public.hr_documents
  for all using (public.is_hr() or public.is_admin() or user_id = auth.uid()) with check (public.is_hr() or public.is_admin() or user_id = auth.uid());

-- Onboarding / Offboarding
create table if not exists public.onboarding (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.offboarding (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.onboarding enable row level security;
alter table public.offboarding enable row level security;
create policy "On/Offboarding visible by hr/admin or owner" on public.onboarding
  for all using (public.is_hr() or public.is_admin() or user_id = auth.uid()) with check (public.is_hr() or public.is_admin() or user_id = auth.uid());
create policy "Offboarding visible by hr/admin or owner" on public.offboarding
  for all using (public.is_hr() or public.is_admin() or user_id = auth.uid()) with check (public.is_hr() or public.is_admin() or user_id = auth.uid());

-- Communication Module
create table if not exists public.channels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  is_private boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.channel_members (
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.messages(id) on delete cascade,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.message_attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_path text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;

create or replace function public.is_channel_member(p_channel_id uuid) returns boolean language sql stable as $$
  select exists(
    select 1 from public.channel_members cm where cm.channel_id = p_channel_id and cm.user_id = auth.uid()
  ) or public.is_admin();
$$;

create policy "Channels readable if member or not private" on public.channels
  for select using (not is_private or public.is_channel_member(id));
create policy "Channels write by members" on public.channels
  for all using (public.is_channel_member(id)) with check (public.is_channel_member(id));

create policy "Channel members read/write by members" on public.channel_members
  for all using (public.is_channel_member(channel_id)) with check (public.is_channel_member(channel_id));

create policy "Messages read/write by channel member" on public.messages
  for all using (public.is_channel_member(channel_id)) with check (public.is_channel_member(channel_id));

create policy "Message attachments read/write by channel member" on public.message_attachments
  for all using (
    public.is_channel_member((select m.channel_id from public.messages m where m.id = message_id))
  ) with check (
    public.is_channel_member((select m.channel_id from public.messages m where m.id = message_id))
  );

-- Reporting / Activity Logs
create table if not exists public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;
create policy "Activity logs readable by admin/hr or owner" on public.activity_logs
  for select using (public.is_admin() or public.is_hr() or user_id = auth.uid());
create policy "Activity logs insert by authenticated" on public.activity_logs
  for insert with check (auth.uid() is not null and user_id = auth.uid());

-- Time Tracking
create table if not exists public.time_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz,
  is_manual boolean not null default true,
  duration_minutes integer generated always as (
    case when end_time is null then null else extract(epoch from (end_time - start_time))::int / 60 end
  ) stored
);

create table if not exists public.screenshots (
  id uuid primary key default uuid_generate_v4(),
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  file_path text not null,
  captured_at timestamptz not null default now()
);

create table if not exists public.activity_metrics (
  id uuid primary key default uuid_generate_v4(),
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  mouse_keystroke_count integer,
  activity_percent integer,
  idle_seconds integer
);

create table if not exists public.timesheets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start_date date not null,
  total_minutes integer not null default 0,
  status timesheet_status not null default 'draft',
  approver_id uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz
);

alter table public.time_entries enable row level security;
alter table public.screenshots enable row level security;
alter table public.activity_metrics enable row level security;
alter table public.timesheets enable row level security;

create policy "Time entries readable by admin/hr or owner" on public.time_entries
  for select using (public.is_admin() or public.is_hr() or user_id = auth.uid());
create policy "Time entries write by owner" on public.time_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Screenshots readable by admin/hr or owner" on public.screenshots
  for select using (
    public.is_admin() or public.is_hr() or (
      exists (
        select 1 from public.time_entries te where te.id = time_entry_id and te.user_id = auth.uid()
      )
    )
  );
create policy "Screenshots write by owner via time entry" on public.screenshots
  for insert with check (
    exists (
      select 1 from public.time_entries te where te.id = time_entry_id and te.user_id = auth.uid()
    )
  );

create policy "Activity metrics read/write by owner or admin/hr" on public.activity_metrics
  for all using (
    public.is_admin() or public.is_hr() or (
      exists (
        select 1 from public.time_entries te where te.id = time_entry_id and te.user_id = auth.uid()
      )
    )
  ) with check (
    public.is_admin() or public.is_hr() or (
      exists (
        select 1 from public.time_entries te where te.id = time_entry_id and te.user_id = auth.uid()
      )
    )
  );

create policy "Timesheets readable by admin/hr or owner" on public.timesheets
  for select using (public.is_admin() or public.is_hr() or user_id = auth.uid());
create policy "Timesheets insert/update by owner or admin/hr" on public.timesheets
  for all using (public.is_admin() or public.is_hr() or user_id = auth.uid()) with check (public.is_admin() or public.is_hr() or user_id = auth.uid());

-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('attachments','attachments', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('chat-files','chat-files', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('hr-docs','hr-docs', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('screenshots','screenshots', false)
  on conflict (id) do nothing;

-- Storage policies: allow users to manage their own files; admins/hr broader
create policy "Task attachments: owner/member can access" on storage.objects
  for select using (
    bucket_id = 'attachments' and (
      exists (
        select 1 from public.task_attachments ta
        join public.tasks t on t.id = ta.task_id
        where ta.file_path = path_tokens[2] and public.has_project_access(t.project_id)
      )
    )
  );

create policy "Chat files: channel members can access" on storage.objects
  for select using (
    bucket_id = 'chat-files' and (
      exists (
        select 1 from public.message_attachments ma
        join public.messages m on m.id = ma.message_id
        where ma.file_path = path_tokens[2] and public.is_channel_member(m.channel_id)
      )
    )
  );

create policy "HR docs: hr/admin or owner" on storage.objects
  for select using (
    bucket_id = 'hr-docs' and (
      public.is_admin() or public.is_hr() or (
        exists (
          select 1 from public.hr_documents d where d.file_path = path_tokens[2] and d.user_id = auth.uid()
        )
      )
    )
  );

create policy "Screenshots: admin/hr or owner of time entry" on storage.objects
  for select using (
    bucket_id = 'screenshots' and (
      public.is_admin() or public.is_hr() or (
        exists (
          select 1 from public.screenshots s
          join public.time_entries te on te.id = s.time_entry_id
          where s.file_path = path_tokens[2] and te.user_id = auth.uid()
        )
      )
    )
  );

-- Allow authenticated users to upload into relevant buckets
create policy "Authenticated write to attachments" on storage.objects for insert with check (bucket_id = 'attachments' and auth.uid() is not null);
create policy "Authenticated write to chat-files" on storage.objects for insert with check (bucket_id = 'chat-files' and auth.uid() is not null);
create policy "HR/admin write to hr-docs or owner" on storage.objects for insert with check (
  bucket_id = 'hr-docs' and (public.is_admin() or public.is_hr() or auth.uid() is not null)
);
create policy "Authenticated write to screenshots" on storage.objects for insert with check (bucket_id = 'screenshots' and auth.uid() is not null);

-- Views for reporting
create or replace view public.v_user_task_counts as
  select u.id as user_id, coalesce(c.count,0) as completed_tasks
  from public.profiles u
  left join (
    select assignee, count(*) as count from public.tasks where column_id is not null group by assignee
  ) c on c.assignee = u.id;

-- Triggers to auto-update updated_at
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

-- Seed: ensure a profile row is created for new auth.users
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();