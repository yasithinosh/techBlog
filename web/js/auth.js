// ============================================
// INOVOID — Auth Guards & Session Management
// ============================================

// Helper: detect whether we're in /pages/ subfolder
function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
}
function getPagesPath() {
    return window.location.pathname.includes('/pages/') ? '' : 'pages/';
}

// Get current session
async function getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

// Get current user
async function getCurrentUser() {
    const session = await getSession();
    return session?.user || null;
}

// Auth guard — redirect to login if not authenticated
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = getPagesPath() + 'login.html';
        return null;
    }
    return user;
}

// Redirect if already logged in (for login/signup pages)
async function redirectIfLoggedIn() {
    const user = await getCurrentUser();
    if (user) {
        window.location.href = 'feed.html';
    }
}

// Sign up with email and password
async function signUp(email, password, fullName) {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                nickname: 'user_' + Math.random().toString(36).substring(2, 8)
            }
        }
    });
    return { data, error };
}

// Sign in with email and password
async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
}

// Sign out
async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = getBasePath() + 'index.html';
}

// Update password
async function updatePassword(newPassword) {
    const { data, error } = await supabaseClient.auth.updateUser({
        password: newPassword
    });
    return { data, error };
}

// Listen for auth state changes
function onAuthStateChange(callback) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// Update nav UI based on auth state
async function updateNavAuth() {
    const user = await getCurrentUser();
    // Show/hide auth-dependent elements
    document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
        el.style.display = user ? '' : 'none';
    });
    document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
        el.style.display = user ? 'none' : '';
    });
    // Set user avatar if present
    if (user) {
        const { data: profile } = await fetchProfile(user.id);
        document.querySelectorAll('[data-auth-avatar]').forEach(img => {
            if (profile?.avatar_url) img.src = profile.avatar_url;
        });
        document.querySelectorAll('[data-auth-name]').forEach(el => {
            el.textContent = profile?.full_name || user.email;
        });

        // Initialize notifications (if script is loaded)
        if (typeof initNotifications === 'function') {
            initNotifications(user);
        }
    }
}

// Show loading indicator
function showLoading(container) {
    container.innerHTML = `
        <div class="flex justify-center items-center py-12">
            <div class="flex gap-2">
                <div class="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                <div class="w-2 h-2 rounded-full bg-primary animate-bounce" style="animation-delay:-0.15s"></div>
                <div class="w-2 h-2 rounded-full bg-primary animate-bounce" style="animation-delay:-0.3s"></div>
            </div>
        </div>`;
}

// Show error message
function showError(container, message) {
    container.innerHTML = `
        <div class="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
            <span class="material-icons text-lg">error</span>
            <p class="text-sm font-medium">${message}</p>
        </div>`;
}

// Show success message
function showSuccess(container, message) {
    container.innerHTML = `
        <div class="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
            <span class="material-icons text-lg">check_circle</span>
            <p class="text-sm font-medium">${message}</p>
        </div>`;
}

// Toast notification
function showToast(message, type = 'info') {
    const colors = {
        info: 'bg-primary text-white',
        success: 'bg-emerald-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black'
    };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-xl font-medium text-sm shadow-xl ${colors[type]} transition-all transform translate-y-0 opacity-100`;
    toast.style.animation = 'fadeInUp 0.3s ease-out';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Format relative time
function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
