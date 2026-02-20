-- ============================================
-- INOVOID — Bookmarks Table
-- Run this in your Supabase SQL editor
-- ============================================

create table if not exists public.bookmarks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid not null references public.posts(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique(user_id, post_id)
);

-- Row Level Security
alter table public.bookmarks enable row level security;

-- Users can view only their own bookmarks
create policy "Users can view their own bookmarks"
    on public.bookmarks for select
    using (auth.uid() = user_id);

-- Users can insert their own bookmarks
create policy "Users can insert their own bookmarks"
    on public.bookmarks for insert
    with check (auth.uid() = user_id);

-- Users can delete their own bookmarks
create policy "Users can delete their own bookmarks"
    on public.bookmarks for delete
    using (auth.uid() = user_id);
