-- ============================================
-- MIGRATION: ADD COMMENT REPLIES
-- ============================================

-- 1. Add parent_id to comments table
-- Allows comments to reference other comments (nesting)
ALTER TABLE public.comments 
ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. Index for faster lookups of replies
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

-- 3. Update RLS (optional, existing policies might cover it but good to check)
-- "Authenticated users can comment" policy usually checks auth.uid() = author_id.
-- Use existing policy:
-- CREATE POLICY "Authenticated users can comment"
--     ON public.comments FOR INSERT
--     WITH CHECK (auth.uid() = author_id);
-- This works fine for replies too.
