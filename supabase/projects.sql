-- Projects table + basic policies for a portfolio site.
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  tags text[] not null default '{}'::text[],
  image_url text not null,
  github_url text,
  demo_url text,
  featured boolean not null default true,
  sort_order int not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_featured_sort_idx
  on public.projects (featured desc, sort_order asc, created_at desc);

create index if not exists projects_status_idx
  on public.projects (status);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;

-- Public can read only published + featured projects
drop policy if exists "Public read featured published projects" on public.projects;
create policy "Public read featured published projects"
on public.projects
for select
to anon, authenticated
using (featured = true and status = 'published');

-- NOTE: Admin CRUD is done via server-side API using the Service Role key,
-- so no additional write policies are required for typical usage.
