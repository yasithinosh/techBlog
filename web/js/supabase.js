// ============================================
// INOVOID — Supabase Client Initialization
// ============================================
// Credentials are loaded from js/config.js (APP_CONFIG)
// Make sure config.js is loaded BEFORE this file in HTML
// ============================================

const SUPABASE_URL = APP_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = APP_CONFIG.SUPABASE_ANON_KEY;

// Initialize Supabase client (loaded via CDN in HTML)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// DATABASE HELPERS
// ============================================

// --- POSTS ---
async function fetchPublishedPosts(limit = 20, offset = 0) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:author_id (id, full_name, nickname, avatar_url),
            reactions:reactions (id, type),
            comments:comments (id)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    return { data, error };
}

async function fetchPostById(postId) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:author_id (id, full_name, nickname, avatar_url, bio),
            reactions:reactions (id, type, user_id),
            comments:comments (id, content, created_at, profiles:author_id (id, full_name, nickname, avatar_url))
        `)
        .eq('id', postId)
        .single();
    return { data, error };
}

async function fetchUserPosts(userId) {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });
    return { data, error };
}

async function createPost(postData) {
    const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();
    return { data, error };
}

async function updatePost(postId, updates) {
    const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();
    return { data, error };
}

async function deletePost(postId) {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
    return { error };
}

// --- COMMENTS ---
async function fetchComments(postId) {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles:author_id (id, full_name, nickname, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    return { data, error };
}

async function addComment(postId, authorId, content) {
    const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, author_id: authorId, content })
        .select(`
            *,
            profiles:author_id (id, full_name, nickname, avatar_url)
        `)
        .single();
    return { data, error };
}

async function deleteComment(commentId) {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
    return { error };
}

// --- REACTIONS ---
async function toggleReaction(postId, userId, type = 'like') {
    // Check if reaction exists
    const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        // Remove reaction
        const { error } = await supabase
            .from('reactions')
            .delete()
            .eq('id', existing.id);
        return { reacted: false, error };
    } else {
        // Add reaction
        const { error } = await supabase
            .from('reactions')
            .insert({ post_id: postId, user_id: userId, type });
        return { reacted: true, error };
    }
}

async function getReactionCount(postId) {
    const { count, error } = await supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
    return { count, error };
}

async function hasUserReacted(postId, userId) {
    const { data } = await supabase
        .from('reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();
    return !!data;
}

// --- PROFILES ---
async function fetchProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
}

async function updateProfile(userId, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    return { data, error };
}

// --- STORAGE ---
async function uploadImage(bucket, filePath, file) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });
    if (error) return { url: null, error };
    const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
    return { url: urlData.publicUrl, error: null };
}

async function uploadAvatar(userId, file) {
    const ext = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${ext}`;
    return uploadImage('avatars', filePath, file);
}

async function uploadPostCover(userId, file) {
    const ext = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${ext}`;
    return uploadImage('post-covers', filePath, file);
}
