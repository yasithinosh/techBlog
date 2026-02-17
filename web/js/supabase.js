// ============================================
// INOVOID — Supabase Client Initialization
// ============================================
// Credentials are loaded from js/config.js (APP_CONFIG)
// Make sure config.js is loaded BEFORE this file in HTML
// ============================================

const SUPABASE_URL = APP_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = APP_CONFIG.SUPABASE_ANON_KEY;

// Initialize Supabase client (loaded via CDN in HTML)
// We use 'supabaseClient' to avoid collision with the 'supabase' global from CDN
let supabaseClient;
try {
    const sb = window.supabase;
    const createFn = sb.createClient || (sb.default && sb.default.createClient);
    if (!createFn) {
        throw new Error('createClient not found on window.supabase');
    }
    supabaseClient = createFn(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[inovoid] Supabase client created. Has auth:', !!supabaseClient.auth);
} catch (err) {
    console.error('[inovoid] Failed to initialize Supabase:', err);
    alert('Failed to connect to database. Check browser console for details.');
}

// ============================================
// DATABASE HELPERS
// ============================================

// --- POSTS ---
async function fetchPublishedPosts(limit = 20, offset = 0) {
    const { data, error } = await supabaseClient
        .from('posts')
        .select(`
            *,
            profiles:author_id (id, full_name, nickname, avatar_url),
            reactions:reactions (id, type, user_id),
            comments:comments (id)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    return { data, error };
}

async function fetchPostById(postId) {
    const { data, error } = await supabaseClient
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
    const { data, error } = await supabaseClient
        .from('posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });
    return { data, error };
}

async function createPost(postData) {
    const { data, error } = await supabaseClient
        .from('posts')
        .insert(postData)
        .select()
        .single();
    return { data, error };
}

async function updatePost(postId, updates) {
    const { data, error } = await supabaseClient
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();
    return { data, error };
}

async function deletePost(postId) {
    const { error } = await supabaseClient
        .from('posts')
        .delete()
        .eq('id', postId);
    return { error };
}

// --- COMMENTS ---
async function fetchComments(postId) {
    const { data, error } = await supabaseClient
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
    const { data, error } = await supabaseClient
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
    const { error } = await supabaseClient
        .from('comments')
        .delete()
        .eq('id', commentId);
    return { error };
}

// --- REACTIONS ---
async function toggleReaction(postId, userId, type = 'like') {
    // Check if reaction exists
    const { data: existing } = await supabaseClient
        .from('reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        // Remove reaction
        const { error } = await supabaseClient
            .from('reactions')
            .delete()
            .eq('id', existing.id);
        return { reacted: false, error };
    } else {
        // Add reaction
        const { error } = await supabaseClient
            .from('reactions')
            .insert({ post_id: postId, user_id: userId, type });
        return { reacted: true, error };
    }
}

async function getReactionCount(postId) {
    const { count, error } = await supabaseClient
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
    return { count, error };
}

async function hasUserReacted(postId, userId) {
    const { data } = await supabaseClient
        .from('reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();
    return !!data;
}

// --- PROFILES ---
async function fetchProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
}

async function updateProfile(userId, updates) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    return { data, error };
}

// --- STORAGE ---
async function uploadImage(bucket, filePath, file) {
    const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });
    if (error) return { url: null, error };
    const { data: urlData } = supabaseClient.storage
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

// --- NOTIFICATIONS ---
async function fetchNotifications(userId) {
    const { data, error } = await supabaseClient
        .from('notifications')
        .select(`
            *,
            actor:actor_id (id, full_name, nickname, avatar_url),
            post:post_id (id, title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
    return { data, error };
}

async function getUnreadNotificationCount(userId) {
    const { count, error } = await supabaseClient
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
    return { count, error };
}

async function markNotificationRead(notificationId) {
    const { error } = await supabaseClient
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    return { error };
}

async function markAllNotificationsRead(userId) {
    const { error } = await supabaseClient
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    return { error };
}

function subscribeToNotifications(userId, callback) {
    return supabaseClient
        .channel('public:notifications')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
        }, payload => {
            callback(payload.new);
        })
        .subscribe();
}
