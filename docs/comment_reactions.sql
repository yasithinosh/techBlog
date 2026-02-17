-- Comment Reactions Table
CREATE TABLE public.comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- RLS
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment reactions are viewable by everyone"
    ON public.comment_reactions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can react to comments"
    ON public.comment_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own comment reactions"
    ON public.comment_reactions FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own comment reactions"
    ON public.comment_reactions FOR UPDATE
    USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_comment_reactions_comment ON public.comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user ON public.comment_reactions(user_id);
