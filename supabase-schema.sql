-- Personal OS - Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  telegram_user_id text unique,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- HABITS (daily tracking)
-- ============================================================
create table if not exists public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  trained_gym boolean,
  drank_alcohol boolean,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.habits enable row level security;

create policy "Users can manage own habits" on public.habits
  for all using (auth.uid() = user_id);

-- ============================================================
-- GOALS (5-year goals)
-- ============================================================
create table if not exists public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  category text not null default 'personal',
  completed boolean default false,
  target_date date,
  notes text,
  created_at timestamptz default now()
);

alter table public.goals enable row level security;

create policy "Users can manage own goals" on public.goals
  for all using (auth.uid() = user_id);

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================
create table if not exists public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  content text not null,
  prompt_used text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.journal_entries enable row level security;

create policy "Users can manage own journal entries" on public.journal_entries
  for all using (auth.uid() = user_id);

-- ============================================================
-- NOTES (from Telegram or manual entry)
-- ============================================================
create table if not exists public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  category text not null default 'thought', -- 'business_idea' | 'thought'
  source text default 'web', -- 'web' | 'telegram'
  created_at timestamptz default now()
);

alter table public.notes enable row level security;

create policy "Users can manage own notes" on public.notes
  for all using (auth.uid() = user_id);

-- Service role can insert notes (for Telegram webhook)
create policy "Service role can insert notes" on public.notes
  for insert with check (true);

-- ============================================================
-- DAILY FOCUS
-- ============================================================
create table if not exists public.daily_focus (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  focus text not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.daily_focus enable row level security;

create policy "Users can manage own daily focus" on public.daily_focus
  for all using (auth.uid() = user_id);
