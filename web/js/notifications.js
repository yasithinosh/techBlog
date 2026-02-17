// ============================================
// INOVOID — Notification UI Logic
// ============================================

let isNotifPanelOpen = false;

// Initialize notifications (called by auth.js on login)
async function initNotifications(user) {
    if (!user) return;

    // Initial fetch
    await updateNotificationBadge(user.id);

    // Subscribe to real-time updates
    subscribeToNotifications(user.id, (payload) => {
        console.log('[inovoid] New notification:', payload);
        showToast('New notification received', 'info');
        updateNotificationBadge(user.id);
        // If panel is open, refresh list
        if (isNotifPanelOpen) {
            renderNotifications(user.id);
        }
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notif-panel');
        const btn = document.getElementById('notif-btn');
        if (isNotifPanelOpen && panel && !panel.contains(e.target) && !btn.contains(e.target)) {
            toggleNotifications();
        }
    });
}

// Toggle panel visibility
async function toggleNotifications() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;

    isNotifPanelOpen = !isNotifPanelOpen;

    if (isNotifPanelOpen) {
        panel.classList.remove('hidden');
        const user = await getCurrentUser();
        if (user) renderNotifications(user.id);
    } else {
        panel.classList.add('hidden');
    }
}

// Update the red badge count
async function updateNotificationBadge(userId) {
    const { count, error } = await getUnreadNotificationCount(userId);
    const badge = document.getElementById('notif-badge');

    if (badge) {
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// Render list of notifications
async function renderNotifications(userId) {
    const list = document.getElementById('notif-list');
    if (!list) return;

    list.innerHTML = '<div class="p-4 text-center"><div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>';

    const { data: notifications, error } = await fetchNotifications(userId);

    if (error || !notifications || notifications.length === 0) {
        list.innerHTML = '<div class="p-8 text-center text-slate-500 text-xs">No notifications yet</div>';
        return;
    }

    list.innerHTML = '';

    notifications.forEach(n => {
        const isRead = n.read;
        const actorName = n.actor?.full_name || n.actor?.nickname || 'Someone';
        const actorAvatar = n.actor?.avatar_url || `https://ui-avatars.com/api/?name=${actorName}&background=random`;

        let text = '';
        let icon = '';
        let href = '#';

        if (n.type === 'like') {
            text = `<strong>${escapeHtml(actorName)}</strong> liked your post <em>${escapeHtml(n.post?.title || 'Untitled')}</em>`;
            icon = 'favorite';
            href = n.post_id ? `post.html?id=${n.post_id}` : '#';
            // Adjust href for index.html context
            if (!window.location.pathname.includes('/pages/')) {
                href = 'pages/' + href;
            }
        } else if (n.type === 'comment') {
            text = `<strong>${escapeHtml(actorName)}</strong> commented on <em>${escapeHtml(n.post?.title || 'Untitled')}</em>`;
            icon = 'chat_bubble';
            href = n.post_id ? `post.html?id=${n.post_id}` : '#';
            if (!window.location.pathname.includes('/pages/')) {
                href = 'pages/' + href;
            }
        }

        const item = document.createElement('div');
        item.className = `p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 ${isRead ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10'}`;
        item.onclick = async () => {
            // Mark read and navigate
            if (!isRead) {
                await markNotificationRead(n.id);
                updateNotificationBadge(userId);
            }
            window.location.href = href;
        };

        item.innerHTML = `
            <img src="${actorAvatar}" class="w-8 h-8 rounded-full object-cover mt-1" alt="Avatar">
            <div class="flex-1">
                <p class="text-xs text-slate-700 dark:text-slate-300 leading-snug">${text}</p>
                <p class="text-[10px] text-slate-400 mt-1">${timeAgo(n.created_at)}</p>
            </div>
            <div class="flex flex-col items-center justify-center">
                <span class="material-icons text-xs ${n.type === 'like' ? 'text-pink-500' : 'text-blue-500'}">${icon}</span>
                ${!isRead ? '<span class="w-2 h-2 bg-primary rounded-full mt-1"></span>' : ''}
            </div>
        `;
        list.appendChild(item);
    });
}

async function markAllRead() {
    const user = await getCurrentUser();
    if (user) {
        await markAllNotificationsRead(user.id);
        updateNotificationBadge(user.id);
        renderNotifications(user.id);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
