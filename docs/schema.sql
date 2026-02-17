-- ============================================
-- INOVOID TECH BLOG — Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================

-- 1. PROFILES TABLE
-- Extends auth.users — stores public user info
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT DEFAULT '',
    nickname TEXT UNIQUE DEFAULT '',
    bio TEXT DEFAULT '' CHECK (char_length(bio) <= 250),
    avatar_url TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. POSTS TABLE
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT DEFAULT '',
    cover_image_url TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COMMENTS TABLE
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. REACTIONS TABLE (one reaction per user per post)
CREATE TABLE public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL DEFAULT 'like' CHECK (type IN ('like', 'love', 'fire')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_published ON public.posts(published);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post ON public.comments(post_id);
CREATE INDEX idx_reactions_post ON public.reactions(post_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, nickname)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'nickname', 'user_' || LEFT(NEW.id::text, 8))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- POSTS policies
CREATE POLICY "Published posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (published = true);

CREATE POLICY "Authors can view own drafts"
    ON public.posts FOR SELECT
    USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = author_id);

-- COMMENTS policies
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can comment"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = author_id);

-- REACTIONS policies
CREATE POLICY "Reactions are viewable by everyone"
    ON public.reactions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can react"
    ON public.reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
    ON public.reactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS
-- Run these in the SQL editor as well
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-covers', 'post-covers', true);

-- Storage policies: anyone can view, authenticated users can upload
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatars"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Post covers are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'post-covers');

CREATE POLICY "Users can upload post covers"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'post-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own post covers"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'post-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
