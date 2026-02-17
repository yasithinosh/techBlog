-- ============================================
-- INOVOID — Notifications System Schema
-- ============================================
-- Run this in Supabase SQL Editor to enable notifications

-- 1. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Recipient
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Sender (who triggered it)
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'system')),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, -- Optional (for like/comment)
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications (mark read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- A. Notify when someone COMMENTS on your post
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
BEGIN
    -- Get the author of the post
    SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;

    -- Create notification if commenter is NOT the author
    IF post_author_id IS NOT NULL AND post_author_id != NEW.author_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, post_id)
        VALUES (post_author_id, NEW.author_id, 'comment', NEW.post_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- B. Notify when someone LIKES your post
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
BEGIN
    -- Only notify for 'like' (can extend later)
    IF NEW.type != 'like' THEN RETURN NEW; END IF;

    -- Get post author
    SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;

    -- Prevent self-notification
    IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
        -- Check if notification already exists to prevent duplicates (spam)
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications 
            WHERE user_id = post_author_id 
            AND actor_id = NEW.user_id 
            AND type = 'like' 
            AND post_id = NEW.post_id
        ) THEN
            INSERT INTO public.notifications (user_id, actor_id, type, post_id)
            VALUES (post_author_id, NEW.user_id, 'like', NEW.post_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reaction_created
    AFTER INSERT ON public.reactions
    FOR EACH ROW EXECUTE FUNCTION notify_on_reaction();
